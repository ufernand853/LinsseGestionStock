import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../utils/publicApi.js';
import { formatPlanPrice } from '../../utils/license.js';

export default function RegisterTenantPage() {
  const [searchParams] = useSearchParams();
  const selectedPlanCode = searchParams.get('plan') || 'BASIC';
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ companyName: '', billingEmail: '', username: '', password: '', planCode: selectedPlanCode });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicApi('/public/plans').then(setPlans).catch(err => setError(err.message));
  }, []);

  const selectedPlan = useMemo(() => plans.find(plan => plan.code === form.planCode), [plans, form.planCode]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await publicApi('/public/register', { method: 'POST', body: form });
      setResult(data);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="public-page public-page--narrow">
      <Link to="/planes" className="secondary-link">← Volver a planes</Link>
      <section className="section-card">
        <h1>Crear cuenta SaaS</h1>
        <p>La cuenta se crea separada por empresa. Luego Mercado Pago Uruguay confirma la suscripción.</p>
        {selectedPlan ? <p className="license-pill">Plan {selectedPlan.name}: {formatPlanPrice(selectedPlan)}</p> : null}
        {error ? <div className="error-message">{error}</div> : null}
        {result && !result.checkoutUrl ? <div className="success-message">{result.message}</div> : null}
        <form className="form-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="companyName">Empresa</label>
            <input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="billingEmail">Email de acceso y facturación</label>
            <input id="billingEmail" name="billingEmail" type="email" value={form.billingEmail} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input id="username" name="username" value={form.username} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          <div className="input-group">
            <label htmlFor="planCode">Plan</label>
            <select id="planCode" name="planCode" value={form.planCode} onChange={handleChange}>
              {plans.map(plan => <option key={plan.code} value={plan.code}>{plan.name} - {formatPlanPrice(plan)}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta y pagar'}</button>
        </form>
      </section>
    </main>
  );
}
