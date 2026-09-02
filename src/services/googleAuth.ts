import { getStoredSession, saveSession } from './githubAuth'

export interface GoogleUserProfile {
  email: string
  name: string
  picture?: string
  sub: string
}

/**
 * Links a verified Google account email to the active GitHub session.
 */
export function linkGoogleAccount(googleEmail: string): boolean {
  const session = getStoredSession()
  if (!session) return false

  session.linkedGoogleEmail = googleEmail
  saveSession(session)
  return true
}

/**
 * Unlinks Google account from active session.
 */
export function unlinkGoogleAccount(): boolean {
  const session = getStoredSession()
  if (!session) return false

  delete session.linkedGoogleEmail
  saveSession(session)
  return true
}
