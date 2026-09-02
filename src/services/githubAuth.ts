export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
  html_url: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
}

export interface AuthSession {
  token: string
  user: GitHubUser
  repoName: string
  linkedGoogleEmail?: string
  connectedAt: string
}

const STORAGE_KEY = 'the_journal_library_auth'

/**
 * Loads stored authentication session.
 */
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Saves authentication session to local storage.
 */
export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

/**
 * Clears stored authentication session.
 */
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Validates a GitHub Personal Access Token or OAuth token and fetches user profile.
 */
export async function validateGitHubToken(token: string): Promise<GitHubUser> {
  const cleanToken = token.trim()
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid GitHub token. Please verify your token.')
    if (res.status === 403) throw new Error('Rate limited or insufficient permissions.')
    throw new Error(`GitHub API error: ${res.statusText}`)
  }

  const user = await res.json()
  return user as GitHubUser
}

/**
 * Fetches user repositories to let the user select or create a journal vault.
 */
export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const cleanToken = token.trim()
  const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch repositories.')
  }

  return await res.json()
}

/**
 * Ensures the dedicated private journal vault repository exists on GitHub, creating it if needed.
 */
export async function ensureVaultRepo(token: string, repoName = 'the-journal-vault'): Promise<GitHubRepo> {
  const cleanToken = token.trim()
  const user = await validateGitHubToken(cleanToken)
  
  // 1. Check if repo exists
  const checkRes = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (checkRes.ok) {
    return await checkRes.json()
  }

  // 2. Create if not found
  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      description: 'The Journal Library - Private sovereign data vault',
      private: true,
      auto_init: true,
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create private journal repository.')
  }

  return await createRes.json()
}
