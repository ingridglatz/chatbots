import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import api from '../services/api';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/bots': 'Meus Bots',
  '/clientes': 'Equipe',
  '/planos': 'Planos & Assinatura',
  '/configuracoes': 'Configurações',
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { waitingCount, requestPermission } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  const title =
    PAGE_TITLES[pathname] ||
    (pathname.match(/^\/bots\/[^/]+\/conversations$/)
      ? 'Conversas'
      : pathname.startsWith('/bots/')
      ? 'Configurar Bot'
      : 'ChatBots');
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'CB';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popoverRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const loadWaiting = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenant/bots');
      const bots = res.data.data.bots || [];
      const lists = await Promise.all(
        bots.map((b) =>
          api
            .get(`/tenant/bots/${b.id}/conversations`)
            .then((r) => (r.data.data.conversations || [])
              .filter((c) => c.status === 'waiting')
              .map((c) => ({ ...c, botId: b.id, botName: b.name })))
            .catch(() => []),
        ),
      );
      const waiting = lists.flat().sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
      setItems(waiting);
    } finally {
      setLoading(false);
    }
  };

  const togglePopover = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      requestPermission().catch(() => {});
      await loadWaiting();
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3 relative" ref={popoverRef}>
        <button
          onClick={togglePopover}
          className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Notificações"
        >
          <Bell size={18} />
          {waitingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {waitingCount > 9 ? '9+' : waitingCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-30">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-900">Atendimentos pendentes</p>
              <p className="text-xs text-gray-500">{waitingCount} aguardando</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-gray-400">Carregando…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  <MessageSquare size={24} className="mx-auto mb-2 text-gray-300" />
                  Nenhum cliente aguardando atendente.
                </div>
              ) : (
                items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setOpen(false);
                      navigate(`/bots/${c.botId}/conversations`);
                    }}
                    className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.contact_name || c.phone}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{c.botName}</p>
                    {c.last_message && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{c.last_message}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
