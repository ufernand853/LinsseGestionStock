export default function BrandLogo({ className = '', tagline = 'Gestión inteligente de stock' }) {
  const classes = ['brand-logo', className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label="Linsse Stock">
      <span className="brand-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" focusable="false" role="img">
          <rect width="96" height="96" rx="22" />
          <path d="M18 18v60l42-24c5.5-3.1 12.4-7.9 12.4-10S65.5 37.1 60 34L18 10v8Z" />
          <path d="M37 67.5 78 43.7c1.9-1.1 3.8.2 3.9 2.4l.4 31.1c0 1.8-.9 3.4-2.4 4.3L50.1 98.7 21.6 80.6c-1.8-1.1-1.9-3.8-.2-5.1L37 67.5Z" />
        </svg>
      </span>
      <span className="brand-logo__copy">
        <strong>Linsse</strong>
        <small>{tagline}</small>
      </span>
    </div>
  );
}
