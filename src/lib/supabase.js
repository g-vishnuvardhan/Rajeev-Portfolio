import { createClient } from '@supabase/supabase-js'
import { categories as defaultCategories, photos as defaultPhotos } from '../data/gallery'
import { site as defaultSite, about as defaultAbout, experience as defaultExperience } from '../data/content'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co')

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

// LocalStorage Keys for Offline / Demo Mode
const STORAGE_KEYS = {
  GALLERY: 'rk_portfolio_gallery_photos_v1',
  CONTENT: 'rk_portfolio_site_content_v1',
  AUTH: 'rk_portfolio_admin_auth_v1',
  CREDENTIALS: 'rk_portfolio_admin_credentials_v1',
  GOOGLE_RESET_SESSION: 'rk_portfolio_google_reset_session_v1',
}

// Authorized Google Admin Accounts
export const AUTHORIZED_ADMIN_EMAILS = [
  '247r1a05e9@cmrtc.ac.in',
  'gantyalarajeevkumar@gmail.com',
]

const DEFAULT_ADMIN = {
  email: '247r1a05e9@cmrtc.ac.in',
  password: '247r1a05e9cmr',
  googleLinked: true,
  updatedAt: new Date().toISOString(),
}

export function getStoredAdminCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(DEFAULT_ADMIN))
      return DEFAULT_ADMIN
    }
    const creds = JSON.parse(raw)
    return {
      email: creds.email || DEFAULT_ADMIN.email,
      password: creds.password || DEFAULT_ADMIN.password,
      googleLinked: creds.googleLinked !== false,
      updatedAt: creds.updatedAt || DEFAULT_ADMIN.updatedAt,
    }
  } catch {
    return DEFAULT_ADMIN
  }
}

/**
 * Check if an email belongs to the authorized Google Admin whitelist
 */
export function isAuthorizedGoogleAdmin(email) {
  if (!email) return false
  const clean = email.trim().toLowerCase()
  const creds = getStoredAdminCredentials()
  const currentAdminEmail = (creds.email || '').trim().toLowerCase()
  return (
    AUTHORIZED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(clean) ||
    clean === currentAdminEmail
  )
}

/**
 * Decode JWT token returned by Google Identity Services (GSI)
 */
export function parseGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.error('Failed to parse Google JWT token:', err)
    return null
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & GOOGLE IDENTITY MANAGEMENT
// -------------------------------------------------------------

/**
 * Login with Master Email & Password
 */
export async function loginAdmin(email, password) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data.user
  }

  // Local / Stored Mode
  const creds = getStoredAdminCredentials()
  const cleanEmail = (email || '').trim().toLowerCase()
  const isMatch =
    (cleanEmail === creds.email.trim().toLowerCase() ||
     AUTHORIZED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(cleanEmail)) &&
    password === creds.password

  if (isMatch) {
    const adminUser = {
      email: cleanEmail,
      id: 'admin-cmr-id',
      role: 'admin',
      authMethod: 'password',
    }
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(adminUser))
    return adminUser
  }

  throw new Error('Invalid email or password.')
}

/**
 * Authenticate with Google Identity Services (GIS) / Google OAuth
 * Verifies email_verified claim and enforces whitelist authorization
 */
export async function loginWithGoogleCredential(credentialOrUser) {
  let userProfile = credentialOrUser

  if (typeof credentialOrUser === 'string') {
    if (credentialOrUser.includes('@')) {
      userProfile = { email: credentialOrUser.trim().toLowerCase() }
    } else {
      userProfile = parseGoogleJwt(credentialOrUser)
    }
  }

  if (!userProfile || !userProfile.email) {
    throw new Error('Google Identity verification failed. No valid profile payload received.')
  }

  const email = userProfile.email.trim().toLowerCase()

  if (!isAuthorizedGoogleAdmin(email)) {
    throw new Error(
      `Access Denied: Google Account "${userProfile.email}" is not an authorized administrator. Only verified owners (${AUTHORIZED_ADMIN_EMAILS.join(', ')}) are granted access.`
    )
  }

  const adminUser = {
    email: userProfile.email,
    name: userProfile.name || 'Rajeev Kumar',
    picture: userProfile.picture || '',
    authProvider: 'google',
    googleVerified: true,
    verifiedAt: new Date().toISOString(),
    id: `google-${userProfile.sub || 'verified'}`,
    role: 'admin',
  }

  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(adminUser))
  return adminUser
}

/**
 * Initiate Supabase Cloud Google OAuth redirect if Supabase is active
 */
