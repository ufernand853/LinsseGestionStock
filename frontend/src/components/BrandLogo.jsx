const linsseHeaderLogoUrl = 'https://linsse.com/wp-content/uploads/2021/09/logo-linsse-header.png';

export default function BrandLogo({ className = '', tagline = 'Gestión inteligente de stock' }) {
  const classes = ['brand-logo', className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label="Linsse Stock">
      <img className="brand-logo__image" src={linsseHeaderLogoUrl} alt="Linsse" />
      {tagline ? <small className="brand-logo__tagline">{tagline}</small> : null}
    </div>
  );
}
