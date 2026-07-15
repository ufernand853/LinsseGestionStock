import { useEffect, useState } from 'react';
import useApi from '../../hooks/useApi.js';
import { formatPlanLimit, formatPlanPrice } from '../../utils/license.js';

function normalizePlanForm(plan) {
  return {
    name: plan.name || '',
    priceAmount: plan.priceAmount ?? '',
    currency: plan.currency || 'UYU',
    productLimit: plan.productLimit ?? '',
    description: plan.description || '',
    ctaLabel: plan.ctaLabel || 'Contratar',
    isActive: Boolean(plan.isActive)
  };
}

export default function PlansAdminPage() {
  const api = useApi();
  const [plans, setPlans] = useState([]);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  async function loadPlans() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billing/plans');
      setPlans(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, [api]);

  function startEdit(plan) {
    setEditingCode(plan.code);
    setForm(normalizePlanForm(plan));
    setSuccessMessage(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingCode(null);
    setForm(null);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload = {
        ...form,
        priceAmount: form.priceAmount === '' ? null : Number(form.priceAmount),
        productLimit: form.productLimit === '' ? null : Number(form.productLimit)
      };
      const updatedPlan = await api.put(`/billing/plans/${editingCode}`, payload);
      setPlans(current => current.map(plan => (plan.code === updatedPlan.code ? updatedPlan : plan)));
      setSuccessMessage(`Plan ${updatedPlan.name} actualizado correctamente.`);
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-wrapper">
      <h2>Costos de planes</h2>
      <p style={{ color: '#475569', marginTop: '-0.4rem' }}>
        Actualizá dinámicamente los precios, límites y textos comerciales que se muestran en la página pública de planes.
      </p>

      {error ? <div className="error-message">{error}</div> : null}
      {successMessage ? <div className="success-message">{successMessage}</div> : null}
      {loading ? <div className="section-card">Cargando planes...</div> : null}

      <div className="plans-admin-grid">
        {plans.map(plan => {
          const isEditing = editingCode === plan.code;
          return (
            <article className="section-card plans-admin-card" key={plan.code}>
              {isEditing ? (
                <form className="plans-admin-form" onSubmit={handleSubmit}>
                  <div className="plans-admin-card__header">
                    <div>
                      <span className="public-eyebrow">{plan.code}</span>
                      <h3>Editar {plan.name}</h3>
                    </div>
                    <label className="plans-admin-active-toggle">
                      <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                      Activo
                    </label>
                  </div>

                  <div className="form-grid form-grid--compact">
                    <div>
                      <label htmlFor={`name-${plan.code}`}>Nombre</label>
                      <input id={`name-${plan.code}`} name="name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div>
                      <label htmlFor={`priceAmount-${plan.code}`}>Precio</label>
                      <input id={`priceAmount-${plan.code}`} name="priceAmount" type="number" min="0" step="0.01" value={form.priceAmount} onChange={handleChange} placeholder="A medida" />
                    </div>
                    <div>
                      <label htmlFor={`currency-${plan.code}`}>Moneda</label>
                      <input id={`currency-${plan.code}`} name="currency" value={form.currency} onChange={handleChange} maxLength="3" required />
                    </div>
                    <div>
                      <label htmlFor={`productLimit-${plan.code}`}>Límite de productos</label>
                      <input id={`productLimit-${plan.code}`} name="productLimit" type="number" min="1" step="1" value={form.productLimit} onChange={handleChange} placeholder="Sin límite" />
                    </div>
                    <div>
                      <label htmlFor={`ctaLabel-${plan.code}`}>Texto del botón</label>
                      <input id={`ctaLabel-${plan.code}`} name="ctaLabel" value={form.ctaLabel} onChange={handleChange} required />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`description-${plan.code}`}>Descripción</label>
                    <textarea id={`description-${plan.code}`} name="description" rows="3" value={form.description} onChange={handleChange} />
                  </div>

                  <div className="inline-actions">
                    <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                    <button type="button" className="secondary-button" onClick={cancelEdit} disabled={saving}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="plans-admin-card__header">
                    <div>
                      <span className="public-eyebrow">{plan.code}</span>
                      <h3>{plan.name}</h3>
                    </div>
                    <span className={`badge ${plan.isActive ? 'approved' : 'rejected'}`}>
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="license-detail-grid">
                    <div><span>Precio público</span><strong>{formatPlanPrice(plan)}</strong></div>
                    <div><span>Límite</span><strong>{formatPlanLimit(plan)}</strong></div>
                  </div>
                  <p>{plan.description || 'Sin descripción.'}</p>
                  <button type="button" onClick={() => startEdit(plan)}>Editar costo</button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
