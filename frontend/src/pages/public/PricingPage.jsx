import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../utils/publicApi.js';
import { formatPlanLimit, formatPlanPrice } from '../../utils/license.js';

export default function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi('/public/plans')
      .then(setPlans)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="public-page">
      <section className="public-hero">
        <span className="public-eyebrow">SaaS de stock</span>
        <h1>Elegí el plan para tu empresa</h1>
        <p>Registrá tu cuenta, pagá con Mercado Pago Uruguay y empezá a gestionar productos, ubicaciones y usuarios separados por empresa.</p>
        <Link to="/login" className="secondary-link">Ya tengo cuenta</Link>
      </section>
      {loading ? <div className="section-card">Cargando planes...</div> : null}
      {error ? <div className="error-message">{error}</div> : null}
      <section className="pricing-grid">
        {plans.map(plan => (
          <article key={plan.code} className="pricing-card">
            <h2>{plan.name}</h2>
            <strong className="pricing-price">{formatPlanPrice(plan)}</strong>
            <p>{plan.description}</p>
            <span className="pricing-limit">{formatPlanLimit(plan)}</span>
            <button type="button" onClick={() => navigate(`/registro?plan=${plan.code}`)}>
              {plan.ctaLabel || 'Contratar'}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
