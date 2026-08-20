import { useEffect, useState } from 'react';
import useApi from '../../hooks/useApi.js';
import LoadingIndicator from '../../components/LoadingIndicator.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { formatDateTime24 } from '../../utils/dateTime.js';

const statusLabels = {
  trialing: 'En prueba',
  active: 'Activo',
  past_due: 'Pago pendiente',
  canceled: 'Cancelado'
};

export default function RegistrationsAdminPage() {
  const api = useApi();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/billing/registrations')
      .then(response => {
        if (active) setRegistrations(Array.isArray(response) ? response : []);
      })
      .catch(err => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [api]);

  if (loading) return <LoadingIndicator message="Cargando registros..." />;

  return (
    <div className="page-wrapper">
      <h2>Empresas registradas</h2>
      <p style={{ color: '#475569', marginTop: '-0.4rem' }}>
        Cuentas creadas desde el registro público, ordenadas desde la más reciente.
      </p>
      {error ? <ErrorMessage error={error} /> : null}
      <div className="section-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha de registro</th>
                <th>Empresa</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Usuarios</th>
                <th>Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(registration => (
                <tr key={registration.id}>
                  <td>{formatDateTime24(registration.registeredAt)}</td>
                  <td>{registration.companyName}</td>
                  <td>{registration.username || '-'}</td>
                  <td><a href={`mailto:${registration.billingEmail}`}>{registration.billingEmail}</a></td>
                  <td>{registration.plan?.name || '-'}</td>
                  <td>
                    <span className={`badge ${registration.subscriptionStatus === 'active' ? 'approved' : registration.subscriptionStatus === 'canceled' ? 'rejected' : ''}`}>
                      {statusLabels[registration.subscriptionStatus] || registration.subscriptionStatus}
                    </span>
                  </td>
                  <td>{registration.userCount}</td>
                  <td>{formatDateTime24(registration.lastLoginAt)}</td>
                </tr>
              ))}
              {registrations.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center' }}>Todavía no hay empresas registradas.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
