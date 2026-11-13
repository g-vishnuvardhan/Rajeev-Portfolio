// Splits text into words so a scroll-scrubbed reveal can light them up one by one.
export default function Words({ text, className = '' }) {
  return (
    <p className={`words ${className}`} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span className="w" key={i} aria-hidden="true">{w}{' '}</span>
      ))}
    </p>
  )
}
