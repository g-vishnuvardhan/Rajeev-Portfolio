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
  RECOVERY_OTP: 'rk_portfolio_admin_recovery_otp_v1',
}

const DEFAULT_ADMIN = {
  email: '247r1a05e9@cmrtc.ac.in',
  password: '247r1a05e9cmr',
  phone: '+91 9100305010',
  previousPasswords: [],
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
      phone: creds.phone || DEFAULT_ADMIN.phone,
      previousPasswords: Array.isArray(creds.previousPasswords) ? creds.previousPasswords : [],
      updatedAt: creds.updatedAt || DEFAULT_ADMIN.updatedAt,
    }
  } catch {
    return DEFAULT_ADMIN
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & CREDENTIAL MANAGEMENT
// -------------------------------------------------------------
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
  if (
    email.trim().toLowerCase() === creds.email.trim().toLowerCase() &&
    password === creds.password
  ) {
    const adminUser = { email: creds.email, id: 'admin-cmr-id', role: 'admin' }
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(adminUser))
    return adminUser
  }

  throw new Error('Invalid email or password.')
}

export async function logoutAdmin() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
  localStorage.removeItem(STORAGE_KEYS.AUTH)
}

export async function getCurrentAdmin() {
  if (isSupabaseConfigured && supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    const creds = getStoredAdminCredentials()
    if (parsed.email && parsed.email.toLowerCase() === creds.email.toLowerCase()) {
      return parsed
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    return null
  } catch {
    return null
  }
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

  // 4. Update Local Store & Record previous password in history
  const previous = Array.isArray(creds.previousPasswords) ? [...creds.previousPasswords] : []
  if (!previous.includes(creds.password)) {
    previous.push(creds.password)
  }

  const updatedCreds = {
    ...creds,
    password: newPassword,
    previousPasswords: previous.slice(-10), // keep last 10 for recovery verification
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  return true
}

/**
 * Reset Forgotten Password using Old Password:
 * - Verifies registered admin email
 * - Verifies old/previous password against current password or previous password history
 * - Sets new password
 */
export async function resetAdminPasswordWithOldPassword({ email, oldPassword, newPassword, confirmNewPassword }) {
  const creds = getStoredAdminCredentials()

  // 1. Verify registered email
  if (email.trim().toLowerCase() !== creds.email.trim().toLowerCase()) {
    throw new Error('The email provided does not match the registered admin account.')
  }

  // 2. Verify old password (matches current password OR any stored previous password)
  const previous = Array.isArray(creds.previousPasswords) ? creds.previousPasswords : []
  const matchesCurrent = oldPassword === creds.password
  const matchesPrevious = previous.includes(oldPassword)

  if (!matchesCurrent && !matchesPrevious) {
    throw new Error('Old password verification failed. The provided old password does not match account records.')
  }

  // 3. Validate new password
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters in length.')
  }
  if (newPassword !== confirmNewPassword) {
    throw new Error('New password and confirmation password do not match.')
  }
  if (newPassword === oldPassword) {
    throw new Error('New password must be different from the old password.')
  }

  // 4. Supabase Cloud Sync
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      console.warn('Supabase password reset notice:', error.message)
    }
  }

  // 5. Update Local Store
  const history = [...previous]
  if (!history.includes(creds.password)) {
    history.push(creds.password)
  }

  const updatedCreds = {
    ...creds,
    password: newPassword,
    previousPasswords: history.slice(-10),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  return true
}

/**
 * Request Account Recovery OTP (When user forgot both email & password):
 * - Verifies registered mobile number (Amazon / Flipkart pattern)
 * - Generates cryptographically simulated 6-digit OTP
 * - Saves OTP with 10-minute expiration
 * - Returns OTP details, masked phone, masked email, and WhatsApp URL
 */
