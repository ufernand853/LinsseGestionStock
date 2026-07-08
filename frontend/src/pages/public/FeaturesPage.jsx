import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo.jsx';

const features = [
  {
    icon: '📦',
    title: 'Stock siempre bajo control',
    text: 'Centralizá productos, códigos, unidades y estados para saber qué tenés, dónde está y cuándo necesitás reponer.'
  },
  {
    icon: '🏷️',
    title: 'Recepción con códigos de barras',
    text: 'Agilizá ingresos de mercadería, reducís errores de carga y mantenés trazabilidad desde el primer movimiento.'
  },
  {
    icon: '📍',
    title: 'Ubicaciones y sucursales ordenadas',
    text: 'Separá depósitos, locales, estanterías o áreas de trabajo para que tu equipo encuentre cada producto más rápido.'
  },
  {
    icon: '👥',
    title: 'Usuarios, roles y permisos',
    text: 'Dale acceso a cada persona solo a lo que necesita y mantené tu operación segura a medida que el equipo crece.'
  },
  {
    icon: '✅',
    title: 'Solicitudes y aprobaciones',
    text: 'Controlá movimientos sensibles con flujos de aprobación para evitar salidas, ajustes o transferencias no autorizadas.'
  },
  {
    icon: '📊',
    title: 'Reportes para decidir mejor',
    text: 'Visualizá movimientos, inventario, alertas y sobrestock con información clara para comprar y vender con más precisión.'
  }
];

const benefits = [
  'Menos pérdidas por errores manuales o falta de seguimiento.',
  'Más velocidad para recibir, mover y consultar mercadería.',
  'Información ordenada para tomar decisiones comerciales.',
  'Escalable desde un comercio pequeño hasta operaciones con varias ubicaciones.'
];

export default function FeaturesPage() {
  return (
    <main className="public-page public-page--commercial">
      <section className="features-hero">
        <div className="features-hero__content">
          <BrandLogo />
          <span className="public-eyebrow">Características de Linsse Stock</span>
          <h1>Gestioná tu inventario con una plataforma pensada para vender más y perder menos.</h1>
          <p>
            Linsse Stock reúne productos, ubicaciones, usuarios, movimientos, reportes y alertas en una sola solución para que tu empresa trabaje con orden, control y datos confiables antes de contratar un plan.
          </p>
          <div className="public-hero-actions">
            <Link to="/planes" className="button-link">Ver planes disponibles</Link>
            <Link to="/registro" className="secondary-link">Crear cuenta</Link>
          </div>
        </div>
        <aside className="features-hero__panel" aria-label="Resumen comercial">
          <strong>Operación más simple</strong>
          <span>Stock, usuarios y ubicaciones en un único panel.</span>
          <div className="features-hero__metric">
            <b>24/7</b>
            <small>Acceso web para consultar tu inventario cuando lo necesites.</small>
          </div>
        </aside>
      </section>

      <section className="features-grid" aria-label="Funcionalidades principales">
        {features.map(feature => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="features-conversion section-card">
        <div>
          <span className="public-eyebrow">Antes de elegir tu plan</span>
          <h2>Una herramienta comercial para ordenar la operación y crecer con confianza.</h2>
          <p>
            Ideal para empresas que necesitan profesionalizar su inventario, reducir tareas repetitivas y tener visibilidad real de su mercadería sin depender de planillas dispersas.
          </p>
        </div>
        <ul>
          {benefits.map(benefit => <li key={benefit}>{benefit}</li>)}
        </ul>
        <Link to="/planes" className="button-link">Comparar planes y precios</Link>
      </section>
    </main>
  );
}
