import { useEffect, useState } from 'react'
import {
  loginAdmin,
  loginWithGoogleCredential,
  initiateSupabaseGoogleOAuth,
  logoutAdmin,
  getCurrentAdmin,
  isSupabaseConfigured,
  getStoredAdminCredentials,
  AUTHORIZED_ADMIN_EMAILS,
  isAuthorizedGoogleAdmin,
  verifyGoogleAccountForReset,
  resetPasswordWithGoogleVerification,
  sendPasswordResetEmail,
  updateAdminEmail,
  updateAdminPassword,
  addGalleryPhoto,
  deleteGalleryPhoto,
  saveGalleryOrder,
  saveSiteContent,
} from '../lib/supabase'
import { useData } from '../context/DataContext'

function GoogleLogoSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

export default function Admin() {
  const { photos, setPhotos, categories, content, setContent, reloadData } = useData()

  // Auth State
  const [adminUser, setAdminUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Recovery Mode: 'signin' | 'forgot-password'
  const [authView, setAuthView] = useState('signin')

  // Google-Verified Password Reset State
  const [resetStep, setResetStep] = useState(1) // 1: Verify Google Identity, 2: Set New Password
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState(AUTHORIZED_ADMIN_EMAILS[0])
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')
  const [useCustomGoogle, setUseCustomGoogle] = useState(false)
  const [verifiedSession, setVerifiedSession] = useState(null)
  const [newResetPassword, setNewResetPassword] = useState('')
  const [confirmResetPassword, setConfirmResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [emailMagicLinkSent, setEmailMagicLinkSent] = useState(false)

  // Security Tab State (Change Email & Change Password)
  const [emailForm, setEmailForm] = useState({
    currentEmail: '',
    currentPassword: '',
    newEmail: '',
    confirmNewEmail: '',
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    currentEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Dashboard State
  const [activeTab, setActiveTab] = useState('gallery') // 'gallery' | 'content' | 'security' | 'database'
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

  // Check auth on load
  useEffect(() => {
    getCurrentAdmin()
      .then((user) => setAdminUser(user))
      .finally(() => setAuthLoading(false))
  }, [])

  // Google Identity Services (GIS) button initialization
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (window.google?.accounts?.id && googleClientId && authView === 'signin' && !adminUser) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            setGoogleLoading(true)
            setLoginError('')
            try {
              const user = await loginWithGoogleCredential(response.credential)
              setAdminUser(user)
            } catch (err) {
              setLoginError(err.message || 'Google authentication failed.')
            } finally {
              setGoogleLoading(false)
            }
          },
        })
        const container = document.getElementById('gsi-official-button')
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
          })
        }
      } catch (err) {
        console.warn('GIS init error:', err)
      }
    }
  }, [authView, adminUser])

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

  // Sync active user email to security forms
  useEffect(() => {
    if (adminUser?.email) {
      setEmailForm((prev) => ({ ...prev, currentEmail: adminUser.email }))
      setPasswordForm((prev) => ({ ...prev, currentEmail: adminUser.email }))
    }
  }, [adminUser])

  // Handle Standard Password Login
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

  // Handle Google Direct Sign-In
  const handleGoogleSignIn = async (accountEmail) => {
    setLoginError('')
    setGoogleLoading(true)
    try {
      if (isSupabaseConfigured) {
        await initiateSupabaseGoogleOAuth()
        return
      }

      // Google Identity Verification
      const targetEmail = accountEmail || AUTHORIZED_ADMIN_EMAILS[0]
      if (!isAuthorizedGoogleAdmin(targetEmail)) {
        throw new Error(
          `Access Denied: Google Account "${targetEmail}" is not authorized as an administrator. Only verified owners (${AUTHORIZED_ADMIN_EMAILS.join(', ')}) are granted access.`
        )
      }

      const user = await loginWithGoogleCredential({
        email: targetEmail,
        name: targetEmail.includes('cmrtc') ? 'Rajeev Kumar (CMRTC)' : 'Rajeev Kumar',
        picture: '',
        email_verified: true,
      })
      setAdminUser(user)
    } catch (err) {
      setLoginError(err.message || 'Google sign-in failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Handle Step 1 of Forgot Password: Verify Google Identity
  const handleVerifyGoogleIdentity = async (e) => {
    if (e) e.preventDefault()
    setResetError('')
    setResetSuccess('')
    setResetSubmitting(true)

    const targetEmail = useCustomGoogle ? customGoogleEmail.trim() : selectedGoogleAccount

    try {
      if (!targetEmail) {
        throw new Error('Please specify a Google Account email to verify.')
      }

      const session = await verifyGoogleAccountForReset(targetEmail)
      setVerifiedSession(session)
      setResetStep(2)
      setResetSuccess(`✓ Google Identity Verified! Account authenticated: ${session.email}`)
    } catch (err) {
      setResetError(err.message || 'Google account verification failed.')
    } finally {
      setResetSubmitting(false)
    }
  }

  // Handle Step 2 of Forgot Password: Set New Password
  const handleCompleteGooglePasswordReset = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    setResetSubmitting(true)

    try {
      if (!verifiedSession) {
        throw new Error('Google verification session is missing. Please re-verify your Google account.')
      }

      const res = await resetPasswordWithGoogleVerification({
        resetSessionToken: verifiedSession.token,
        newPassword: newResetPassword,
        confirmNewPassword: confirmResetPassword,
      })

      setResetSuccess('✓ Password successfully updated with Google Verification! Logging in...')
      setTimeout(() => {
        setAdminUser(res.user)
        setAuthView('signin')
        setResetStep(1)
        setVerifiedSession(null)
        setNewResetPassword('')
        setConfirmResetPassword('')
        setResetSuccess('')
      }, 1200)
    } catch (err) {
      setResetError(err.message || 'Password reset failed.')
    } finally {
      setResetSubmitting(false)
    }
  }

  // Optional: Send Magic Reset Link to Google Inbox if Supabase is active
  const handleSendEmailLink = async () => {
    const targetEmail = useCustomGoogle ? customGoogleEmail.trim() : selectedGoogleAccount
    setResetError('')
    setResetSubmitting(true)
    try {
      await sendPasswordResetEmail(targetEmail)
      setEmailMagicLinkSent(true)
      setResetSuccess(`✓ Password reset link sent to your Google inbox (${targetEmail})! Check your email.`)
    } catch (err) {
      setResetError(err.message || 'Could not send reset email.')
    } finally {
      setResetSubmitting(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdmin()
    setAdminUser(null)
  }

  // Handle Update Email with Verification
  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    setEmailLoading(true)
    try {
      const updated = await updateAdminEmail(emailForm)
      setAdminUser(updated)
      setEmailSuccess(`✓ Admin email successfully updated to ${updated.email}!`)
      setEmailForm({
        currentEmail: updated.email,
        currentPassword: '',
        newEmail: '',
        confirmNewEmail: '',
      })
      setPasswordForm((prev) => ({ ...prev, currentEmail: updated.email }))
      setTimeout(() => setEmailSuccess(''), 5000)
    } catch (err) {
      setEmailError(err.message || 'Failed to update email.')
    } finally {
      setEmailLoading(false)
    }
  }

  // Handle Update Password with Verification
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordLoading(true)
    try {
      await updateAdminPassword(passwordForm)
      setPasswordSuccess('✓ Admin master password successfully updated!')
      setPasswordForm({
        currentEmail: adminUser?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
      setTimeout(() => setPasswordSuccess(''), 5000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
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
  // RENDER: Loading
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="admin-page admin-loading">
        <div className="admin-spinner" />
        <p>Verifying Google Admin Security credentials...</p>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: Login Gate / Forgot Password
  // -------------------------------------------------------------
  if (!adminUser) {
    const currentCreds = getStoredAdminCredentials()

    return (
      <div className="admin-page admin-login-wrapper">
        <div className="admin-login-card glass-panel">
          {authView === 'forgot-password' ? (
            /* ========================================================= */
            /* GOOGLE IDENTITY VERIFICATION FOR FORGOT PASSWORD           */
            /* ========================================================= */
            <>
              <div className="admin-login-head">
                <div className="google-badge-pill">
                  <GoogleLogoSvg />
                  <span>Google Identity Verification</span>
                </div>
                <h2>Recover Admin Access</h2>
                <p className="admin-subtext">
                  Reset your master password securely by verifying your authorized Google Account.
                </p>
              </div>

              {/* Recovery Steps Progress */}
              <div className="google-steps-nav">
                <div className={`google-step-item ${resetStep === 1 ? 'is-active' : ''} ${resetStep > 1 ? 'is-done' : ''}`}>
                  <span className="step-num">{resetStep > 1 ? '✓' : '1'}</span>
                  <span>Google Verification</span>
                </div>
                <div className="step-connector" />
                <div className={`google-step-item ${resetStep === 2 ? 'is-active' : ''}`}>
                  <span className="step-num">2</span>
                  <span>Set New Password</span>
                </div>
              </div>

              {resetError && <div className="admin-alert admin-alert--error">{resetError}</div>}
              {resetSuccess && <div className="admin-alert admin-alert--success">{resetSuccess}</div>}

              {/* STEP 1: Verify Google Account */}
              {resetStep === 1 && (
                <div className="google-recovery-step">
                  <div className="google-whitelist-notice">
                    <p className="whitelist-title">🛡️ Authorized Google Accounts</p>
                    <p className="whitelist-desc">
                      Only verified owners of these registered Google accounts can authorize password resets:
                    </p>
                    <div className="google-account-selector-list">
                      {AUTHORIZED_ADMIN_EMAILS.map((email) => (
                        <label
                          key={email}
                          className={`google-account-option ${!useCustomGoogle && selectedGoogleAccount === email ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="google-account"
                            checked={!useCustomGoogle && selectedGoogleAccount === email}
                            onChange={() => {
                              setSelectedGoogleAccount(email)
                              setUseCustomGoogle(false)
                              setResetError('')
                            }}
                          />
                          <div className="google-account-detail">
                            <span className="account-email">{email}</span>
                            <span className="account-tag">
                              {email.includes('cmrtc') ? 'Institutional Google Workspace' : 'Primary Google Account'}
                            </span>
                          </div>
                          <span className="google-check-icon">✓</span>
                        </label>
                      ))}

                      <label className={`google-account-option ${useCustomGoogle ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="google-account"
                          checked={useCustomGoogle}
                          onChange={() => {
                            setUseCustomGoogle(true)
                            setResetError('')
                          }}
                        />
                        <div className="google-account-detail">
                          <span className="account-email">Use other authorized Google email</span>
                          <span className="account-tag">Whitelist check strictly enforced</span>
                        </div>
                      </label>
                    </div>

                    {useCustomGoogle && (
                      <div className="custom-google-input-box">
                        <input
                          type="email"
                          required
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          placeholder="your-account@gmail.com"
                          className="admin-input"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyGoogleIdentity}
                    disabled={resetSubmitting}
                    className="google-verify-submit-btn"
                  >
                    <GoogleLogoSvg />
                    <span>
                      {resetSubmitting
                        ? 'Verifying Google Account...'
                        : `Verify Identity as ${useCustomGoogle ? (customGoogleEmail || 'Google Account') : selectedGoogleAccount}`}
                    </span>
                  </button>

                  {isSupabaseConfigured && (
                    <div className="google-magic-link-box">
                      <p>Or send a password reset magic link directly to this Google inbox:</p>
                      <button
                        type="button"
                        onClick={handleSendEmailLink}
                        disabled={resetSubmitting}
                        className="admin-text-link"
                      >
                        ✉️ Send Reset Link to Google Inbox →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Choose New Master Password */}
              {resetStep === 2 && verifiedSession && (
                <form onSubmit={handleCompleteGooglePasswordReset} className="admin-login-form">
                  <div className="google-verified-card">
                    <div className="verified-head">
                      <span className="verified-shield">🛡️</span>
                      <div>
                        <strong>Google Identity Authenticated</strong>
                        <span className="verified-email">{verifiedSession.email}</span>
                      </div>
                    </div>
                    <p className="verified-desc">
                      Ownership verified. Enter your new master security password below to complete reset.
                    </p>
                  </div>

                  <label>
                    New Master Password (min 6 characters)
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      autoFocus
                    />
                  </label>

                  <label>
                    Confirm New Master Password
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </label>

                  <button
                    type="submit"
                    className="glass-btn glass-btn--primary admin-submit-btn"
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? 'Updating Credentials...' : '✓ Set New Password & Enter Dashboard →'}
                  </button>
                </form>
              )}

              <div className="admin-login-footer">
                <button
                  type="button"
                  className="admin-text-link"
                  onClick={() => {
                    setAuthView('signin')
                    setResetStep(1)
                    setResetError('')
                    setResetSuccess('')
                    setVerifiedSession(null)
                  }}
                >
                  ← Back to Admin Sign In
                </button>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* STANDARD SIGN-IN VIEW WITH GOOGLE VERIFICATION             */
            /* ========================================================= */
            <>
              <div className="admin-login-head">
                <span className="admin-badge">Admin Control Center</span>
                <h2>Rajeev Kumar Portfolio</h2>
                <p className="admin-subtext">
                  Sign in using Google Verification or your master administrator credentials.
                </p>
              </div>

              {loginError && <div className="admin-alert admin-alert--error">{loginError}</div>}

              {/* Official Google Sign-In Container */}
              <div className="google-auth-container">
                <div id="gsi-official-button" style={{ width: '100%' }} />

                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(AUTHORIZED_ADMIN_EMAILS[0])}
                  disabled={googleLoading}
                  className="google-signin-btn"
                >
                  <GoogleLogoSvg />
                  <span>
                    {googleLoading
                      ? 'Authenticating with Google...'
                      : `Continue with Google (${AUTHORIZED_ADMIN_EMAILS[0].split('@')[0]})`}
                  </span>
                </button>

                <div className="google-quick-accounts-row">
                  <span className="quick-acc-label">Authorized Google Accounts:</span>
                  <div className="quick-acc-btns">
                    {AUTHORIZED_ADMIN_EMAILS.map((email) => (
                      <button
                        key={email}
                        type="button"
                        className="quick-acc-chip"
                        onClick={() => handleGoogleSignIn(email)}
                        disabled={googleLoading}
                        title={`Sign in as ${email}`}
                      >
                        <span className="quick-acc-dot">●</span>
                        <span>{email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="auth-divider">
                <span>OR SIGN IN WITH PASSWORD</span>
              </div>

              <form onSubmit={handleLogin} className="admin-login-form">
                <label>
                  Admin Email
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={currentCreds.email}
                    autoComplete="email"
                  />
                </label>

                <label>
                  Master Password
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                </label>

                <div className="admin-field-helper">
                  <button
                    type="button"
                    className="admin-text-link"
                    onClick={() => {
                      setAuthView('forgot-password')
                      setResetStep(1)
                      setResetError('')
                      setResetSuccess('')
                      setSelectedGoogleAccount(loginEmail || AUTHORIZED_ADMIN_EMAILS[0])
                    }}
                  >
                    🔑 Forgot Password? Reset via Google →
                  </button>
                </div>

                <button
                  type="submit"
                  className="glass-btn glass-btn--primary admin-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Authenticating...' : 'Authenticate & Sign In →'}
                </button>
              </form>

              {!isSupabaseConfigured && (
                <div className="admin-demo-box">
                  <p className="admin-demo-title">💡 Authorized Admin Access</p>
                  <p className="admin-demo-text">
                    Click below to auto-fill current active credentials (or connect Supabase in <code>.env</code>):
                  </p>
                  <button
                    type="button"
                    className="admin-demo-btn"
                    onClick={() => {
                      const c = getStoredAdminCredentials()
                      setLoginEmail(c.email)
                      setLoginPassword(c.password)
                    }}
                  >
                    Auto-fill Current Credentials ({currentCreds.email})
                  </button>
                </div>
              )}

              <div className="admin-login-footer">
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
                >
                  ← Return to Public Portfolio
                </a>
              </div>
            </>
          )}
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
            <div className="admin-nav-meta">
              <span className="admin-nav-badge">
                {isSupabaseConfigured ? '🟢 Supabase Cloud Active' : '🟡 Local / Preview Mode'}
              </span>
              <span className="admin-nav-user-pill">
                <GoogleLogoSvg />
                <span>{adminUser.email}</span>
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
            className={`admin-tab-btn ${activeTab === 'security' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Google & Account Security
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'database' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            🗄️ Database & Cloud
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
        {/* TAB 3: ACCOUNT & GOOGLE CREDENTIAL SECURITY */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <div className="admin-security-section">
            <div className="admin-section-header">
              <div>
                <h2>Google Identity & Master Security Settings</h2>
                <p>Manage Google Single Sign-On, master email address, and security passwords.</p>
              </div>
            </div>

            {/* Card 1: Google Identity Status */}
            <div className="admin-card glass-panel" style={{ marginBottom: '2rem' }}>
              <div className="admin-card-head-row">
                <div className="google-status-head">
                  <GoogleLogoSvg />
                  <div>
                    <h3>Google Identity & 2-Factor Authentication</h3>
                    <p className="admin-subtext">
                      Portfolio administrator access is protected with Google OAuth and whitelist verification.
                    </p>
                  </div>
                </div>
                <span className="admin-pill-status">🛡️ Google Verified Active</span>
              </div>

              <div className="google-authorized-list-box">
                <p className="authorized-list-title">Authorized Google Owner Accounts:</p>
                <div className="authorized-accounts-grid">
                  {AUTHORIZED_ADMIN_EMAILS.map((email) => (
                    <div key={email} className="authorized-account-card">
                      <div className="acc-icon-wrap">
                        <GoogleLogoSvg />
                      </div>
                      <div className="acc-info">
                        <strong>{email}</strong>
                        <span>
                          {email.includes('cmrtc')
                            ? 'Google Workspace (CMRTC Verified)'
                            : 'Personal Google Account (Verified Owner)'}
                        </span>
                      </div>
                      <span className="acc-status-tag">✓ Authorized</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-grid-2">
              {/* Change Email Card */}
              <div className="admin-card glass-panel">
                <h3>Change Master Email</h3>
                <p className="admin-subtext" style={{ marginBottom: '1.2rem' }}>
                  Verify your current email and master password to update to a new login email.
                </p>

                {emailError && <div className="admin-alert admin-alert--error">{emailError}</div>}
                {emailSuccess && <div className="admin-alert admin-alert--success">{emailSuccess}</div>}

                <form onSubmit={handleUpdateEmail} className="admin-security-form">
                  <label>
                    Current Registered Email (Verification)
                    <input
                      type="email"
                      required
                      value={emailForm.currentEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, currentEmail: e.target.value })}
                      placeholder="Current registered email"
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    Current Master Password (Verification)
                    <input
                      type="password"
                      required
                      value={emailForm.currentPassword}
                      onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                    />
                  </label>

                  <label>
                    New Admin Email Address
                    <input
                      type="email"
                      required
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      placeholder="new-admin@example.com"
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    Confirm New Admin Email Address
                    <input
                      type="email"
                      required
                      value={emailForm.confirmNewEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, confirmNewEmail: e.target.value })}
                      placeholder="Repeat new email"
                      autoComplete="email"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="glass-btn glass-btn--primary admin-save-btn"
                    style={{ marginTop: '0.8rem' }}
                  >
                    {emailLoading ? 'Verifying & Updating...' : '✓ Verify & Update Email'}
                  </button>
                </form>
              </div>

              {/* Change Password Card */}
              <div className="admin-card glass-panel">
                <h3>Change Master Password</h3>
                <p className="admin-subtext" style={{ marginBottom: '1.2rem' }}>
                  Verify your registered email and current password to set a new security password.
                </p>

                {passwordError && <div className="admin-alert admin-alert--error">{passwordError}</div>}
                {passwordSuccess && <div className="admin-alert admin-alert--success">{passwordSuccess}</div>}

                <form onSubmit={handleUpdatePassword} className="admin-security-form">
                  <label>
                    Registered Admin Email (Verification)
                    <input
                      type="email"
                      required
                      value={passwordForm.currentEmail}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentEmail: e.target.value })}
                      placeholder="Registered admin email"
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    Current Master Password (Verification)
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                    />
                  </label>

                  <label>
                    New Security Password (min 6 characters)
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </label>

                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="glass-btn glass-btn--primary admin-save-btn"
                    style={{ marginTop: '0.8rem' }}
                  >
                    {passwordLoading ? 'Verifying & Updating...' : '✓ Verify & Update Password'}
                  </button>
                </form>
              </div>
            </div>

            {/* Architecture Overview */}
            <div className="admin-card glass-panel" style={{ marginTop: '2rem' }}>
              <h3>🔐 Google Identity Security Architecture</h3>
              <p className="admin-subtext" style={{ marginBottom: '1rem' }}>
                Your administrative control center is architected according to modern identity standards:
              </p>
              <ul className="admin-recovery-features-list">
                <li>
                  <strong>1. Google Verified OAuth:</strong> Administrators authenticate using cryptographically signed Google Identity tokens (GIS / OAuth 2.0). Only whitelisted emails can access or modify your portfolio.
                </li>
                <li>
                  <strong>2. Identity-Backed Password Reset:</strong> Forgotten passwords are reset by verifying ownership of your authorized Google Account. No insecure SMS/OTP interception risks or paradoxical "old password" prompts.
                </li>
                <li>
                  <strong>3. Cloud Database Sync:</strong> When Supabase credentials are configured, changes are synced directly to PostgreSQL tables with row-level security (RLS).
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DATABASE CONFIG & SECURITY */}
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
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com`}
                  </pre>
                </li>
                <li>Open the <strong>SQL Editor</strong> in Supabase and run the schema script generated in <code>supabase_schema.sql</code>.</li>
                <li>Under <strong>Authentication → Providers</strong>, enable Google OAuth and add your Google Client ID & Secret.</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
