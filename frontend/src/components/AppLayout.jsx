import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function AppLayout() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-wrapper">
          <Outlet />
        </div>
        <footer className="app-footer">
          <span>Copyright © {currentYear} Linsse. Todos los derechos reservados.</span>
        </footer>
      </div>
    </div>
  );
}
