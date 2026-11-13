import { useEffect, useState } from 'react'
import {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  isSupabaseConfigured,
  getStoredAdminCredentials,
  updateAdminEmail,
  updateAdminPassword,
  resetAdminPasswordWithOldPassword,
  sendRecoveryOTP,
  verifyRecoveryOTP,
  resetAccountViaOTP,
  updateAdminRecoveryPhone,
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

  // Account Recovery Mode: null (Sign In) | 'otp' (Forgot Email & Password via Mobile OTP) | 'old-password' (Reset via Old Password)
  const [recoveryMode, setRecoveryMode] = useState(null)

  // 1. Forgot Email & Password (Mobile OTP Flow - Amazon / Flipkart Style)
  const [otpStep, setOtpStep] = useState(1) // 1: Enter Mobile, 2: Enter & Verify OTP, 3: Set New Password & Recover Email
  const [recoveryPhone, setRecoveryPhone] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpNotice, setOtpNotice] = useState(null) // { otp, phone, maskedPhone, maskedEmail, whatsappUrl }
  const [otpTimer, setOtpTimer] = useState(0) // seconds countdown for resend
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [recoveredEmail, setRecoveredEmail] = useState('')
  const [recoveredNewEmail, setRecoveredNewEmail] = useState('')
  const [otpNewPassword, setOtpNewPassword] = useState('')
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('')

  // 2. Forgot Password State (Reset via Old Password)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOldPassword, setForgotOldPassword] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  // 3. Recovery Phone Form (Inside Account Security Tab)
  const [phoneForm, setPhoneForm] = useState({
    currentPassword: '',
    newPhone: '',
  })
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)

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

  // Sync active user email to security forms
  useEffect(() => {
    if (adminUser?.email) {
      setEmailForm((prev) => ({ ...prev, currentEmail: adminUser.email }))
      setPasswordForm((prev) => ({ ...prev, currentEmail: adminUser.email }))
    }
  }, [adminUser])

  // Handle Forgot Password (Recovery via Old Password)
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    setForgotSubmitting(true)
    try {
      await resetAdminPasswordWithOldPassword({
        email: forgotEmail,
        oldPassword: forgotOldPassword,
        newPassword: forgotNewPassword,
        confirmNewPassword: forgotConfirmPassword,
      })
      setForgotSuccess('✓ Password verified & reset successfully! You can now sign in.')
      setLoginEmail(forgotEmail)
      setLoginPassword(forgotNewPassword)
      setTimeout(() => {
        setRecoveryMode(null)
        setForgotSuccess('')
        setForgotOldPassword('')
        setForgotNewPassword('')
        setForgotConfirmPassword('')
      }, 2000)
    } catch (err) {
      setForgotError(err.message || 'Password reset failed.')
    } finally {
      setForgotSubmitting(false)
    }
  }

  // OTP Countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  // Handle Send OTP (Amazon / Flipkart Flow)
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    setOtpError('')
    setOtpSuccess('')
    setOtpLoading(true)
    try {
      const res = await sendRecoveryOTP(recoveryPhone)
      setOtpNotice(res)
      setOtpStep(2)
      setOtpTimer(60)
      setOtpSuccess(`✓ 6-Digit OTP sent successfully to ${res.maskedPhone}!`)
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP. Please check your registered mobile number.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Handle Verify OTP
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault()
    setOtpError('')
    setOtpSuccess('')
    setOtpLoading(true)
    try {
      const res = await verifyRecoveryOTP(otpInput)
      setRecoveredEmail(res.email)
      setRecoveredNewEmail(res.email)
      setOtpStep(3)
      setOtpSuccess(`✓ Identity Verified! Registered account found: ${res.email}`)
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired 6-digit OTP code.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Handle Complete Account Recovery & Reset Password
  const handleCompleteRecovery = async (e) => {
    if (e) e.preventDefault()
    setOtpError('')
    setOtpSuccess('')
    setOtpLoading(true)
    try {
      const res = await resetAccountViaOTP({
        enteredOtp: otpInput,
        newPassword: otpNewPassword,
        confirmNewPassword: otpConfirmPassword,
        newEmail: recoveredNewEmail,
      })
      setOtpSuccess('✓ Password successfully reset! Authenticating into Admin Dashboard...')
      setTimeout(() => {
        setAdminUser(res.user)
        setRecoveryMode(null)
        setOtpStep(1)
        setOtpInput('')
        setOtpNotice(null)
        setOtpSuccess('')
      }, 1200)
    } catch (err) {
      setOtpError(err.message || 'Password reset failed. Please ensure password is at least 6 characters.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Handle Update Recovery Phone
  const handleUpdateRecoveryPhone = async (e) => {
    e.preventDefault()
    setPhoneError('')
    setPhoneSuccess('')
    setPhoneLoading(true)
    try {
      const res = await updateAdminRecoveryPhone({
        currentPassword: phoneForm.currentPassword,
        newPhone: phoneForm.newPhone,
      })
      setPhoneSuccess(`✓ Verified recovery mobile updated to ${res.phone}!`)
      setPhoneForm({ currentPassword: '', newPhone: '' })
      setTimeout(() => setPhoneSuccess(''), 5000)
    } catch (err) {
      setPhoneError(err.message || 'Failed to update recovery phone.')
    } finally {
      setPhoneLoading(false)
    }
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
    const currentCreds = getStoredAdminCredentials()

    return (
      <div className="admin-page admin-login-wrapper">
        <div className="admin-login-card glass-panel">
          {recoveryMode === 'otp' ? (
            /* ========================================================= */
            /* MODE 1: AMAZON / FLIPKART STYLE MOBILE OTP RECOVERY       */
            /* ========================================================= */
            <>
              <div className="admin-login-head">
                <span className="admin-badge">⚡ Instant OTP Recovery</span>
                <h2>Forgot Email & Password?</h2>
                <p className="admin-subtext">
                  Recover your account using your registered mobile number — just like Amazon and Flipkart.
                </p>
              </div>

              {/* Step Progress Pills */}
              <div className="otp-steps-indicator" role="tablist" aria-label="Recovery steps">
                <span className={`otp-step-pill ${otpStep === 1 ? 'is-active' : ''}`}>1. Mobile Number</span>
                <span className={`otp-step-pill ${otpStep === 2 ? 'is-active' : ''}`}>2. 6-Digit OTP</span>
                <span className={`otp-step-pill ${otpStep === 3 ? 'is-active' : ''}`}>3. Reset Password</span>
              </div>

              {/* Realistic Incoming SMS / Push Banner */}
              {otpNotice && otpStep >= 2 && (
                <div className="otp-sms-banner">
                  <div className="otp-sms-header">
                    <span className="otp-sms-icon">📱</span>
                    <div className="otp-sms-title-wrap">
                      <strong>SMS ALERT &bull; RK-AUTH</strong>
                      <span className="otp-sms-time">Now</span>
                    </div>
                  </div>
                  <p className="otp-sms-body">
                    Your Admin Recovery OTP is <span className="otp-sms-code">{otpNotice.otp}</span>. Valid for 10 minutes.
                  </p>
                  <div className="otp-sms-actions">
                    <button
                      type="button"
                      className="otp-autofill-btn"
                      onClick={() => {
                        setOtpInput(otpNotice.otp)
                        setOtpError('')
                      }}
                    >
                      ⚡ Quick Auto-Fill OTP ({otpNotice.otp})
                    </button>
                    {otpNotice.whatsappUrl && (
                      <a
                        href={otpNotice.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="otp-whatsapp-btn"
                      >
                        💬 Deliver to WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}

              {otpError && <div className="admin-alert admin-alert--error">{otpError}</div>}
              {otpSuccess && <div className="admin-alert admin-alert--success">{otpSuccess}</div>}

              {/* STEP 1: Enter Mobile Number */}
              {otpStep === 1 && (
                <form onSubmit={handleSendOTP} className="admin-login-form">
                  <label>
                    Registered Mobile Number
                    <input
                      type="tel"
                      required
                      value={recoveryPhone}
                      onChange={(e) => setRecoveryPhone(e.target.value)}
                      placeholder="+91 9100305010 or 9100305010"
                      autoComplete="tel"
                    />
                  </label>

                  <div className="otp-helper-badge">
                    <span>💡 Default registered number: <strong>{currentCreds.phone || '+91 9100305010'}</strong></span>
                    <button
                      type="button"
                      className="admin-text-link"
                      onClick={() => setRecoveryPhone(currentCreds.phone || '+91 9100305010')}
                    >
                      Use Default Phone
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="glass-btn glass-btn--primary admin-submit-btn"
                    disabled={otpLoading}
                  >
                    {otpLoading ? 'Sending 6-Digit OTP...' : '📲 Send 6-Digit OTP Code →'}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter & Verify 6-digit OTP */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="admin-login-form">
                  <label>
                    Enter 6-Digit Verification Code
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="otp-input-large"
                      autoFocus
                    />
                  </label>

                  <div className="otp-timer-row">
                    {otpTimer > 0 ? (
                      <span className="otp-countdown">Resend OTP in <strong>{otpTimer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        className="admin-text-link"
                        onClick={handleSendOTP}
                        disabled={otpLoading}
                      >
                        🔄 Didn't receive? Resend OTP
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-text-link"
                      onClick={() => {
                        setOtpStep(1)
                        setOtpError('')
                        setOtpSuccess('')
                      }}
                    >
                      ← Change Mobile Number
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="glass-btn glass-btn--primary admin-submit-btn"
                    disabled={otpLoading || otpInput.length < 6}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP & Continue →'}
                  </button>
                </form>
              )}

              {/* STEP 3: Recover Email & Reset Password */}
              {otpStep === 3 && (
                <form onSubmit={handleCompleteRecovery} className="admin-login-form">
                  <div className="otp-account-found-box">
                    <span className="account-found-badge">✓ ACCOUNT RECOVERED</span>
                    <p className="account-found-email">
                      Registered Email: <strong>{recoveredEmail}</strong>
                    </p>
                    <p className="account-found-desc">
                      Identity verified via mobile OTP. You can now set your new password (or update your email address).
                    </p>
                  </div>

                  <label>
                    Admin Email Address (Recovered / Update)
                    <input
                      type="email"
                      required
                      value={recoveredNewEmail}
                      onChange={(e) => setRecoveredNewEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    New Security Password (min 6 characters)
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
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
                      value={otpConfirmPassword}
                      onChange={(e) => setOtpConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </label>

                  <button
                    type="submit"
                    className="glass-btn glass-btn--primary admin-submit-btn"
                    disabled={otpLoading}
                  >
                    {otpLoading ? 'Saving Credentials...' : '✓ Reset Password & Enter Dashboard →'}
                  </button>
                </form>
              )}

              <div className="admin-login-footer">
                <button
                  type="button"
                  className="admin-text-link"
                  onClick={() => {
                    setRecoveryMode(null)
                    setOtpStep(1)
                    setOtpError('')
                    setOtpSuccess('')
                    setOtpNotice(null)
                  }}
                >
                  ← Back to Admin Sign In
                </button>
              </div>
            </>
          ) : recoveryMode === 'old-password' ? (
            /* ========================================================= */
            /* MODE 2: RECOVER VIA OLD PASSWORD (HISTORICAL VERIFICATION) */
            /* ========================================================= */
            <>
              <div className="admin-login-head">
                <span className="admin-badge">Old Password Recovery</span>
                <h2>Reset Admin Password</h2>
                <p className="admin-subtext">
                  Verify your registered admin email and a previously used/old password to set a new password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="admin-login-form">
                {forgotError && <div className="admin-alert admin-alert--error">{forgotError}</div>}
                {forgotSuccess && <div className="admin-alert admin-alert--success">{forgotSuccess}</div>}

                <label>
                  Registered Admin Email
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={currentCreds.email}
                    autoComplete="email"
                  />
                </label>

                <label>
                  Previous / Old Password (Verification)
                  <input
                    type="password"
                    required
                    value={forgotOldPassword}
                    onChange={(e) => setForgotOldPassword(e.target.value)}
                    placeholder="Enter previously known password"
                    autoComplete="current-password"
                  />
                </label>

                <label>
                  New Password (min 6 characters)
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
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
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                  />
                </label>

                <button
                  type="submit"
                  className="glass-btn glass-btn--primary admin-submit-btn"
                  disabled={forgotSubmitting}
                >
                  {forgotSubmitting ? 'Verifying & Resetting...' : 'Verify Old Password & Reset →'}
                </button>
              </form>

              <div className="admin-login-footer">
                <button
                  type="button"
                  className="admin-text-link"
                  onClick={() => {
                    setRecoveryMode(null)
                    setForgotError('')
                    setForgotSuccess('')
                  }}
                >
                  ← Back to Admin Sign In
                </button>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* STANDARD SIGN-IN VIEW                                      */
            /* ========================================================= */
            <>
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
                    placeholder={currentCreds.email}
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

                {/* Account Recovery Options */}
                <div className="admin-recovery-options">
                  <button
                    type="button"
                    className="admin-otp-recovery-btn"
                    onClick={() => {
                      setRecoveryMode('otp')
                      setOtpStep(1)
                      setRecoveryPhone(currentCreds.phone || '+91 9100305010')
                      setOtpError('')
                      setOtpSuccess('')
                    }}
                  >
                    <span>📱</span>
                    <span>Forgot Both Email & Password? <strong>Recover with Mobile OTP →</strong></span>
                  </button>

                  <div className="admin-field-helper">
                    <button
                      type="button"
                      className="admin-text-link"
                      onClick={() => {
                        setRecoveryMode('old-password')
                        setForgotEmail(loginEmail || currentCreds.email)
                        setForgotError('')
                        setForgotSuccess('')
                      }}
                    >
                      🔑 Reset using Old Password
                    </button>
                  </div>
                </div>

                <button type="submit" className="glass-btn glass-btn--primary admin-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Authenticating...' : 'Authenticate & Sign In →'}
                </button>
              </form>

              {!isSupabaseConfigured && (
                <div className="admin-demo-box">
                  <p className="admin-demo-title">💡 Authorized Admin Access</p>
                  <p className="admin-demo-text">
                    Click below to auto-fill current active credentials (or link Supabase in <code>.env</code> for cloud auth):
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
            className={`admin-tab-btn ${activeTab === 'security' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Account Security
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
        {/* TAB 3: ACCOUNT & CREDENTIAL SECURITY */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <div className="admin-security-section">
            <div className="admin-section-header">
              <div>
                <h2>Admin Credentials & Security Settings</h2>
                <p>Change your admin login email and master password with two-step credential verification.</p>
              </div>
            </div>

            <div className="admin-grid-2">
              {/* Change Email Card */}
              <div className="admin-card glass-panel">
                <h3>Change Admin Email</h3>
                <p className="admin-subtext" style={{ marginBottom: '1.2rem' }}>
                  Verify your current email and password to update to a new login email.
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
                    Current Password (Verification)
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
                <h3>Change Admin Password</h3>
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
                    Current Password (Verification)
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

            {/* Card 3: Verified Recovery Mobile (Amazon / Flipkart OTP System) */}
            <div className="admin-card glass-panel" style={{ marginTop: '2rem' }}>
              <div className="admin-card-head-row">
                <div>
                  <h3>📱 Verified Recovery Mobile (OTP Recovery)</h3>
                  <p className="admin-subtext">
                    Used for instant 6-digit OTP account recovery if you ever forget both your email and password — just like Amazon and Flipkart.
                  </p>
                </div>
                <span className="admin-pill-status">Verified Active</span>
              </div>

              <div className="admin-verified-phone-box">
                <span className="verified-phone-label">Current Recovery Phone:</span>
                <span className="verified-phone-val">{getStoredAdminCredentials().phone || '+91 9100305010'}</span>
              </div>

              {phoneError && <div className="admin-alert admin-alert--error">{phoneError}</div>}
              {phoneSuccess && <div className="admin-alert admin-alert--success">{phoneSuccess}</div>}

              <form onSubmit={handleUpdateRecoveryPhone} className="admin-security-form" style={{ marginTop: '1.2rem' }}>
                <label>
                  Current Admin Password (Verification)
                  <input
                    type="password"
                    required
                    value={phoneForm.currentPassword}
                    onChange={(e) => setPhoneForm({ ...phoneForm, currentPassword: e.target.value })}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                </label>

                <label>
                  New Recovery Mobile Number
                  <input
                    type="tel"
                    required
                    value={phoneForm.newPhone}
                    onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                    placeholder="+91 9100305010"
                    autoComplete="tel"
                  />
                </label>

                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="glass-btn glass-btn--primary admin-save-btn"
                  style={{ marginTop: '0.8rem' }}
                >
                  {phoneLoading ? 'Verifying & Updating...' : '✓ Update Recovery Mobile'}
                </button>
              </form>
            </div>

            {/* Card 4: Multi-Tier Account Recovery Overview */}
            <div className="admin-card glass-panel" style={{ marginTop: '2rem' }}>
              <h3>🔐 Dual-Tier Account Recovery Overview</h3>
              <p className="admin-subtext" style={{ marginBottom: '1rem' }}>
                Your portfolio is equipped with enterprise-grade protection so you never get locked out of your admin dashboard:
              </p>
              <ul className="admin-recovery-features-list">
                <li>
                  <strong>1. Mobile OTP Recovery (Amazon / Flipkart Standard):</strong> If you forget <em>both</em> your email and password, enter your registered mobile number (<code>{getStoredAdminCredentials().phone || '+91 9100305010'}</code>) to receive a secure 6-digit OTP code, reveal your linked admin email, and set a new password.
                </li>
                <li>
                  <strong>2. Historical Password Verification:</strong> If you know your registered email but forgot your active password, you can reset it instantly by verifying any previous password from your secure password history.
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
