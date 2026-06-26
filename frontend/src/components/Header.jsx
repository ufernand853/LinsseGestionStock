import { useAuth } from '../context/AuthContext.jsx';
import { formatLicensePlan } from '../utils/license.js';

export default function Header() {
  const { user, logout } = useAuth();
  const licenseLabel = formatLicensePlan(user?.license);

  return (
    <header className="app-header">
      <h1>Stock</h1>
      <div className="header-user">
        {user ? (
          <>
            <span className="header-user-summary">
              <strong>{user.username}</strong> · {user.email} · {user.role || 'Sin rol'}
            </span>
            <span className="license-pill">{licenseLabel}</span>
            <button type="button" className="secondary-button" onClick={logout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <span>Sin sesión activa</span>
        )}
      </div>
    </header>
  );
}
