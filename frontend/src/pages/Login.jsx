import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

const commercialFeatures = [
  {
    metric: 'Bajo costo',
    title: 'Empezá sin una inversión pesada',
    text: 'Pagás una suscripción accesible y obtenés control profesional de stock sin comprar infraestructura ni depender de planillas.'
  },
  {
    metric: 'Mucha funcionalidad',
    title: 'Todo lo importante desde el primer plan',
    text: 'Productos, ubicaciones, usuarios, roles, movimientos, aprobaciones, alertas y reportes para ordenar la operación completa.'
  },
  {
    metric: 'Asistencia remota',
    title: 'Acompañamiento para ponerlo en marcha',
    text: 'Te ayudamos a configurar el sistema, cargar datos iniciales y resolver dudas a distancia para que tu equipo lo adopte rápido.'
  },
  {
    metric: 'IA en Plan Pro',
    title: 'Integración con IA para decidir mejor',
    text: 'Sumá análisis inteligente, recomendaciones y automatizaciones para anticipar faltantes, detectar oportunidades y vender más.'
  }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, initializing } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async event => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-commercial-shell">
        <section className="auth-commercial-panel" aria-labelledby="auth-commercial-title">
          <BrandLogo />
          <span className="public-eyebrow">Suscribite y ordená tu stock hoy</span>
          <h1 id="auth-commercial-title">Bajo costo, mucha funcionalidad y soporte remoto para vender más con stock bajo control.</h1>
          <p>
            Linsse Stock está pensado para pequeñas empresas que quieren profesionalizar su inventario sin gastar de más: empezás rápido, recibís asistencia remota y podés escalar al Plan Pro con integración de IA para tomar mejores decisiones comerciales.
          </p>
          <div className="auth-commercial-features">
            {commercialFeatures.map(feature => (
              <article className="auth-commercial-feature" key={feature.title}>
                <span>{feature.metric}</span>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
          <div className="auth-commercial-actions">
            <Link to="/planes" className="button-link">Quiero suscribirme</Link>
            <Link to="/funcionalidades" className="secondary-link">Ver todo lo incluido</Link>
          </div>
        </section>

        <section className="auth-card section-card">
          <BrandLogo className="brand-logo--centered" />
          <div className="auth-card__heading">
            <span className="public-eyebrow">Acceso seguro</span>
            <h1>Ingreso al sistema</h1>
            <p>Utilizá tus credenciales corporativas para acceder al panel de gestión de stock.</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <p className="auth-card__footer">
            ¿No tenés cuenta? <Link to="/planes">Ver planes</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
