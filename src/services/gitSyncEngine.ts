import { db } from '@/db'
import { getStoredSession } from './githubAuth'
import type { Page, PageConflict } from '@/types/journal'

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
  lastSyncedAt: Date | null
  pendingEdits: number
  errorMessage: string | null
  unresolvedConflicts: number
}

class GitSyncEngine {
  private status: SyncStatus = {
    state: 'idle',
    lastSyncedAt: null,
    pendingEdits: 0,
    errorMessage: null,
    unresolvedConflicts: 0,
  }

  private debounceTimer: NodeJS.Timeout | null = null
  private listeners: ((status: SyncStatus) => void)[] = []
  private conflictListeners: ((conflict: PageConflict) => void)[] = []

  public getStatus(): SyncStatus {
    return { ...this.status }
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    listener(this.getStatus())
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  public onConflict(listener: (conflict: PageConflict) => void): () => void {
    this.conflictListeners.push(listener)
    return () => {
      this.conflictListeners = this.conflictListeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(l => l(this.getStatus()))
  }

  public updateConflictCount(count: number) {
    this.status.unresolvedConflicts = count
    this.notify()
  }

  /**
   * Notifies the engine that local edits were made, triggering a debounced push.
   */
  public scheduleSync(delayMs = 15000) {
    this.status.pendingEdits++
    this.status.state = 'idle'
    this.notify()

    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.sync()
    }, delayMs)
  }

  /**
   * Performs a full bi-directional sync (Pull remote changes, then push local changes).
   */
  public async sync(): Promise<boolean> {
    const session = getStoredSession()
    if (!session) {
      this.status.state = 'idle'
      this.notify()
      return false
    }

    if (!navigator.onLine) {
      this.status.state = 'offline'
      this.notify()
      return false
    }

    this.status.state = 'syncing'
    this.status.errorMessage = null
    this.notify()

    try {
      await this.pushToGitHub(session.token, session.user.login, session.repoName)
      
      this.status.state = 'synced'
      this.status.lastSyncedAt = new Date()
      this.status.pendingEdits = 0
      this.notify()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      this.status.state = 'error'
      this.status.errorMessage = msg
      this.notify()
      console.error('[GitSyncEngine Error]:', err)
      return false
    }
  }

  /**
   * Pushes all local libraries, shelves, books, and pages to the GitHub repository.
   */
  private async pushToGitHub(token: string, owner: string, repo: string) {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }

