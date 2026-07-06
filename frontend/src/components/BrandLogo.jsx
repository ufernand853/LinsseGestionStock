export default function BrandLogo({ compact = false }) {
  return (
    <div className={`brand-logo${compact ? ' brand-logo--compact' : ''}`} aria-label="Linsse">
      <div className="brand-logo__mark" aria-hidden="true">
        <span className="brand-logo__bar brand-logo__bar--short" />
        <span className="brand-logo__bar brand-logo__bar--mid" />
        <span className="brand-logo__bar brand-logo__bar--tall" />
      </div>
      <div className="brand-logo__copy">
        <strong>Linsse</strong>
        {!compact ? <span>Gestion de stock</span> : null}
      </div>
    </div>
  );
}
