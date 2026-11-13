import { useEffect, useState } from 'react'
import {
  checkIsAdmin,
  setAdminAccess,
  isSupabaseConfigured,
  addGalleryPhoto,
  deleteGalleryPhoto,
  saveGalleryOrder,
  saveSiteContent,
} from '../lib/supabase'
import { useData } from '../context/DataContext'

export default function Admin() {
  const { photos, setPhotos, categories, content, setContent, reloadData } = useData()

  // Access Control State: Controlled directly by isAdmin in Supabase
  const [isAdmin, setIsAdmin] = useState(true)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [accessToggling, setAccessToggling] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  // Dashboard Tab State
  const [activeTab, setActiveTab] = useState('gallery') // 'gallery' | 'content' | 'database'
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'cinematography')

  // New Image Form
  const [newImageFile, setNewImageFile] = useState(null)
  const [newImagePreview, setNewImagePreview] = useState('')
  const [newImageTitle, setNewImageTitle] = useState('')
  const [newImageRatio, setNewImageRatio] = useState('0.5628')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  // Site Content Form
  const [formData, setFormData] = useState({
    name: content.site?.name || 'Rajeev Kumar',
    role: content.site?.role || 'Director of Photography',
    tagline: content.site?.tagline || 'Cinematographer · Photographer · Visual Storyteller',
    location: content.site?.location || 'Hyderabad, India',
    fullLocation: content.site?.fullLocation || 'Hyderabad, Telangana, India',
    phone: content.site?.phone || '+91 9100305010',
    email: content.site?.email || 'gantyalarajeevkumar@gmail.com',
    whatsapp: content.site?.whatsapp || 'https://wa.me/919100305010',
    instagram: content.site?.instagram || 'https://instagram.com/rajeev_dop',
    aboutQuote: content.about?.quote || '',
    aboutTitleLine: content.about?.titleLine || '',
    aboutProfile: (content.about?.profile || []).join('\n\n'),
  })
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Verify isAdmin from Supabase on mount
  useEffect(() => {
    checkIsAdmin()
      .then((adminStatus) => {
        setIsAdmin(adminStatus)
      })
      .finally(() => {
        setCheckingAccess(false)
      })
  }, [])

  // Sync content form data when content loads
  useEffect(() => {
    if (content.site) {
      setFormData({
        name: content.site.name || '',
        role: content.site.role || '',
        tagline: content.site.tagline || '',
        location: content.site.location || '',
        fullLocation: content.site.fullLocation || '',
        phone: content.site.phone || '',
        email: content.site.email || '',
        whatsapp: content.site.whatsapp || '',
        instagram: content.site.instagram || 'https://instagram.com/rajeev_dop',
        aboutQuote: content.about?.quote || '',
        aboutTitleLine: content.about?.titleLine || '',
        aboutProfile: (content.about?.profile || []).join('\n\n'),
      })
    }
  }, [content])

  // Toggle isAdmin access control
  const handleToggleAdminAccess = async (targetValue) => {
    setAccessToggling(true)
    setAccessMessage('')
    try {
      await setAdminAccess(targetValue)
      setIsAdmin(targetValue)
      setAccessMessage(
        targetValue
          ? '✓ Admin access enabled! Direct access granted without password.'
          : '✓ Admin access locked! Anyone visiting /admin will see access restricted.'
      )
      setTimeout(() => setAccessMessage(''), 4000)
    } catch (err) {
      setAccessMessage(`Error updating access: ${err.message}`)
    } finally {
      setAccessToggling(false)
    }
  }

  // Auto-detect image ratio from file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setNewImagePreview(previewUrl)

    const img = new Image()
    img.src = previewUrl
    img.onload = () => {
      const r = Number((img.naturalWidth / img.naturalHeight).toFixed(4))
      setNewImageRatio(String(r))
      if (!newImageTitle) {
        const catName = categories.find((c) => c.id === selectedCategory)?.name || 'Photograph'
        const count = (photos[selectedCategory] || []).length + 1
        setNewImageTitle(`${catName} — Frame ${String(count).padStart(2, '0')}`)
      }
    }
  }

  // Add Photo Submit
  const handleAddPhoto = async (e) => {
    e.preventDefault()
    if (!newImageFile && !newImageUrl) {
      setUploadMessage('Please upload an image file or provide an image URL.')
      return
    }

    setUploadLoading(true)
    setUploadMessage('')

    try {
      await addGalleryPhoto({
        category: selectedCategory,
        src: newImageUrl,
        title: newImageTitle,
        ratio: Number(newImageRatio) || 0.5628,
        file: newImageFile,
      })

      await reloadData()
      setNewImageFile(null)
      setNewImagePreview('')
      setNewImageTitle('')
      setNewImageUrl('')
      setUploadMessage('✓ Photo added to gallery successfully!')
      setTimeout(() => setUploadMessage(''), 3500)
    } catch (err) {
      setUploadMessage(`Error: ${err.message}`)
    } finally {
      setUploadLoading(false)
    }
  }

  // Delete Photo
  const handleDeletePhoto = async (index, photoId) => {
    if (!window.confirm('Are you sure you want to delete this image from the gallery?')) return
    try {
      const updated = await deleteGalleryPhoto(selectedCategory, index, photoId)
      setPhotos(updated)
      await reloadData()
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  // Move Photo (Reorder)
  const handleMovePhoto = async (index, direction) => {
    const list = [...(photos[selectedCategory] || [])]
    const target = index + direction
    if (target < 0 || target >= list.length) return

    const temp = list[index]
    list[index] = list[target]
    list[target] = temp

    setPhotos({ ...photos, [selectedCategory]: list })
    await saveGalleryOrder(selectedCategory, list)
  }

  // Save Content
  const handleSaveContent = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    setSaveSuccess('')

    const updatedContent = {
      site: {
        ...content.site,
        name: formData.name,
        role: formData.role,
        tagline: formData.tagline,
        location: formData.location,
        fullLocation: formData.fullLocation,
        phone: formData.phone,
        phoneHref: `tel:${formData.phone.replace(/[^+\d]/g, '')}`,
        email: formData.email,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
      },
      about: {
        ...content.about,
        quote: formData.aboutQuote,
        titleLine: formData.aboutTitleLine,
        profile: formData.aboutProfile
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean),
      },
      experience: content.experience,
    }

    try {
      await saveSiteContent(updatedContent)
      setContent(updatedContent)
      setSaveSuccess('✓ Homepage and site content updated successfully!')
      setTimeout(() => setSaveSuccess(''), 4000)
    } catch (err) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaveLoading(false)
    }
  }

  // -------------------------------------------------------------
  // RENDER: Loading Check
  // -------------------------------------------------------------
  if (checkingAccess) {
    return (
      <div className="admin-page admin-loading">
        <div className="admin-spinner" />
        <p>Checking Supabase isAdmin access status...</p>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: Access Restricted (When isAdmin is false in Supabase)
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="admin-page admin-login-wrapper">
        <div className="admin-login-card glass-panel" style={{ textAlign: 'center' }}>
          <div className="admin-locked-icon">🔒</div>
          <span className="admin-badge admin-badge--red">Access Restricted</span>
          <h2>Admin Page Locked</h2>
          <p className="admin-subtext" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <code>isAdmin</code> is currently set to <strong>false</strong> in Supabase.
            To gain access to this page, set <code>is_admin = true</code> in your Supabase <code>admin_settings</code> table.
          </p>

          <div className="admin-locked-actions">
            <button
              type="button"
              onClick={() => handleToggleAdminAccess(true)}
              disabled={accessToggling}
              className="glass-btn glass-btn--primary admin-submit-btn"
            >
              {accessToggling ? 'Enabling Access...' : '🔓 Enable isAdmin = true'}
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                if (window.location.hash.startsWith('#/admin') || window.location.hash.startsWith('#admin')) {
                  window.location.hash = ''
                } else {
                  window.history.pushState(null, '', '/')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }
              }}
              className="admin-back-link"
              style={{ display: 'inline-block', marginTop: '1.2rem' }}
            >
              ← Return to Public Portfolio
            </a>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: Direct Full Admin Access (When isAdmin === true)
  // -------------------------------------------------------------
  const currentCategoryPhotos = photos[selectedCategory] || []
  const categoryInfo = categories.find((c) => c.id === selectedCategory) || categories[0]

  return (
    <div className="admin-page admin-dashboard">
      {/* Top Bar */}
      <header className="admin-navbar glass-panel">
        <div className="admin-nav-brand">
          <span className="admin-nav-logo">RK</span>
          <div>
            <h1>Rajeev Kumar Admin</h1>
            <div className="admin-nav-meta">
              <span className="admin-nav-badge">
                {isSupabaseConfigured ? '🟢 Supabase Cloud Active' : '🟡 Local / Preview Mode'}
              </span>
              <span className="admin-nav-admin-badge">
                🛡️ isAdmin = true
              </span>
            </div>
          </div>
        </div>

        <nav className="admin-nav-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'gallery' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            🖼️ Gallery Management
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'content' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            ✏️ Homepage & Copy
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'database' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            🗄️ Database & isAdmin Settings
          </button>
        </nav>

        <div className="admin-nav-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-link-btn">
            View Live Site ↗
          </a>
          <button
            type="button"
            onClick={() => handleToggleAdminAccess(false)}
            className="admin-logout-btn"
            title="Lock admin page by setting isAdmin = false"
          >
            🔒 Lock Admin (isAdmin = false)
          </button>
        </div>
      </header>

      <main className="admin-main">
        {/* ========================================================= */}
        {/* TAB 1: GALLERY MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'gallery' && (
          <div className="admin-gallery-section">
            <div className="admin-section-header">
              <div>
                <h2>Gallery Database Manager</h2>
                <p>Upload new frames, select category/type, delete outdated photos, or rearrange the frame sequence.</p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="admin-category-bar">
              {categories.map((c) => {
                const count = (photos[c.id] || []).length
                return (
                  <button
                    key={c.id}
                    className={`admin-cat-pill ${c.id === selectedCategory ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategory(c.id)}
                  >
                    <span>{c.name}</span>
                    <span className="admin-cat-count">{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Add Photo Card */}
            <div className="admin-card glass-panel admin-add-card">
              <h3>Add New Frame to {categoryInfo?.name}</h3>
              {uploadMessage && (
                <div className={`admin-alert ${uploadMessage.startsWith('✓') ? 'admin-alert--success' : 'admin-alert--error'}`}>
                  {uploadMessage}
                </div>
              )}

              <form onSubmit={handleAddPhoto} className="admin-add-form">
                <div className="admin-upload-grid">
                  {/* File Upload Zone */}
                  <div className="admin-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      id="photo-upload"
                      onChange={handleFileSelect}
                      className="admin-file-input"
                    />
                    <label htmlFor="photo-upload" className="admin-dropzone-label">
                      {newImagePreview ? (
                        <div className="admin-preview-box">
                          <img src={newImagePreview} alt="Upload preview" />
                          <span className="admin-preview-tag">Click to replace image</span>
                        </div>
                      ) : (
                        <div className="admin-dropzone-placeholder">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                          <p><strong>Click to choose image file</strong> or drag & drop</p>
                          <span>PNG, JPG, WebP up to 20MB</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Form Details */}
                  <div className="admin-fields">
                    <label>
                      Category / Type
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Frame Title
                      <input
                        type="text"
                        value={newImageTitle}
                        onChange={(e) => setNewImageTitle(e.target.value)}
                        placeholder={`e.g. ${categoryInfo?.name} — Frame 01`}
                      />
                    </label>

                    <label>
                      Aspect Ratio Preset
                      <select
                        value={newImageRatio}
                        onChange={(e) => setNewImageRatio(e.target.value)}
                      >
                        <option value="1.7768">16:9 Landscape (1.777) — Wedding standard</option>
                        <option value="0.5628">9:16 Vertical Reel (0.563) — Fashion / Cinematography</option>
                        <option value="0.75">4:3 Medium (0.75) — Editorial / Indoor</option>
                        <option value="1.0">1:1 Square (1.0)</option>
                        <option value={newImageRatio}>Custom / Auto-detected ({newImageRatio})</option>
                      </select>
                    </label>

                    <label>
                      Or Image URL (if hosted elsewhere)
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={uploadLoading || (!newImageFile && !newImageUrl)}
                      className="glass-btn glass-btn--primary admin-upload-btn"
                    >
                      {uploadLoading ? 'Uploading & Saving...' : '＋ Add Frame to Category'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Existing Photos Grid */}
            <div className="admin-card glass-panel">
              <div className="admin-card-head">
                <h3>Current Frames ({currentCategoryPhotos.length})</h3>
                <span className="admin-subtext">Drag or use arrow buttons to arrange order in the 3D gallery</span>
              </div>

              {currentCategoryPhotos.length === 0 ? (
                <div className="admin-empty">
                  <p>No frames currently in this category. Upload one above!</p>
                </div>
              ) : (
                <div className="admin-photos-grid">
                  {currentCategoryPhotos.map((photo, idx) => (
                    <div key={photo.id || idx} className="admin-photo-card">
                      <div className="admin-photo-thumb">
                        <img src={photo.src} alt={photo.title || `Frame ${idx + 1}`} loading="lazy" />
                        <span className="admin-photo-idx">{String(idx + 1).padStart(2, '0')}</span>
                        <span className="admin-ratio-tag">{photo.ratio > 1 ? '16:9' : '9:16'}</span>
                      </div>

                      <div className="admin-photo-body">
                        <p className="admin-photo-title">{photo.title || `Frame ${idx + 1}`}</p>
                        <span className="admin-photo-meta">Ratio: {photo.ratio}</span>

                        <div className="admin-photo-actions">
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(idx, -1)}
                            disabled={idx === 0}
                            className="admin-reorder-btn"
                            title="Move Earlier in Carousel"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(idx, 1)}
                            disabled={idx === currentCategoryPhotos.length - 1}
                            className="admin-reorder-btn"
                            title="Move Later in Carousel"
                          >
                            ▶
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(idx, photo.id)}
                            className="admin-delete-btn"
                            title="Delete Frame"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HOMEPAGE & CONTENT EDITOR */}
        {/* ========================================================= */}
        {activeTab === 'content' && (
          <div className="admin-content-section">
            <div className="admin-section-header">
              <div>
                <h2>Homepage Text & Copy Editor</h2>
                <p>Modify titles, roles, storytelling copy, and contact links displayed across the portfolio.</p>
              </div>
            </div>

            {saveSuccess && <div className="admin-alert admin-alert--success">{saveSuccess}</div>}

            <form onSubmit={handleSaveContent} className="admin-content-form">
              {/* Identity & Hero */}
              <div className="admin-card glass-panel">
                <h3>Hero Section & Identity</h3>
                <div className="admin-grid-2">
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    Professional Title / Role
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <label>
                  Tagline / Subheading
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </label>

                <div className="admin-grid-2">
                  <label>
                    Short Location
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </label>

                  <label>
                    Full Location
                    <input
                      type="text"
                      value={formData.fullLocation}
                      onChange={(e) => setFormData({ ...formData, fullLocation: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              {/* About & Bio */}
              <div className="admin-card glass-panel">
                <h3>About Section & Bio</h3>
                <label>
                  Signature Quote
                  <textarea
                    rows="2"
                    value={formData.aboutQuote}
                    onChange={(e) => setFormData({ ...formData, aboutQuote: e.target.value })}
                  />
                </label>

                <label>
                  About Headline
                  <input
                    type="text"
                    value={formData.aboutTitleLine}
                    onChange={(e) => setFormData({ ...formData, aboutTitleLine: e.target.value })}
                  />
                </label>

                <label>
                  Profile Bio Paragraphs (Separate paragraphs with a blank line)
                  <textarea
                    rows="6"
                    value={formData.aboutProfile}
                    onChange={(e) => setFormData({ ...formData, aboutProfile: e.target.value })}
                  />
                </label>
              </div>

              {/* Contact Information */}
              <div className="admin-card glass-panel">
                <h3>Direct Contact & Socials</h3>
                <div className="admin-grid-2">
                  <label>
                    Direct Phone
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </label>

                  <label>
                    Direct Email
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </label>
                </div>

                <div className="admin-grid-2">
                  <label>
                    WhatsApp Link
                    <input
                      type="url"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </label>

                  <label>
                    Instagram URL
                    <input
                      type="url"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="https://instagram.com/rajeev_dop"
                    />
                  </label>
                </div>
              </div>

              <div className="admin-save-bar">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="glass-btn glass-btn--primary admin-save-btn"
                >
                  {saveLoading ? 'Saving...' : '💾 Save All Homepage Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DATABASE & SUPABASE IS_ADMIN SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'database' && (
          <div className="admin-db-section">
            <div className="admin-section-header">
              <div>
                <h2>Database & isAdmin Access Control</h2>
                <p>Manage Supabase cloud database synchronization and the master <code>isAdmin</code> toggle.</p>
              </div>
            </div>

            {accessMessage && (
              <div className={`admin-alert ${accessMessage.startsWith('✓') ? 'admin-alert--success' : 'admin-alert--error'}`}>
                {accessMessage}
              </div>
            )}

            {/* isAdmin Control Card */}
            <div className="admin-card glass-panel" style={{ marginBottom: '2rem' }}>
              <div className="admin-card-head-row">
                <div>
                  <h3>🛡️ Supabase isAdmin Access Control</h3>
                  <p className="admin-subtext">
                    Access to this page is controlled by the <code>is_admin</code> flag in Supabase. No passwords or emails required.
                  </p>
                </div>
                <span className="admin-pill-status">
                  {isAdmin ? '🟢 isAdmin: TRUE (Accessible)' : '🔴 isAdmin: FALSE (Locked)'}
                </span>
              </div>

              <div className="admin-isadmin-control-box">
                <div className="isadmin-status-detail">
                  <p>
                    Current Status: <strong>{isAdmin ? 'isAdmin = true' : 'isAdmin = false'}</strong>
                  </p>
                  <span>
                    {isAdmin
                      ? 'Direct access is currently active. Anyone visiting /admin can manage the gallery and edit homepage content.'
                      : 'Admin page is locked. Visitors cannot edit without enabling isAdmin in Supabase.'}
                  </span>
                </div>

                <div className="isadmin-toggle-actions">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleToggleAdminAccess(false)}
                      disabled={accessToggling}
                      className="admin-lock-btn"
                    >
                      {accessToggling ? 'Updating...' : '🔒 Set isAdmin = false (Lock Admin)'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleAdminAccess(true)}
                      disabled={accessToggling}
                      className="admin-unlock-btn"
                    >
                      {accessToggling ? 'Updating...' : '🔓 Set isAdmin = true (Enable Access)'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="admin-card glass-panel">
              <h3>Supabase Connection Status</h3>
              <div className="admin-status-box">
                <div className="admin-status-indicator">
                  <span className={`status-dot ${isSupabaseConfigured ? 'is-green' : 'is-yellow'}`} />
                  <strong>
                    {isSupabaseConfigured
                      ? 'Connected to Supabase PostgreSQL Database'
                      : 'Running in Local / Browser Mode'}
                  </strong>
                </div>
                <p className="admin-subtext">
                  {isSupabaseConfigured
                    ? 'All gallery changes, content modifications, and isAdmin toggles sync live with your Supabase Cloud PostgreSQL database.'
                    : 'Changes are currently saved locally. To connect to Supabase Cloud, add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'}
                </p>
              </div>
            </div>

            {/* Supabase SQL Instructions */}
            <div className="admin-card glass-panel">
              <h3>Supabase Database Table Setup</h3>
              <ol className="admin-steps">
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>.</li>
                <li>Add your credentials to your project's <code>.env</code> file:
                  <pre className="admin-code-block">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                  </pre>
                </li>
                <li>Open the <strong>SQL Editor</strong> in Supabase and run the schema from <code>supabase_schema.sql</code>.</li>
                <li>
                  To control admin access at any time from your Supabase Dashboard:
                  <pre className="admin-code-block">
{`-- Enable direct admin access:
UPDATE public.admin_settings SET is_admin = true WHERE id = 'access_control';

-- Disable admin access:
UPDATE public.admin_settings SET is_admin = false WHERE id = 'access_control';`}
                  </pre>
                </li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
