(function() {
  'use strict';

  const scriptTag = document.currentScript || document.scripts[document.scripts.length - 1];
  const botId = scriptTag.getAttribute('data-bot-id');
  const apiUrl = scriptTag.getAttribute('data-api-url') || '/api';

  if (!botId) {
    console.error('ChatBots Widget: data-bot-id não fornecido');
    return;
  }

  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  let messages = [];

  const styles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .cb-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      z-index: 9999;
    }

    .cb-widget-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .cb-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
    }

    .cb-widget-button.open {
      display: none;
    }

    .cb-widget-panel {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      max-width: calc(100vw - 20px);
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
      display: none;
      flex-direction: column;
      animation: slideUp 0.3s ease;
      opacity: 0;
    }

    .cb-widget-panel.open {
      display: flex;
      opacity: 1;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .cb-widget-header {
      padding: 16px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cb-widget-header h3 {
      font-size: 16px;
      font-weight: 600;
    }

    .cb-widget-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: background 0.2s;
    }

    .cb-widget-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .cb-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cb-message {
      display: flex;
      gap: 8px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .cb-message.user {
      justify-content: flex-end;
    }

    .cb-message-content {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      word-wrap: break-word;
    }

    .cb-message.user .cb-message-content {
      background: #6366f1;
      color: white;
      border-radius: 10px 2px 10px 10px;
    }

    .cb-message.bot .cb-message-content {
      background: #f3f4f6;
      color: #1f2937;
      border-radius: 2px 10px 10px 10px;
    }

    .cb-widget-input {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }

    .cb-widget-input input {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }

    .cb-widget-input input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .cb-widget-input button {
      background: #6366f1;
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .cb-widget-input button:hover:not(:disabled) {
      background: #4f46e5;
    }

    .cb-widget-input button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .cb-widget-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 10px 14px;
      background: #f3f4f6;
      border-radius: 10px;
      width: fit-content;
    }

    .cb-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #9ca3af;
      animation: typing 1.4s infinite;
    }

    .cb-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .cb-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        opacity: 0.3;
      }
      30% {
        opacity: 1;
      }
    }

    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `;

  const html = `
    <div class="cb-widget-button" id="cbButton" title="Abrir chat">
      <span>💬</span>
    </div>
    <div class="cb-widget-panel" id="cbPanel">
      <div class="cb-widget-header">
        <h3>Precisa de ajuda?</h3>
        <button class="cb-widget-close" id="cbClose">&times;</button>
      </div>
      <div class="cb-widget-messages" id="cbMessages"></div>
      <div class="cb-widget-input">
        <input type="text" id="cbInput" placeholder="Digite sua mensagem..." />
        <button id="cbSend">➜</button>
      </div>
    </div>
  `;

  function init() {
    const container = document.createElement('div');
    container.className = 'cb-widget-container';
    container.innerHTML = html;
    document.body.appendChild(container);

    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);

    const button = document.getElementById('cbButton');
    const panel = document.getElementById('cbPanel');
    const closeBtn = document.getElementById('cbClose');
    const input = document.getElementById('cbInput');
    const sendBtn = document.getElementById('cbSend');
    const messagesDiv = document.getElementById('cbMessages');

    button.addEventListener('click', () => {
      panel.classList.add('open');
      button.classList.add('open');
      input.focus();
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
      button.classList.remove('open');
    });

    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';
      sendBtn.disabled = true;

      showTyping();

      try {
        const response = await fetch(`${apiUrl}/public/chat/${botId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const msg = response.status === 429
            ? 'Muitas mensagens em pouco tempo. Aguarde um momento.'
            : data?.message || 'Desculpe, ocorreu um erro. Tente novamente.';
          addMessage(msg, 'bot');
        } else {
          addMessage(data.data.reply, 'bot');
        }
      } catch (error) {
        addMessage('Erro na conexão. Tente novamente.', 'bot');
      } finally {
        removeTyping();
        sendBtn.disabled = false;
        input.focus();
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    function addMessage(text, role) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `cb-message ${role}`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'cb-message-content';
      contentDiv.textContent = text;

      messageDiv.appendChild(contentDiv);
      messagesDiv.appendChild(messageDiv);

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      messages.push({ role, content: text });
    }

    function showTyping() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'cb-message bot';
      typingDiv.id = 'cbTyping';
      typingDiv.innerHTML = `
        <div class="cb-widget-typing">
          <div class="cb-typing-dot"></div>
          <div class="cb-typing-dot"></div>
          <div class="cb-typing-dot"></div>
        </div>
      `;
      messagesDiv.appendChild(typingDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function removeTyping() {
      const typing = document.getElementById('cbTyping');
      if (typing) typing.remove();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
