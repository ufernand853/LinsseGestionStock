export default function BrandLogo({ className = '', tagline = 'Gestión inteligente de stock' }) {
  const classes = ['brand-logo', className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label="Linsse Stock">
      <span className="brand-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" focusable="false" role="img">
          <rect width="96" height="96" rx="22" />
          <path d="M24 20v56l39-22.4c4.1-2.4 7.8-5.2 7.8-6.1s-3.7-3.7-7.8-6.1L24 19.1V20Z" />
          <path d="M42 63.4 78.5 42c1.8-1.1 4.1.2 4.2 2.3l.4 30.1c0 1.7-.9 3.3-2.3 4.2L48 88 24.3 73.3c-1.9-1.2-1.9-4 .1-5.1L42 63.4Z" />
        </svg>
      </span>
      <span className="brand-logo__copy">
        <strong>Linsse</strong>
        <small>{tagline}</small>
      </span>
    </div>
  );
}
