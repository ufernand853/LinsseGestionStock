import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatLicensePlan, formatLicensePrice } from '../utils/license.js';
import BrandLogo from './BrandLogo.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Resumen' },
  { to: '/items', label: 'Artículos', permission: 'items.read', hiddenForRoles: ['Operador'] },
  { to: '/items/barcode-reception', label: 'Escaneo de Productos', permissionsAny: ['stock.approve', 'stock.request'] },
  { to: '/overstock', label: 'Sobrestock', permission: 'items.read', hiddenForRoles: ['Operador'] },
  { to: '/items/trash', label: 'Papelera', permission: 'items.write', hiddenForRoles: ['Operador'] },
  { to: '/items/download', label: 'PDF e Impresión', permission: 'items.read', hiddenForRoles: ['Operador', 'Supervisor'] },
  { to: '/groups', label: 'Grupos', permission: 'items.write', hiddenForRoles: ['Operador'] },
  { to: '/requests', label: 'Solicitudes', permission: 'stock.request' },
  { to: '/approvals', label: 'Aprobaciones', permission: 'stock.approve', hiddenForRoles: ['Operador'] },
  { to: '/locations', label: 'Ubicaciones', permission: 'items.read', hiddenForRoles: ['Operador'] },
  { to: '/reports', label: 'Reportes', permission: 'reports.read', hiddenForRoles: ['Operador'] },
  { to: '/audit', label: 'Auditoría', permission: 'stock.logs.read', hiddenForRoles: ['Operador'] },
  { to: '/users', label: 'Usuarios', permission: 'users.read', hiddenForRoles: ['Operador'] },
  { to: '/licencia', label: 'Mi licencia' }
];

export default function Sidebar() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const role = user?.role || null;
  const licenseLabel = formatLicensePlan(user?.license);
  const licensePrice = formatLicensePrice(user?.license);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BrandLogo />
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.filter(item => {
          if (item.hiddenForRoles && role && item.hiddenForRoles.includes(role)) {
            return false;
          }
          if (item.permission && !permissions.includes(item.permission)) {
            return false;
          }
          if (item.permissionsAny && !item.permissionsAny.some(permission => permissions.includes(permission))) {
            return false;
          }
          return true;
        }).map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>v1.0.0</span>
        {user?.license ? (
          <div className="sidebar-license">
            <strong>{user.license.tenantName}</strong>
            <span>{licenseLabel}</span>
            {licensePrice ? <span>{licensePrice}</span> : null}
          </div>
        ) : null}
        <span className="sidebar-footer__copyright">Linsse © {new Date().getFullYear()}</span>
      </div>
    </aside>
  );
}
