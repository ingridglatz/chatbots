import { useState, useEffect } from "react";
import {
  Key,
  Eye,
  EyeOff,
  Loader,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { aiSettingsService } from "../services/api";
import toast from "react-hot-toast";

const MODELS = [
  {
    value: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6 (recomendado)",
    description: "Melhor custo-benefício, rápido e inteligente",
  },
  {
    value: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    description: "Máxima inteligência, mais caro",
  },
  {
    value: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    description: "Mais rápido e econômico, ideal para alto volume",
  },
];

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [settings, setSettings] = useState({
    aiProvider: "platform",
    aiModel: "claude-sonnet-4-6",
    hasCustomKey: false,
    apiKeyMasked: null,
  });
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    aiSettingsService
      .get()
      .then((res) => setSettings(res.data.data))
      .catch(() => toast.error("Erro ao carregar configurações"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (settings.aiProvider === "custom" && !apiKey && !settings.hasCustomKey) {
      toast.error(
        "Cole sua chave de API da Anthropic para usar chave própria.",
      );
      return;
    }
    try {
      setSaving(true);
      await aiSettingsService.save({
        aiProvider: settings.aiProvider,
        apiKey: apiKey || undefined,
        aiModel: settings.aiModel,
      });
      toast.success("Configurações salvas!");
      if (apiKey) {
        setSettings((prev) => ({
          ...prev,
          hasCustomKey: true,
          apiKeyMasked: apiKey.slice(0, 12) + "••••••••" + apiKey.slice(-4),
        }));
        setApiKey("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (
      !confirm("Remover sua chave? A plataforma voltará a usar a chave padrão.")
    )
      return;
    try {
      setRemoving(true);
      await aiSettingsService.removeKey();
      setSettings((prev) => ({
        ...prev,
        aiProvider: "platform",
        hasCustomKey: false,
        apiKeyMasked: null,
      }));
      toast.success("Chave removida");
    } catch {
      toast.error("Erro ao remover chave");
    } finally {
      setRemoving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader size={24} className="animate-spin text-brand-500" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
            <Cpu size={18} className="text-brand-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Integração com IA</h2>
            <p className="text-sm text-gray-500">
              Escolha como sua conta acessa o Claude
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="label">Chave de API</label>

          <label
            className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${settings.aiProvider === "platform" ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}
          >
            <input
              type="radio"
              name="aiProvider"
              value="platform"
              checked={settings.aiProvider === "platform"}
              onChange={() =>
                setSettings({ ...settings, aiProvider: "platform" })
              }
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Usar chave da plataforma
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                O custo de IA é contabilizado no seu plano. Mais simples, sem
                configuração.
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${settings.aiProvider === "custom" ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}
          >
            <input
              type="radio"
              name="aiProvider"
              value="custom"
              checked={settings.aiProvider === "custom"}
              onChange={() =>
                setSettings({ ...settings, aiProvider: "custom" })
              }
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Usar minha própria chave
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Você paga diretamente à Anthropic. Mais controle sobre gastos e
                limites.
              </p>
            </div>
          </label>
        </div>

        {settings.aiProvider === "custom" && (
          <div className="space-y-3">
            <label className="label">Chave de API da Anthropic</label>

            {settings.hasCustomKey && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm text-green-700 font-mono">
                    {settings.apiKeyMasked}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  disabled={removing}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  {removing ? (
                    <Loader size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Remover
                </button>
              </div>
            )}

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Key size={16} className="text-gray-400" />
              </div>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  settings.hasCustomKey
                    ? "Cole uma nova chave para substituir..."
                    : "sk-ant-api03-..."
                }
                className="input pl-9 pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Acesse{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:underline"
              >
                console.anthropic.com
              </a>{" "}
              para criar sua chave. Ela é armazenada criptografada.
            </p>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle
                size={14}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-amber-700">
                A chave será validada ao salvar. Certifique-se de que sua conta
                Anthropic tem créditos disponíveis.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="label">Modelo de IA</label>
          <select
            value={settings.aiModel}
            onChange={(e) =>
              setSettings({ ...settings, aiModel: e.target.value })
            }
            className="input"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {MODELS.find((m) => m.value === settings.aiModel)?.description}
          </p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Salvar configurações
        </button>
      </form>
    </div>
  );
}
