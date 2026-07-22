import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

const loginHighlights = [
  {
    metric: 'Tiempo real',
    title: 'Stock siempre actualizado',
    description: 'Visualizá existencias, mínimos y alertas críticas para decidir compras sin perder ventas.',
  },
  {
    metric: 'Control total',
    title: 'Movimientos trazables',
    description: 'Registrá ingresos, egresos, aprobaciones y auditoría por usuario en cada operación.',
  },
  {
    metric: 'Multi sucursal',
    title: 'Equipos y ubicaciones conectadas',
    description: 'Organizá depósitos, grupos, permisos y reportes desde un único panel centralizado.',
  },
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
      <div className="auth-shell">
        <section className="auth-value-panel" aria-labelledby="login-value-title">
          <span className="public-eyebrow auth-value-panel__eyebrow">Linsse Stock</span>
          <h2 id="login-value-title">Gestión de inventario lista para vender más y operar mejor</h2>
          <p className="auth-value-panel__lead">
            Una plataforma comercial y operativa para controlar tu mercadería, anticipar faltantes y
            darle visibilidad inmediata a cada equipo antes de ingresar al sistema.
          </p>
          <div className="auth-value-panel__highlights">
            {loginHighlights.map(highlight => (
              <article className="auth-highlight" key={highlight.title}>
                <span>{highlight.metric}</span>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
          <div className="auth-value-panel__cta">
            <strong>Primer impacto claro:</strong> tablero, reportes, alertas y trazabilidad desde el primer acceso.
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
