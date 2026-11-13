export default function RKLogo({ size = 'md', className = '', showProgress = false }) {
  return (
    <span className={`rk-mark rk-mark--${size} ${className}`.trim()} aria-hidden="true">
      <svg className="rk-frame" viewBox="0 0 120 120" fill="none">
        {/* Subtle inner tick ring */}
        <circle
          className="rk-ticks"
          cx="60"
          cy="60"
          r="46"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeOpacity="0.28"
          strokeDasharray="2 6"
        />
        {/* Base orbital ring */}
        <circle
          className="rk-ring"
          cx="60"
          cy="60"
          r="53"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.25"
        />
        {/* Animated orbital progress arc (used in IntroLoader & hover) */}
        {showProgress && (
          <circle
            className="rk-ring-progress"
            cx="60"
            cy="60"
            r="53"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        )}
        {/* Viewfinder corner brackets */}
        <path
          className="rk-bracket"
          d="M20 33V20H33 M87 20H100V33 M100 87V100H87 M33 100H20V87"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="square"
        />
      </svg>
      <span className="rk-letters">
        <span className="rk-r">R</span>
        <span className="rk-k">K</span>
      </span>
    </span>
  )
}
