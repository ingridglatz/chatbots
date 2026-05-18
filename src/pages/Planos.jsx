import { useState, useEffect } from 'react';
import { Check, Loader, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { billingService } from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Planos() {
  const { tenant } = useAuth();
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, invoicesRes] = await Promise.all([
          billingService.listPlans(),
          billingService.listInvoices(),
        ]);
        setPlans(plansRes.data.data.plans || []);
        setInvoices(invoicesRes.data.data.invoices || []);
      } catch (err) {
        toast.error('Erro ao carregar planos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planId) => {
    try {
      setSubscribing(true);
      const res = await billingService.subscribe(planId);
      window.location.href = res.data.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao processar assinatura');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCanceling(true);
      await billingService.cancel();
      toast.success('Assinatura cancelada');
      setCancelModalOpen(false);
    } catch (err) {
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Planos e Assinatura</h2>
        <p className="text-gray-600">Escolha o plano ideal para seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 flex flex-col ${tenant?.plan === plan.id ? 'ring-2 ring-brand-500 bg-brand-50' : ''}`}
          >
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <div className="my-4">
              <span className="text-3xl font-bold text-gray-900">R$ {plan.price}</span>
              <span className="text-gray-600">/mês</span>
            </div>

            {tenant?.plan === plan.id && (
              <div className="mb-4 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-full inline-block w-fit">
                Plano atual
              </div>
            )}

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-green-600 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {tenant?.plan === plan.id ? (
              <button
                onClick={() => setCancelModalOpen(true)}
                disabled={canceling}
                className="btn-danger w-full"
              >
                {canceling ? <Loader size={16} className="animate-spin" /> : 'Cancelar Assinatura'}
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing}
                className="btn-primary w-full"
              >
                {subscribing ? <Loader size={16} className="animate-spin" /> : 'Escolher Plano'}
              </button>
            )}
          </div>
        ))}
      </div>

      {invoices.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Faturas recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{invoice.id.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {(invoice.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge capitalize ${invoice.status === 'CONFIRMED' || invoice.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {invoice.status === 'CONFIRMED' || invoice.status === 'RECEIVED' ? 'Pago' : invoice.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700 flex items-center gap-1"
                        >
                          <Download size={14} />
                          Boleto/PIX
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancelar assinatura"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja cancelar? Você manterá acesso até o fim do
            ciclo atual e perderá acesso aos recursos do plano após o
            vencimento.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Manter
            </button>
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="btn-danger flex-1"
            >
              {canceling ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                'Cancelar agora'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
