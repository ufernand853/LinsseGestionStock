import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../utils/publicApi.js';
import { formatPlanLimit, formatPlanPrice } from '../../utils/license.js';

const planVisuals = {
  BASIC: {
    icon: '📦',
    label: 'Gestión simple para comercios pequeños',
    className: 'pricing-card-visual--basic'
  },
  PRO: {
    icon: '📈',
    label: 'Crecimiento con más productos y usuarios',
    className: 'pricing-card-visual--pro'
  },
  ENTERPRISE: {
    icon: '🏢',
    label: 'Operación empresarial con múltiples sucursales',
    className: 'pricing-card-visual--enterprise'
  }
};

const selfServicePlanCodes = ['BASIC', 'PRO'];

function getPlanVisual(code) {
  return planVisuals[code] || {
    icon: '🧾',
    label: 'Plan de gestión de stock',
    className: 'pricing-card-visual--default'
  };
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  useEffect(() => {
    publicApi('/public/plans')
      .then(setPlans)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selfServicePlans = selfServicePlanCodes
    .map(code => plans.find(plan => plan.code === code))
    .filter(Boolean);
  const enterprisePlan = plans.find(plan => plan.code === 'ENTERPRISE');
  const enterpriseVisual = enterprisePlan ? getPlanVisual(enterprisePlan.code) : null;

  async function handleEnterpriseContactSubmit(event) {
    event.preventDefault();
    setContactSent(false);
    setContactError(null);
    setContactSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      await publicApi('/public/enterprise-contact', {
        method: 'POST',
        body: payload
      });
      event.currentTarget.reset();
      setContactSent(true);
    } catch (err) {
      setContactError(err.message);
    } finally {
      setContactSubmitting(false);
    }
  }

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
      <section className="pricing-layout">
        <div className="pricing-grid pricing-grid--self-service">
          {selfServicePlans.map(plan => {
            const visual = getPlanVisual(plan.code);
            return (
              <article key={plan.code} className="pricing-card">
                <div className={`pricing-card-visual ${visual.className}`} aria-label={visual.label} role="img">
                  <span className="pricing-card-icon">{visual.icon}</span>
                </div>
                <h2>{plan.name}</h2>
                <strong className="pricing-price">{formatPlanPrice(plan)}</strong>
                <p>{plan.description}</p>
                <span className="pricing-limit">{formatPlanLimit(plan)}</span>
                <button type="button" onClick={() => navigate(`/registro?plan=${plan.code}`)}>
                  {plan.ctaLabel || 'Contratar'}
                </button>
              </article>
            );
          })}
        </div>
        {enterprisePlan && enterpriseVisual ? (
          <aside className="pricing-card pricing-card--enterprise-contact">
            <div className={`pricing-card-visual ${enterpriseVisual.className}`} aria-label={enterpriseVisual.label} role="img">
              <span className="pricing-card-icon">{enterpriseVisual.icon}</span>
            </div>
            <div>
              <h2>{enterprisePlan.name}</h2>
              <strong className="pricing-price">{formatPlanPrice(enterprisePlan)}</strong>
              <p>{enterprisePlan.description}</p>
              <span className="pricing-limit">{formatPlanLimit(enterprisePlan)}</span>
            </div>
            <form className="enterprise-contact-form" onSubmit={handleEnterpriseContactSubmit}>
              <div>
                <label htmlFor="enterpriseCompany">Empresa</label>
                <input id="enterpriseCompany" name="company" placeholder="Nombre de la empresa" required />
              </div>
              <div>
                <label htmlFor="enterpriseContact">Contacto</label>
                <input id="enterpriseContact" name="contact" placeholder="Nombre y apellido" required />
              </div>
              <div>
                <label htmlFor="enterpriseEmail">Email</label>
                <input id="enterpriseEmail" name="email" type="email" placeholder="correo@empresa.com" required />
              </div>
              <div>
                <label htmlFor="enterprisePhone">Teléfono</label>
                <input id="enterprisePhone" name="phone" placeholder="+598..." />
              </div>
              <div>
                <label htmlFor="enterpriseMessage">Necesidad</label>
                <textarea id="enterpriseMessage" name="message" rows="3" placeholder="Cantidad de sucursales, integraciones o requerimientos" />
              </div>
              <button type="submit" disabled={contactSubmitting}>
                {contactSubmitting ? 'Enviando...' : 'Enviar consulta'}
              </button>
              {contactSent ? <p className="success-message">Consulta registrada. Te contactaremos para coordinar la demo.</p> : null}
              {contactError ? <p className="error-message">{contactError}</p> : null}
            </form>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