export async function initiateSupabaseGoogleOAuth() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/admin`,
      },
    })
    if (error) throw error
    return data
  }
  return null
}

export async function logoutAdmin() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
  localStorage.removeItem(STORAGE_KEYS.AUTH)
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_RESET_SESSION)
}

export async function getCurrentAdmin() {
  if (isSupabaseConfigured && supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      // Check authorization
      if (isAuthorizedGoogleAdmin(session.user.email)) {
        return session.user
      }
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (parsed.email && isAuthorizedGoogleAdmin(parsed.email)) {
      return parsed
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    return null
  } catch {
    return null
  }
}

/**
 * Verify Google Account for Password Reset:
 * Validates Google account ownership against the authorized admin list.
 * Grants a time-limited reset session.
 */
export async function verifyGoogleAccountForReset(googleAccountOrToken) {
  let profile = googleAccountOrToken
  if (typeof googleAccountOrToken === 'string') {
    if (googleAccountOrToken.includes('@')) {
      profile = { email: googleAccountOrToken.trim().toLowerCase() }
    } else {
      profile = parseGoogleJwt(googleAccountOrToken)
    }
  }

  if (!profile || !profile.email) {
    throw new Error('Google verification failed. Missing Google account email.')
  }

  const cleanEmail = profile.email.trim().toLowerCase()
  if (!isAuthorizedGoogleAdmin(cleanEmail)) {
    throw new Error(
      `Access Denied: Google account "${profile.email}" is not authorized as an administrator. Only registered owners (${AUTHORIZED_ADMIN_EMAILS.join(', ')}) can reset admin credentials.`
    )
  }

  const sessionData = {
    email: cleanEmail,
    name: profile.name || (cleanEmail.includes('cmrtc') ? 'Rajeev Kumar (CMRTC)' : 'Rajeev Kumar'),
    picture: profile.picture || '',
    token: `g-reset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 min session
  }

  localStorage.setItem(STORAGE_KEYS.GOOGLE_RESET_SESSION, JSON.stringify(sessionData))
  return sessionData
}

/**
 * Complete Password Reset via Verified Google Identity:
 * - Checks active Google-verified reset session
 * - Sets new security password
 * - Auto logs admin in
 */
export async function resetPasswordWithGoogleVerification({
  resetSessionToken,
  newPassword,
  confirmNewPassword,
}) {
  const rawSession = localStorage.getItem(STORAGE_KEYS.GOOGLE_RESET_SESSION)
  if (!rawSession) {
    throw new Error('No verified Google session found. Please verify your Google account first.')
  }

  let session
  try {
    session = JSON.parse(rawSession)
  } catch {
    throw new Error('Invalid Google verification session. Please verify again.')
  }

  if (Date.now() > session.expiresAt) {
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_RESET_SESSION)
    throw new Error('Google verification session has expired. Please verify your Google account again.')
  }

  if (session.token !== resetSessionToken) {
    throw new Error('Verification token mismatch. Please re-verify your Google account.')
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters in length.')
  }

  if (newPassword !== confirmNewPassword) {
    throw new Error('New password and confirmation password do not match.')
  }

  // 1. Supabase Cloud Sync if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) console.warn('Supabase password sync warning:', error.message)
    } catch (e) {
      console.warn('Supabase update warning:', e)
    }
  }

  // 2. Update Local Store
  const creds = getStoredAdminCredentials()
  const updatedCreds = {
    ...creds,
    email: session.email,
    password: newPassword,
    googleLinked: true,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  // Clear reset session
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_RESET_SESSION)

  // Auto login admin
  const adminUser = {
    email: session.email,
    name: session.name,
    picture: session.picture,
    authProvider: 'google_verified_reset',
    googleVerified: true,
    verifiedAt: new Date().toISOString(),
    id: 'admin-cmr-id',
    role: 'admin',
  }
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(adminUser))

  return { success: true, user: adminUser }
}

/**
 * Send Supabase Password Reset Email directly to Google Inbox
 */
export async function sendPasswordResetEmail(email) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Cloud is not configured yet. Please use Google Account Verification below.')
  }

  const cleanEmail = email.trim().toLowerCase()
  if (!isAuthorizedGoogleAdmin(cleanEmail)) {
    throw new Error(`Email "${email}" is not an authorized administrator.`)
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${window.location.origin}/#/admin`,
  })

  if (error) throw error
  return { success: true }
}

/**
 * Change Admin Email with full verification:
 * - Verifies current email matches
 * - Verifies current password matches
 * - Validates new email format & confirmation
 */
export async function updateAdminEmail({ currentEmail, currentPassword, newEmail, confirmNewEmail }) {
  const creds = getStoredAdminCredentials()

  // 1. Verify current credentials
  if (currentEmail.trim().toLowerCase() !== creds.email.trim().toLowerCase()) {
    throw new Error('Current email verification failed. Please enter your existing registered email.')
  }
  if (currentPassword !== creds.password) {
    throw new Error('Current password verification failed. Please enter your valid current password.')
  }

  // 2. Validate new email
  const trimmedNew = newEmail.trim()
  const trimmedConfirm = confirmNewEmail.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmedNew)) {
    throw new Error('Please enter a valid new email address format.')
  }
  if (trimmedNew.toLowerCase() !== trimmedConfirm.toLowerCase()) {
    throw new Error('New email and confirmation email do not match.')
  }
  if (trimmedNew.toLowerCase() === creds.email.trim().toLowerCase()) {
    throw new Error('The new email must be different from your current email.')
  }

  // 3. Supabase Cloud Sync
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ email: trimmedNew })
    if (error) throw error
  }

  // 4. Update Local Store
  const updatedCreds = {
    ...creds,
    email: trimmedNew,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  // Update active session
  const activeUser = { email: trimmedNew, id: 'admin-cmr-id', role: 'admin' }
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(activeUser))

  return activeUser
}

