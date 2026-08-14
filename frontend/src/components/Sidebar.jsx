import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatLicensePlan, formatLicensePrice } from '../utils/license.js';

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
  { to: '/licencia', label: 'Mi licencia' },
  { to: '/admin/planes', label: 'Planes', allowedEmails: ['admin@linsse.com'] }
];

const WHATSAPP_HELP_URL = 'https://wa.me/59898682749?text=Hola%2C%20necesito%20ayuda%20con%20Linsse%20Stock';

function WhatsAppIcon() {
  return (
    <svg className="sidebar-help__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.34 4.95L2 22l5.27-1.39a9.88 9.88 0 0 0 4.77 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.13.83.84-3.05-.2-.31a8.16 8.16 0 0 1-1.25-4.39c0-4.54 3.69-8.23 8.23-8.23 2.2 0 4.26.86 5.81 2.41a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24Zm4.51-6.17c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.04s.88 2.37 1 2.53c.12.16 1.73 2.64 4.2 3.7.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.14-1.17-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const role = user?.role || null;
  const licenseLabel = formatLicensePlan(user?.license);
  const licensePrice = formatLicensePrice(user?.license);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Stock</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.filter(item => {
          if (item.allowedEmails && !item.allowedEmails.includes(String(user?.email || '').toLowerCase())) {
            return false;
          }
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
      <a
        className="sidebar-help"
        href={WHATSAPP_HELP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Solicitar ayuda por WhatsApp"
      >
        <WhatsAppIcon />
        <span>
          <strong>¿Necesitás ayuda?</strong>
          <small>Escribinos por WhatsApp</small>
        </span>
      </a>
      <div className="sidebar-footer">
        <span>v1.0.0</span>
        {user?.license ? (
          <div className="sidebar-license">
            <strong>{user.license.tenantName}</strong>
            <span>{licenseLabel}</span>
            {licensePrice ? <span>{licensePrice}</span> : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
