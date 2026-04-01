import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  MessageSquare,
  User,
  Bot,
  Headphones,
  RefreshCw,
  Send,
  Clock,
  AlertCircle,
} from "lucide-react";
import { conversationService, botService } from "../services/api";
import toast from "react-hot-toast";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000)
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatPhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13)
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  if (digits.length === 12)
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  return phone;
}

export default function Conversations() {
  const { botId } = useParams();
  const [bot, setBot] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    botService
      .getById(botId)
      .then((r) => setBot(r.data.data.bot))
      .catch(() => {});
    loadConversations();
  }, [botId]);

  useEffect(() => {
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [botId]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    pollRef.current = setInterval(() => loadMessages(selected.id), 5000);
    return () => clearInterval(pollRef.current);
  }, [selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await conversationService.list(botId);
      setConversations(res.data.data.conversations);
    } catch {
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadMessages = async (conversationId) => {
    setLoadingMsgs(true);
    try {
      const res = await conversationService.getMessages(conversationId);
      const { conversation, messages: msgs } = res.data.data;
      setSelected((prev) => ({ ...prev, status: conversation.status }));
      setMessages(msgs);
    } catch {
    } finally {
      setLoadingMsgs(false);
    }
  };

  const selectConversation = (conv) => {
    setSelected(conv);
    setMessages([]);
  };

  const handleTakeOver = async () => {
    try {
      await conversationService.takeOver(selected.id);
      setSelected((prev) => ({ ...prev, status: "human" }));
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, status: "human" } : c)),
      );
      toast.success("Você assumiu o controle da conversa");
    } catch {
      toast.error("Erro ao assumir conversa");
    }
  };

  const handleRelease = async () => {
    try {
      await conversationService.release(selected.id);
      setSelected((prev) => ({ ...prev, status: "bot" }));
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, status: "bot" } : c)),
      );
      toast.success("Bot reativado");
    } catch {
      toast.error("Erro ao reativar bot");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    setSending(true);
    try {
      await conversationService.sendMessage(selected.id, input.trim());
      setInput("");
      await loadMessages(selected.id);
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const isHuman =
    selected?.status === "human" || selected?.status === "waiting";

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
      <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {bot ? bot.name : "Conversas"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {conversations.length} conversa
            {conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={18} className="animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Nenhuma conversa ainda</p>
              <p className="text-xs text-gray-400 mt-1">
                As conversas do WhatsApp aparecerão aqui
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b transition-colors
                  ${conv.status === "waiting" ? "bg-orange-50 border-l-4 border-l-orange-400 hover:bg-orange-100" : ""}
                  ${conv.status !== "waiting" && selected?.id === conv.id ? "bg-brand-50 border-l-2 border-l-brand-500" : ""}
                  ${conv.status !== "waiting" && selected?.id !== conv.id ? "border-gray-50 hover:bg-gray-50" : ""}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${conv.status === "waiting" ? "bg-orange-200" : "bg-gray-200"}`}
                    >
                      {conv.status === "waiting" ? (
                        <AlertCircle size={14} className="text-orange-600" />
                      ) : (
                        <User size={14} className="text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.contact_name || formatPhone(conv.phone)}
                      </p>
                      {conv.contact_name && (
                        <p className="text-xs text-gray-400">
                          {formatPhone(conv.phone)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {formatTime(conv.last_message_at)}
                    </span>
                    {conv.status === "waiting" && (
                      <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">
                        aguardando
                      </span>
                    )}
                    {conv.status === "human" && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                        operador
                      </span>
                    )}
                  </div>
                </div>
                {conv.last_message && (
                  <p className="text-xs text-gray-500 mt-1 truncate pl-10">
                    {conv.last_message}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <MessageSquare size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Selecione uma conversa</p>
            <p className="text-sm text-gray-400 mt-1">
              Escolha uma conversa à esquerda para visualizar o histórico
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {selected.contact_name || formatPhone(selected.phone)}
                </p>
                {selected.contact_name && (
                  <p className="text-xs text-gray-400">
                    {formatPhone(selected.phone)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {selected?.status === "human" ? (
                <>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <Headphones size={12} /> Você está no controle
                  </span>
                  <button
                    onClick={handleRelease}
                    className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Bot size={12} /> Reativar bot
                  </button>
                </>
              ) : selected?.status === "waiting" ? (
                <>
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-medium flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} /> Aguardando atendente
                  </span>
                  <button
                    onClick={handleTakeOver}
                    className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1"
                  >
                    <Headphones size={12} /> Assumir agora
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <Bot size={12} /> Bot ativo
                  </span>
                  <button
                    onClick={handleTakeOver}
                    className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1"
                  >
                    <Headphones size={12} /> Assumir conversa
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loadingMsgs && messages.length === 0 ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={18} className="animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhuma mensagem
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] ${msg.role === "user" ? "" : ""}`}
                  >
                    {msg.role === "user" ? (
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    ) : msg.role === "operator" ? (
                      <div className="bg-orange-500 rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <Headphones size={10} className="text-orange-200" />
                          <span className="text-xs text-orange-200">
                            Operador
                          </span>
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p className="text-xs text-orange-200 mt-1 text-right">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-brand-500 rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <Bot size={10} className="text-brand-200" />
                          <span className="text-xs text-brand-200">Bot</span>
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p className="text-xs text-brand-200 mt-1 text-right">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {isHuman ? (
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-gray-100 flex gap-2 bg-white"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem como operador..."
                className="flex-1 input py-2 text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-center text-gray-400">
                O bot está respondendo automaticamente. Clique em{" "}
                <strong>Assumir conversa</strong> para responder manualmente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
