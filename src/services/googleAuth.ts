import { getStoredSession, saveSession, type AuthSession, type GoogleUserProfile } from './githubAuth'

export type { GoogleUserProfile }

const GOOGLE_CLIENT_ID_KEY = 'the_library_google_client_id'
const DEFAULT_CLIENT_ID = '1082578643872-thejournallibrary.apps.googleusercontent.com'

/**
 * Gets the configured Google OAuth Client ID.
 */
export function getGoogleClientId(): string {
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || DEFAULT_CLIENT_ID
}

/**
 * Sets a custom Google OAuth Client ID in local storage.
 */
export function setGoogleClientId(clientId: string): void {
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim())
}

/**
 * Decodes a Google OpenID Connect (OIDC) JWT ID token payload.
 */
export function parseGoogleJwt(credential: string): GoogleUserProfile {
  try {
    const base64Url = credential.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const data = JSON.parse(jsonPayload)

    return {
      sub: data.sub || `google_${Date.now()}`,
      email: data.email || 'user@gmail.com',
      name: data.name || data.given_name || 'Google Journaler',
      picture: data.picture || '',
      email_verified: !!data.email_verified,
    }
  } catch (err) {
    throw new Error('Failed to parse Google JWT credential. Invalid token format.')
  }
}

/**
 * Dynamically loads the official Google Identity Services script if not already present.
 */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as unknown as { google?: { accounts?: { id: unknown } } }).google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.getElementById('google-jssdk')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-jssdk'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK from Google CDN.'))
    document.head.appendChild(script)
  })
}

interface GooglePromptResponse {
  credential: string
  select_by?: string
}

/**
 * Initializes Google Identity Services (GIS) and optionally renders a Sign In button.
 */
export async function initGoogleIdentityServices(options: {
  clientId?: string
  buttonContainerId?: string
  callback: (profile: GoogleUserProfile, rawCredential: string) => void
}): Promise<boolean> {
  try {
    await loadGoogleIdentityScript()

    const google = (window as unknown as {
      google: {
        accounts: {
          id: {
            initialize: (cfg: { client_id: string; callback: (res: GooglePromptResponse) => void; auto_select?: boolean }) => void
            renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
            prompt: () => void
          }
        }
      }
    }).google

    if (!google?.accounts?.id) return false

    const clientId = options.clientId || getGoogleClientId()

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: GooglePromptResponse) => {
        if (res.credential) {
          const profile = parseGoogleJwt(res.credential)
          options.callback(profile, res.credential)
        }
      },
      auto_select: false,
    })

    if (options.buttonContainerId) {
      const el = document.getElementById(options.buttonContainerId)
      if (el) {
        google.accounts.id.renderButton(el, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280,
        })
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Creates an authenticated session for a Google user.
 */
export function createGoogleSession(profile: GoogleUserProfile): AuthSession {
  const loginHandle = profile.email.split('@')[0] || `google_${profile.sub.slice(0, 6)}`
  const newSession: AuthSession = {
    provider: 'google',
    user: {
      id: profile.sub,
      login: loginHandle,
      name: profile.name,
      avatar_url: profile.picture || '',
      email: profile.email,
    },
    googleProfile: profile,
    linkedGoogleEmail: profile.email,
    connectedAt: new Date().toISOString(),
  }

  saveSession(newSession)
  return newSession
}

/**
 * Links a verified Google profile to the active GitHub session.
 */
export function linkGoogleProfile(profile: GoogleUserProfile): boolean {
  const session = getStoredSession()
  if (!session) return false

  session.googleProfile = profile
  session.linkedGoogleEmail = profile.email
  session.provider = 'hybrid'
  saveSession(session)
  return true
}

/**
 * Links a verified Google account email to the active GitHub session by email address.
 */
export function linkGoogleAccount(googleEmail: string): boolean {
  const session = getStoredSession()
  if (!session) return false

  session.linkedGoogleEmail = googleEmail
  if (session.provider === 'github') {
    session.provider = 'hybrid'
  }
  saveSession(session)
  return true
}

/**
 * Unlinks Google account from active session.
 */
export function unlinkGoogleAccount(): boolean {
  const session = getStoredSession()
  if (!session) return false

  delete session.googleProfile
  delete session.linkedGoogleEmail
  if (session.token) {
    session.provider = 'github'
  }
  saveSession(session)
  return true
}
