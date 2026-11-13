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
  IS_ADMIN: 'rk_portfolio_is_admin_v1',
}

// -------------------------------------------------------------
// SUPABASE IS_ADMIN ACCESS CONTROL
// -------------------------------------------------------------

/**
 * Check if Admin Access is enabled (isAdmin === true in Supabase or local storage)
 * - Queries Supabase table `admin_settings` for `is_admin`
 * - Also checks `site_content` fallback record `admin_access`
 * - When is_admin = true, full admin access is granted directly with no login required!
 */
export async function checkIsAdmin() {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Query admin_settings table in Supabase
      const { data, error } = await supabase
        .from('admin_settings')
        .select('is_admin')
        .eq('id', 'access_control')
        .maybeSingle()

      if (!error && data && typeof data.is_admin === 'boolean') {
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, String(data.is_admin))
        return data.is_admin
      }

      // 2. Query site_content admin_access in Supabase
      const { data: contentData } = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 'admin_access')
        .maybeSingle()

      if (contentData?.data && typeof contentData.data.is_admin === 'boolean') {
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, String(contentData.data.is_admin))
        return contentData.data.is_admin
      }

      // 3. Check Supabase Auth user metadata if logged in
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (user) {
        if (
          user.user_metadata?.isAdmin === true ||
          user.user_metadata?.is_admin === true ||
          user.app_metadata?.isAdmin === true ||
          user.app_metadata?.is_admin === true ||
          user.role === 'admin'
        ) {
          return true
        }
      }
    } catch (err) {
      console.warn('Supabase checkIsAdmin note:', err)
    }
  }

  // Local / Fallback mode: default is true!
  const localVal = localStorage.getItem(STORAGE_KEYS.IS_ADMIN)
  if (localVal === null) {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true')
    return true
  }
  return localVal === 'true'
}

/**
 * Toggle or set isAdmin access state in Supabase & local storage
 */
export async function setAdminAccess(isAdmin) {
  const boolVal = Boolean(isAdmin)
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('admin_settings').upsert({
        id: 'access_control',
        is_admin: boolVal,
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('Failed to update Supabase admin_settings:', e)
    }
  }
  localStorage.setItem(STORAGE_KEYS.IS_ADMIN, String(boolVal))
  return boolVal
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