export async function sendRecoveryOTP(inputPhone) {
  const creds = getStoredAdminCredentials()
  const cleanInput = (inputPhone || '').replace(/\D/g, '')
  const cleanStored = (creds.phone || DEFAULT_ADMIN.phone).replace(/\D/g, '')

  if (!cleanInput || cleanInput.length < 10) {
    throw new Error('Please enter a valid 10-digit registered mobile number.')
  }

  // Compare the last 10 digits
  if (cleanInput.slice(-10) !== cleanStored.slice(-10)) {
    throw new Error('This mobile number is not registered as the admin recovery number. Please check the number or contact system administrator.')
  }

  // Generate 6-digit OTP code (e.g. 749215)
  const otpCode = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

  const otpData = {
    code: otpCode,
    phone: creds.phone || DEFAULT_ADMIN.phone,
    email: creds.email,
    expiresAt,
  }

  localStorage.setItem(STORAGE_KEYS.RECOVERY_OTP, JSON.stringify(otpData))

  // Mask phone e.g. +91 ••••• 5010
  const last4 = cleanStored.slice(-4)
  const maskedPhone = `+91 ••••• ${last4}`

  // Mask email e.g. 24*******@cmrtc.ac.in
  const [userPart, domainPart] = (creds.email || '').split('@')
  const maskedEmail = userPart && userPart.length > 2
    ? `${userPart.slice(0, 2)}${'*'.repeat(Math.min(userPart.length - 2, 7))}@${domainPart || 'cmrtc.ac.in'}`
    : creds.email

  const whatsappUrl = `https://wa.me/91${cleanStored.slice(-10)}?text=${encodeURIComponent(`[RK Portfolio Security] Your Admin Account Recovery OTP is ${otpCode}. Valid for 10 minutes. Do not share with anyone.`)}`

  return {
    success: true,
    otp: otpCode, // Provided for realistic on-screen notification toast and quick-copy
    phone: creds.phone || DEFAULT_ADMIN.phone,
    maskedPhone,
    maskedEmail,
    whatsappUrl,
    expiresInSeconds: 600,
  }
}

/**
 * Verify Recovery OTP:
 * - Checks if the 6-digit code matches and has not expired
 */
export async function verifyRecoveryOTP(enteredCode) {
  const raw = localStorage.getItem(STORAGE_KEYS.RECOVERY_OTP)
  if (!raw) {
    throw new Error('No active OTP request found. Please request a new OTP first.')
  }

  let otpData
  try {
    otpData = JSON.parse(raw)
  } catch {
    throw new Error('Invalid OTP session. Please request a new OTP.')
  }

  if (Date.now() > otpData.expiresAt) {
    localStorage.removeItem(STORAGE_KEYS.RECOVERY_OTP)
    throw new Error('The OTP has expired. Please request a new verification code.')
  }

  const cleanEntered = (enteredCode || '').trim()
  if (cleanEntered !== otpData.code) {
    throw new Error('Invalid OTP. Please enter the correct 6-digit code sent to your mobile.')
  }

  const creds = getStoredAdminCredentials()
  return {
    verified: true,
    email: creds.email,
    phone: creds.phone || DEFAULT_ADMIN.phone,
  }
}

/**
 * Reset Account via Verified OTP:
 * - Resets password (and optionally updates email)
 * - Updates credentials & records old password into history
 * - Logs admin in automatically
 */
export async function resetAccountViaOTP({ enteredOtp, newPassword, confirmNewPassword, newEmail }) {
  // 1. Verify OTP first
  await verifyRecoveryOTP(enteredOtp)

  const creds = getStoredAdminCredentials()

  // 2. Validate password
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters in length.')
  }
  if (newPassword !== confirmNewPassword) {
    throw new Error('New password and confirmation password do not match.')
  }

  // 3. Optional updated email
  let finalEmail = creds.email
  if (newEmail && newEmail.trim()) {
    const trimmedEmail = newEmail.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Please enter a valid new email address.')
    }
    finalEmail = trimmedEmail
  }

  // 4. Update previous passwords history
  const previous = Array.isArray(creds.previousPasswords) ? [...creds.previousPasswords] : []
  if (!previous.includes(creds.password)) {
    previous.push(creds.password)
  }

  // 5. Cloud Sync
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.updateUser({ password: newPassword, email: finalEmail })
    } catch (err) {
      console.warn('Supabase OTP reset notice:', err.message)
    }
  }

  // 6. Save updated credentials
  const updatedCreds = {
    ...creds,
    email: finalEmail,
    password: newPassword,
    previousPasswords: previous.slice(-10),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  // Clean up used OTP
  localStorage.removeItem(STORAGE_KEYS.RECOVERY_OTP)

  // 7. Auto login
  const activeUser = { email: finalEmail, id: 'admin-cmr-id', role: 'admin' }
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(activeUser))

  return { success: true, user: activeUser, email: finalEmail }
}

/**
 * Update Admin Recovery Phone Number:
 * - From inside Admin Dashboard -> Account Security tab
 */
export async function updateAdminRecoveryPhone({ currentPassword, newPhone }) {
  const creds = getStoredAdminCredentials()
  if (currentPassword !== creds.password) {
    throw new Error('Password verification failed. Enter your current password to update recovery phone.')
  }

  const cleanPhone = (newPhone || '').replace(/\D/g, '')
  if (cleanPhone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number.')
  }

  const formattedPhone = `+91 ${cleanPhone.slice(-10)}`
  const updatedCreds = {
    ...creds,
    phone: formattedPhone,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds))

  return { success: true, phone: formattedPhone }
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
