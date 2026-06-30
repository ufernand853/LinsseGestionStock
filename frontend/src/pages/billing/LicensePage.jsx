import { useEffect, useState } from 'react';
import useApi from '../../hooks/useApi.js';
import { formatLicensePlan, formatLicensePrice } from '../../utils/license.js';

export default function LicensePage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/billing/license').then(setData).catch(err => setError(err.message));
  }, [api]);

  const license = data?.license;
  const limit = license?.plan?.productLimit;

  return (
    <div className="page-wrapper">
      <section className="section-card">
        <h2>Mi licencia</h2>
        {error ? <div className="error-message">{error}</div> : null}
        {!data && !error ? <p>Cargando licencia...</p> : null}
        {license ? (
          <div className="license-detail-grid">
            <div><span>Empresa</span><strong>{license.tenantName}</strong></div>
            <div><span>Plan</span><strong>{formatLicensePlan(license)}</strong></div>
            <div><span>Precio</span><strong>{formatLicensePrice(license) || 'A medida'}</strong></div>
            <div><span>Estado</span><strong>{license.status}</strong></div>
            <div><span>Productos usados</span><strong>{data.usedProducts}{limit ? ` / ${limit}` : ' / sin límite'}</strong></div>
            <div><span>Suscripción</span><strong>{data.subscription?.status || 'Sin suscripción automática'}</strong></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
