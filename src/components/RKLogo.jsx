export default function RKLogo({ size = 'md', className = '' }) {
  return (
    <span className={`rk-mark rk-mark--${size} ${className}`.trim()} aria-hidden="true">
      <svg className="rk-frame" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="rkAuraGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ethereal infinite aura halo */}
        <circle
          className="rk-aura-glow"
          cx="60"
          cy="60"
          r="54"
          fill="url(#rkAuraGrad)"
        />

        {/* Minimalist optical lens hairline */}
        <circle
          className="rk-ring"
          cx="60"
          cy="60"
          r="52"
          stroke="currentColor"
          strokeWidth="0.85"
          strokeOpacity="0.4"
        />
      </svg>

      <span className="rk-letters">
        <span className="rk-r">R</span>
        <span className="rk-k">K</span>
      </span>
    </span>
  )
}
