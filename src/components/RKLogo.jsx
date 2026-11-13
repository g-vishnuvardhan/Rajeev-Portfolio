import { signatureStrokes, signatureViewBox } from '../data/signatureData'

export default function RKLogo({ size = 'md', className = '' }) {
  return (
    <span className={`rk-mark rk-mark--${size} ${className}`.trim()} aria-hidden="true">
      <svg className="rk-sig-svg" viewBox={signatureViewBox} fill="none">
        {signatureStrokes.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </span>
  )
}
