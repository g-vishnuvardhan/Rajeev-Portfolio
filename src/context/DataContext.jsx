import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchGalleryPhotos, fetchSiteContent } from '../lib/supabase'
import { categories as initialCategories, photos as initialPhotos } from '../data/gallery'
import { site as initialSite, about as initialAbout, experience as initialExperience } from '../data/content'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [categories, setCategories] = useState(initialCategories)
  const [content, setContent] = useState({
    site: initialSite,
    about: initialAbout,
    experience: initialExperience,
  })
  const [loading, setLoading] = useState(true)

  const reloadData = useCallback(async () => {
    try {
      const [fetchedPhotos, fetchedContent] = await Promise.all([
        fetchGalleryPhotos(),
        fetchSiteContent(),
      ])
      if (fetchedPhotos) setPhotos(fetchedPhotos)
      if (fetchedContent) setContent(fetchedContent)
    } catch (err) {
      console.error('Failed to load portfolio dynamic data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadData()
  }, [reloadData])

  const value = {
    photos,
    setPhotos,
    categories,
    setCategories,
    content,
    setContent,
    site: content.site || initialSite,
    about: content.about || initialAbout,
    experience: content.experience || initialExperience,
    loading,
    reloadData,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider')
  }
  return ctx
}
