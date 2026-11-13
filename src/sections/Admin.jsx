import { useEffect, useState } from 'react'
import {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  isSupabaseConfigured,
  addGalleryPhoto,
  deleteGalleryPhoto,
  saveGalleryOrder,
  saveSiteContent,
} from '../lib/supabase'
import { useData } from '../context/DataContext'

export default function Admin() {
  const { photos, setPhotos, categories, content, setContent, reloadData } = useData()

  // Auth State
  const [adminUser, setAdminUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dashboard State
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
    instagram: content.site?.instagram || '',
    aboutQuote: content.about?.quote || '',
    aboutTitleLine: content.about?.titleLine || '',
    aboutProfile: (content.about?.profile || []).join('\n\n'),
  })
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Check auth on load
  useEffect(() => {
    getCurrentAdmin()
      .then((user) => setAdminUser(user))
      .finally(() => setAuthLoading(false))
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
        instagram: content.site.instagram || '',
        aboutQuote: content.about?.quote || '',
        aboutTitleLine: content.about?.titleLine || '',
        aboutProfile: (content.about?.profile || []).join('\n\n'),
      })
    }
  }, [content])

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setIsSubmitting(true)
    try {
      const user = await loginAdmin(loginEmail, loginPassword)
      setAdminUser(user)
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdmin()
    setAdminUser(null)
  }

  // Auto-detect image ratio from file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setNewImagePreview(previewUrl)

    // Calculate natural ratio
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
  // RENDER: Loading
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="admin-page admin-loading">
        <div className="admin-spinner" />
        <p>Verifying secure admin credentials...</p>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: Login Gate
  // -------------------------------------------------------------
  if (!adminUser) {
    return (
      <div className="admin-page admin-login-wrapper">
        <div className="admin-login-card glass-panel">
          <div className="admin-login-head">
            <span className="admin-badge">Secure Control Center</span>
            <h2>Rajeev Kumar Portfolio</h2>
            <p className="admin-subtext">Sign in to manage gallery photos, edit homepage content, and control database records.</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {loginError && <div className="admin-alert admin-alert--error">{loginError}</div>}

            <label>
              Admin Email
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@rajeevkumar.com"
                autoComplete="email"
              />
            </label>

            <label>
              Security Password
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="glass-btn glass-btn--primary admin-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Authenticate & Sign In →'}
            </button>
          </form>

          {!isSupabaseConfigured && (
            <div className="admin-demo-box">
              <p className="admin-demo-title">💡 Demo Access (Cloud credentials pending in .env)</p>
              <p className="admin-demo-text">
                Click below to auto-fill preview credentials, or link Supabase in <code>.env</code> for live cloud PostgreSQL storage:
              </p>
              <button
                type="button"
                className="admin-demo-btn"
                onClick={() => {
                  setLoginEmail('admin@rajeevkumar.com')
                  setLoginPassword('admin123')
                }}
              >
                Use Demo Login (admin@rajeevkumar.com / admin123)
              </button>
            </div>
          )}

          <div className="admin-login-footer">
            <a href="/" className="admin-back-link">← Return to Public Portfolio</a>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: Authenticated Dashboard
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
            <h1>Rajeev Kumar</h1>
            <span className="admin-nav-badge">
              {isSupabaseConfigured ? '🟢 Supabase Cloud Active' : '🟡 Local / Preview Mode'}
            </span>
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
            🔐 Database Config
          </button>
        </nav>

        <div className="admin-nav-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-link-btn">
            View Live Site ↗
          </a>
          <button onClick={handleLogout} className="admin-logout-btn">
            Sign Out
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
                      placeholder="https://instagram.com/rajeevkumar"
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
        {/* TAB 3: DATABASE CONFIG & SECURITY */}
        {/* ========================================================= */}
        {activeTab === 'database' && (
          <div className="admin-db-section">
            <div className="admin-section-header">
              <div>
                <h2>Database & Security Architecture</h2>
                <p>Connection status, PostgreSQL schema, and Cloud Storage policies.</p>
              </div>
            </div>

            <div className="admin-card glass-panel">
              <h3>Connection Status</h3>
              <div className="admin-status-box">
                <div className="admin-status-indicator">
                  <span className={`status-dot ${isSupabaseConfigured ? 'is-green' : 'is-yellow'}`} />
                  <strong>
                    {isSupabaseConfigured
                      ? 'Connected to Supabase PostgreSQL Database'
                      : 'Running in Local / Preview Mode'}
                  </strong>
                </div>
                <p className="admin-subtext">
                  {isSupabaseConfigured
                    ? 'All photo additions, deletions, and copy edits are saved securely in your Supabase Cloud PostgreSQL database and synced worldwide.'
                    : 'Changes are currently saved locally in your browser storage. To enable cloud synchronization across all devices and visitors, add your free Supabase credentials to your .env file.'}
                </p>
              </div>
            </div>

            <div className="admin-card glass-panel">
              <h3>Supabase Setup Instructions</h3>
              <ol className="admin-steps">
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>.</li>
                <li>Go to <strong>Project Settings → API</strong> and copy your <code>Project URL</code> and <code>anon public key</code>.</li>
                <li>Add them to your project's <code>.env</code> file:
                  <pre className="admin-code-block">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                  </pre>
                </li>
                <li>Open the <strong>SQL Editor</strong> in Supabase and run the schema script generated in <code>supabase_schema.sql</code>.</li>
                <li>Create your Admin User under <strong>Authentication → Users</strong> in Supabase.</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
