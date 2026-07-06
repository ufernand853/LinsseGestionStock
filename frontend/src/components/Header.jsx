import { useAuth } from '../context/AuthContext.jsx';
import { formatLicensePlan } from '../utils/license.js';
import BrandLogo from './BrandLogo.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const licenseLabel = formatLicensePlan(user?.license);

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <BrandLogo compact />
      </div>
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
