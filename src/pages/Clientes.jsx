import { useState, useEffect } from 'react';
import { Search, Loader, UserPlus, Trash2, Copy, CheckCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Clientes() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'viewer' });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await userService.list();
      setUsers(res.data.data.users || []);
    } catch {
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    try {
      setInviting(true);
      const res = await userService.invite(inviteForm);
      setInviteResult(res.data.data);
      setInviteForm({ name: '', email: '', role: 'viewer' });
      toast.success('Usuário criado');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao convidar');
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await userService.remove(deleteTarget.id);
      toast.success('Usuário removido');
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao remover');
    } finally {
      setDeleting(false);
    }
  };

  const copyPassword = async () => {
    if (!inviteResult?.temporaryPassword) return;
    await navigator.clipboard.writeText(inviteResult.temporaryPassword);
    setCopied(true);
    toast.success('Senha copiada');
    setTimeout(() => setCopied(false), 2000);
  };

  const closeInviteModal = () => {
    setInviteOpen(false);
    setInviteResult(null);
    setInviteForm({ name: '', email: '', role: 'viewer' });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const isOwner = currentUser?.role === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Membros da Equipe</h2>
          <p className="text-sm text-gray-500 mt-1">{users.length} membro(s)</p>
        </div>
        {isOwner && (
          <button onClick={() => setInviteOpen(true)} className="btn-primary">
            <UserPlus size={16} /> Convidar membro
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Nenhum membro encontrado</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Função</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Data de adesão</th>
                {isOwner && <th className="px-6 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge capitalize ${u.role === 'owner' ? 'bg-brand-100 text-brand-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role === 'owner' ? 'Proprietário' : u.role === 'admin' ? 'Administrador' : 'Visualizador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  {isOwner && (
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'owner' && (
                        <button
                          onClick={() => { setDeleteTarget(u); setDeleteOpen(true); }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remover usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={inviteOpen} onClose={closeInviteModal} title="Convidar novo membro" size="md">
        {inviteResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-1">Usuário criado com sucesso!</p>
              <p className="text-xs text-green-700">Compartilhe a senha temporária com o membro. Ele deverá alterá-la no primeiro acesso.</p>
            </div>
            <div>
              <label className="label">E-mail</label>
              <div className="input bg-gray-50 text-gray-700">{inviteResult.email}</div>
            </div>
            <div>
              <label className="label">Senha temporária</label>
              <div className="flex gap-2">
                <div className="input bg-gray-50 font-mono text-sm flex-1">{inviteResult.temporaryPassword}</div>
                <button onClick={copyPassword} className="btn-secondary px-3">
                  {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <button onClick={closeInviteModal} className="btn-primary w-full">Fechar</button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className="input"
                placeholder="Nome do membro"
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="input"
                placeholder="membro@empresa.com"
              />
            </div>
            <div>
              <label className="label">Função</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="input"
              >
                <option value="viewer">Visualizador (apenas leitura)</option>
                <option value="admin">Administrador (pode editar bots)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeInviteModal} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={inviting} className="btn-primary flex-1">
                {inviting ? <Loader size={16} className="animate-spin" /> : 'Convidar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remover membro" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? <Loader size={16} className="animate-spin" /> : 'Remover'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
