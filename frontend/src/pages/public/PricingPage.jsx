import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../utils/publicApi.js';
import { formatPlanLimit, formatPlanPrice } from '../../utils/license.js';
import BrandLogo from '../../components/BrandLogo.jsx';

const planVisuals = {
  BASIC: {
    icon: '📦',
    label: 'Gestión simple para pequeñas empresas',
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


const commercialFeatures = [
  {
    icon: '📦',
    title: 'Productos siempre ordenados',
    text: 'Controlá códigos, unidades, grupos y estados para saber exactamente qué tenés disponible.'
  },
  {
    icon: '📍',
    title: 'Ubicaciones claras',
    text: 'Organizá depósitos, sucursales, estanterías o zonas para encontrar la mercadería más rápido.'
  },
  {
    icon: '👥',
    title: 'Usuarios y permisos',
    text: 'Asigná roles a tu equipo y protegé la operación con accesos separados por responsabilidad.'
  },
  {
    icon: '📊',
    title: 'Reportes y alertas',
    text: 'Tomá decisiones con información de movimientos, stock bajo, sobrestock y actividad de inventario.'
  }
];

const selfServicePlanCodes = ['BASIC', 'PRO'];
const enterpriseHighlights = [
  'Integración con plataformas de e-commerce',
  'Acompañamiento para adaptar flujos a medida',
  'Integración con IA'
];
const whatsappContactUrl = 'https://wa.me/59898682749?text=Hola%2C%20tengo%20una%20consulta%20sobre%20los%20planes%20de%20Linsse%20Stock';

function WhatsAppIcon() {
  return (
    <svg className="whatsapp-link__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.34 4.95L2 22l5.27-1.39a9.88 9.88 0 0 0 4.77 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.13.83.84-3.05-.2-.31a8.16 8.16 0 0 1-1.25-4.39c0-4.54 3.69-8.23 8.23-8.23 2.2 0 4.26.86 5.81 2.41a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24Zm4.51-6.17c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.04s.88 2.37 1 2.53c.12.16 1.73 2.64 4.2 3.7.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.14-1.17-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

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
      <section className="public-hero public-hero--branded">
        <BrandLogo />
        <span className="public-eyebrow">SaaS de stock</span>
        <h1>Elegí el plan para tu empresa</h1>
        <p>Registrá tu cuenta y empezá a gestionar productos, ubicaciones, usuarios y mucho más.</p>
        <div className="public-hero-actions">
          <Link to="/funcionalidades" className="secondary-link">Ver funcionalidades</Link>
          <Link to="/login" className="secondary-link">Ya tengo cuenta</Link>
          <a className="whatsapp-link" href={whatsappContactUrl} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp al equipo comercial">
            <WhatsAppIcon />
            <span>Contactar por WhatsApp</span>
          </a>
        </div>
      </section>

      <section className="pricing-features section-card" aria-label="Funcionalidades principales antes de elegir un plan">
        <div className="pricing-features__intro">
          <span className="public-eyebrow">Antes de elegir un plan</span>
          <h2>Todo lo que necesitás para profesionalizar la gestión de stock</h2>
          <p>Una vista comercial rápida de las funciones principales que vas a usar para ordenar tu operación, reducir errores y crecer con más control.</p>
        </div>
        <div className="pricing-features__grid">
          {commercialFeatures.map(feature => (
            <article className="pricing-feature-card" key={feature.title}>
              <span aria-hidden="true">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
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
              <ul className="pricing-enterprise-highlights" aria-label="Beneficios del plan a medida">
                {enterpriseHighlights.map(highlight => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
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
