import { signatureVectorPath, signatureViewBox } from '../data/signatureData'

export default function RKLogo({ size = 'md', className = '' }) {
  return (
    <span className={`rk-mark rk-mark--${size} ${className}`.trim()} aria-hidden="true">
      <svg className="rk-sig-svg" viewBox={signatureViewBox} fill="none">
        <defs>
          <radialGradient id="rkSigAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4eee4" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#f4eee4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#f4eee4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="257" cy="122" rx="220" ry="100" fill="url(#rkSigAura)" className="rk-sig-halo" />
        <path d={signatureVectorPath} fill="currentColor" />
      </svg>
    </span>
  )
}