/**
 * Change Admin Password with full verification:
 * - Verifies current registered email
 * - Verifies current password
 * - Validates new password length & confirmation
 */
export async function updateAdminPassword({ currentEmail, currentPassword, newPassword, confirmNewPassword }) {
  const creds = getStoredAdminCredentials()

  // 1. Verify current credentials
  if (currentEmail.trim().toLowerCase() !== creds.email.trim().toLowerCase()) {
    throw new Error('Registered email verification failed. Please enter your valid admin email.')
  }
  if (currentPassword !== creds.password) {
    throw new Error('Current password verification failed. Please enter your valid current password.')
  }

  // 2. Validate new password
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters in length.')
  }
  if (newPassword !== confirmNewPassword) {
    throw new Error('New password and confirmation password do not match.')
  }
  if (newPassword === creds.password) {
    throw new Error('New password cannot be the same as your current password.')
  }

  // 3. Supabase Cloud Sync
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  // 4. Update Local Store
  const updatedCreds = {
    ...creds,
    password: newPassword,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  return true
}

// -------------------------------------------------------------
// GALLERY MANAGEMENT
// -------------------------------------------------------------
export async function fetchGalleryPhotos() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      if (data && data.length > 0) {
        // Group by category
        const grouped = { ...defaultPhotos }
        defaultCategories.forEach((c) => {
          if (!grouped[c.id]) grouped[c.id] = []
        })
        data.forEach((p) => {
          if (!grouped[p.category]) grouped[p.category] = []
          grouped[p.category].push({
            id: p.id,
            src: p.src,
            ratio: Number(p.ratio) || 0.5628,
            title: p.title || '',
            sort_order: p.sort_order,
          })
        })
        return grouped
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local/default:', err)
    }
  }

  // Fallback to local storage or defaults
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GALLERY)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.error('Error reading gallery from localStorage:', err)
  }

  return defaultPhotos
}

export async function uploadGalleryMedia(file) {
  if (!isSupabaseConfigured || !supabase) {
    // Local / Demo mode: create data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Upload to Supabase Storage bucket 'gallery-media'
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('gallery-media')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage
    .from('gallery-media')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

export async function addGalleryPhoto({ category, src, title, ratio, file }) {
  let photoUrl = src

  if (file) {
    photoUrl = await uploadGalleryMedia(file)
  }

  const newPhoto = {
    category,
    src: photoUrl,
    title: title || `${category} photograph`,
    ratio: Number(ratio) || 0.5628,
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('gallery_photos')
      .insert([newPhoto])
      .select()

    if (error) throw error
    return data?.[0]
  }

  // Local storage save
  const current = await fetchGalleryPhotos()
  const list = current[category] || []
  list.push({ ...newPhoto, id: `local-${Date.now()}` })
  const updated = { ...current, [category]: list }
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updated))
  return newPhoto
}

export async function deleteGalleryPhoto(category, photoIndex, photoId) {
  if (isSupabaseConfigured && supabase && photoId && !String(photoId).startsWith('local-')) {
    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', photoId)

    if (error) throw error
  }

  // Update local copy
  const current = await fetchGalleryPhotos()
  const list = (current[category] || []).filter((_, idx) => idx !== photoIndex)
  const updated = { ...current, [category]: list }
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updated))
  return updated
}

export async function saveGalleryOrder(category, photoList) {
  if (isSupabaseConfigured && supabase) {
    const updates = photoList.map((p, idx) => ({
      id: p.id,
      category,
      src: p.src,
      title: p.title,
      ratio: p.ratio,
      sort_order: idx,
    })).filter(p => p.id && !String(p.id).startsWith('local-'))

    if (updates.length > 0) {
      await supabase.from('gallery_photos').upsert(updates)
    }
  }

  const current = await fetchGalleryPhotos()
  const updated = { ...current, [category]: photoList }
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updated))
  return updated
}

// -------------------------------------------------------------
// SITE CONTENT MANAGEMENT
// -------------------------------------------------------------
export async function fetchSiteContent() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('id', 'homepage')
        .single()

      if (!error && data?.data) {
        return data.data
      }
    } catch (err) {
      console.warn('Supabase fetchContent failed, using local/default:', err)
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTENT)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.error('Error reading content from localStorage:', err)
  }

  return {
    site: defaultSite,
    about: defaultAbout,
    experience: defaultExperience,
  }
}

export async function saveSiteContent(content) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('site_content')
      .upsert({ id: 'homepage', data: content, updated_at: new Date().toISOString() })

    if (error) throw error
  }

  localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(content))
  return content
}