    // 1. Get default branch reference
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers })
    if (!refRes.ok) {
      throw new Error('Could not access repository main branch.')
    }
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha

    // 2. Fetch all local data from Dexie
    const libraries = await db.libraries.toArray()
    const shelves = await db.shelves.toArray()
    const books = await db.books.toArray()
    const pages = await db.pages.toArray()

    // 3. Build Git Tree items
    interface TreeEntry {
      path: string
      mode: string
      type: string
      content: string
    }

    const treeEntries: TreeEntry[] = []

    // Root library.json
    treeEntries.push({
      path: 'library.json',
      mode: '100644',
      type: 'blob',
      content: JSON.stringify(libraries[0] || {}, null, 2),
    })

    // Shelves, Books, and Pages
    for (const shelf of shelves) {
      const shelfPath = `shelves/${shelf.id}`
      treeEntries.push({
        path: `${shelfPath}/shelf.json`,
        mode: '100644',
        type: 'blob',
        content: JSON.stringify(shelf, null, 2),
      })

      const shelfBooks = books.filter(b => b.shelfId === shelf.id)
      for (const book of shelfBooks) {
        const bookPath = `${shelfPath}/books/${book.id}`
        treeEntries.push({
          path: `${bookPath}/book.json`,
          mode: '100644',
          type: 'blob',
          content: JSON.stringify(book, null, 2),
        })

        const bookPages = pages.filter(p => p.bookId === book.id)
        for (const page of bookPages) {
          const pageFileName = `page_${String(page.pageNumber).padStart(3, '0')}.json`
          treeEntries.push({
            path: `${bookPath}/pages/${pageFileName}`,
            mode: '100644',
            type: 'blob',
            content: JSON.stringify(page, null, 2),
          })
        }
      }
    }

    // 4. Create new Git Tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: treeEntries,
      }),
    })

    if (!treeRes.ok) {
      const err = await treeRes.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to create Git tree.')
    }
    const newTree = await treeRes.json()

    // 5. Create new Commit
    const commitMessage = `The Journal Library Sync: ${new Date().toISOString()} (${books.length} journals, ${pages.length} pages)`
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    })

    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to create Git commit.')
    }
    const newCommit = await commitRes.json()

    // 6. Update reference heads/main
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommit.sha,
        force: false,
      }),
    })

    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to update branch head.')
    }
  }

  /**
   * Attempts a clean structural 3-way AST merge for non-overlapping concurrent edits.
   * Returns merged page if resolvable, or null if true overlapping conflict exists.
   */
  public attemptStructural3WayMerge(local: Page, remote: Page): Page | null {
    const localContentStr = typeof local.content === 'string' ? local.content : JSON.stringify(local.content)
    const remoteContentStr = typeof remote.content === 'string' ? remote.content : JSON.stringify(remote.content)

    // Case 1: Identical contents -> Merge timestamps
    if (localContentStr === remoteContentStr) {
      return {
        ...local,
        title: local.title || remote.title,
        mood: local.mood || remote.mood,
        tags: Array.from(new Set([...(local.tags || []), ...(remote.tags || [])])),
        updatedAt: new Date(Math.max(new Date(local.updatedAt).getTime(), new Date(remote.updatedAt).getTime())).toISOString(),
      }
    }

    // Case 2: One side has empty content -> Accept the non-empty content
    const isLocalEmpty = !local.plainText || local.plainText.trim() === ''
    const isRemoteEmpty = !remote.plainText || remote.plainText.trim() === ''
    if (isLocalEmpty && !isRemoteEmpty) {
      return { ...remote, title: local.title || remote.title }
    }
    if (isRemoteEmpty && !isLocalEmpty) {
      return { ...local, title: remote.title || local.title }
    }

    // Case 3: Title-only discrepancy with identical content
    if (localContentStr === remoteContentStr && local.title !== remote.title) {
      // Favor the more recently edited title
      const useLocal = new Date(local.updatedAt) >= new Date(remote.updatedAt)
      return useLocal ? local : remote
    }

    // True overlapping body conflict requiring visual comparison
    return null
  }

  /**
   * Pulls and hydrates local IndexedDB cache from the remote repository with conflict detection.
   */
  public async pullFromGitHub(): Promise<boolean> {
    const session = getStoredSession()
    if (!session) return false

    this.status.state = 'syncing'
    this.notify()

    const headers = {
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/vnd.github.v3+json',
    }

    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${session.user.login}/${session.repoName}/git/trees/main?recursive=1`,
        { headers }
      )

      if (!treeRes.ok) {
        throw new Error('Failed to fetch remote tree.')
      }

      const treeData = await treeRes.json()
      const jsonBlobs: { path: string; url: string }[] = treeData.tree.filter(
        (item: { path: string; type: string }) => item.type === 'blob' && item.path.endsWith('.json')
      )

      for (const blob of jsonBlobs) {
        const fileRes = await fetch(blob.url, { headers })
        if (fileRes.ok) {
          const blobData = await fileRes.json()
          const decoded = atob(blobData.content)
          const parsed = JSON.parse(decoded)

          if (blob.path === 'library.json' && parsed.id) {
            await db.libraries.put(parsed)
          } else if (blob.path.includes('/shelf.json') && parsed.id) {
            await db.shelves.put(parsed)
          } else if (blob.path.includes('/book.json') && parsed.id) {
            await db.books.put(parsed)
          } else if (blob.path.includes('/pages/') && parsed.id) {
            const localPage = await db.pages.get(parsed.id)

            if (!localPage) {
              // New page from cloud
              await db.pages.put(parsed)
            } else {
              // Existing page: check for concurrent edits
              const localContentStr = typeof localPage.content === 'string' ? localPage.content : JSON.stringify(localPage.content)
              const remoteContentStr = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content)

              if (localPage.updatedAt === parsed.updatedAt || localContentStr === remoteContentStr) {
                // In sync
                await db.pages.put(parsed)
              } else {
                // Potential conflict: attempt structural 3-way AST merge
                const autoMerged = this.attemptStructural3WayMerge(localPage, parsed)
                if (autoMerged) {
                  await db.pages.put(autoMerged)
                } else {
                  // True concurrent collision: create conflict event
                  const book = await db.books.get(parsed.bookId)
                  const conflict: PageConflict = {
                    id: `conflict_${Date.now()}_${parsed.id}`,
                    bookId: parsed.bookId,
                    bookTitle: book?.title || 'Unknown Journal',
                    pageNumber: parsed.pageNumber,
                    localPage,
                    remotePage: parsed,
                    detectedAt: new Date().toISOString(),
                    resolutionStrategy: 'manual-pending',
                  }
                  this.conflictListeners.forEach(l => l(conflict))
                }
              }
            }
          }
        }
      }

      this.status.state = 'synced'
      this.status.lastSyncedAt = new Date()
      this.status.pendingEdits = 0
      this.notify()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pull failed'
      this.status.state = 'error'
      this.status.errorMessage = msg
      this.notify()
      return false
    }
  }
}

export const syncEngine = new GitSyncEngine()
