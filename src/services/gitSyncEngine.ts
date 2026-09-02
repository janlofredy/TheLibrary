import { db } from '@/db'
import { getStoredSession } from './githubAuth'

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
  lastSyncedAt: Date | null
  pendingEdits: number
  errorMessage: string | null
}

class GitSyncEngine {
  private status: SyncStatus = {
    state: 'idle',
    lastSyncedAt: null,
    pendingEdits: 0,
    errorMessage: null,
  }

  private debounceTimer: NodeJS.Timeout | null = null
  private listeners: ((status: SyncStatus) => void)[] = []

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

  private notify() {
    this.listeners.forEach(l => l(this.getStatus()))
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
   * Pulls and hydrates local IndexedDB cache from the remote repository.
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
            await db.pages.put(parsed)
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
