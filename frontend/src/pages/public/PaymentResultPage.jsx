import { Link, useParams, useSearchParams } from 'react-router-dom';

const TITLES = {
  exitoso: 'Pago recibido',
  pendiente: 'Pago pendiente',
  error: 'No se pudo confirmar el pago'
};

export default function PaymentResultPage() {
  const { status } = useParams();
  const [searchParams] = useSearchParams();
  const title = TITLES[status] || 'Estado del pago';
  const paymentId = searchParams.get('payment_id') || searchParams.get('preapproval_id');

  return (
    <main className="public-page public-page--narrow">
      <section className="section-card">
        <h1>{title}</h1>
        <p>Mercado Pago notificará al sistema para activar o actualizar la licencia de la empresa.</p>
        {paymentId ? <p>Código de referencia: <strong>{paymentId}</strong></p> : null}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="button-link" to="/login">Ir al login</Link>
          <Link className="secondary-link" to="/planes">Ver planes</Link>
        </div>
      </section>
    </main>
  );
}
