/**
 * EDUQUIZ LOCAL - SCRIPT INTERATIVO (PIBID MATEMÁTICA UFRR)
 * Funcionalidades: Simulador Demo jogável com Web Audio API, Temporizador,
 * Efeitos de Confetes, FAQ Accordion, Dark/Light Mode e Toast.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initQuizSimulator();
  initFaqAccordion();
  initGitCopy();
  initMobileMenu();
  initEduQuizComments();
});

/* ==========================================================================
   1. MODO CLARO / ESCURO
   ========================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  const savedTheme = localStorage.getItem('eduquiz-theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('eduquiz-theme', next);
    });
  }
}

/* ==========================================================================
   2. SIMULADOR DO QUIZ INTERATIVO (COM WEB AUDIO API)
   ========================================================================== */
function initQuizSimulator() {
  const timerEl = document.getElementById('demo-timer');
  const options = document.querySelectorAll('.answer-btn');
  const feedbackOverlay = document.getElementById('demo-feedback');
  const feedbackBody = document.getElementById('feedback-body');
  const restartBtn = document.getElementById('btn-restart-demo');

  let timeLeft = 20;
  let timerInterval = null;
  let gameActive = true;

  // Gerador de Áudio Sintetizado 100% Offline (Web Audio API)
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Som de Acerto (Chime alegre)
  function playCorrectSound() {
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch (e) {
      console.log('Audio disabled or not allowed');
    }
  }

  // Som de Erro (Buzzer)
  function playWrongSound() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.setValueAtTime(110, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  // Som de Clique no Botão
  function playClickSound() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  // Iniciar Cronômetro
  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 20;
    if (timerEl) {
      timerEl.textContent = timeLeft;
      timerEl.classList.remove('warning');
    }
    gameActive = true;

    timerInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) {
        timerEl.textContent = timeLeft;
        if (timeLeft <= 5) {
          timerEl.classList.add('warning');
        }
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeOut();
      }
    }, 1000);
  }

  // Tempo Esgotado
  function handleTimeOut() {
    if (!gameActive) return;
    gameActive = false;
    playWrongSound();

    feedbackBody.innerHTML = `
      <div class="feedback-status status-wrong">Tempo Esgotado! ⏰</div>
      <div class="feedback-points">+0 PONTOS</div>
      <p class="feedback-explanation">A resposta correta era <strong>28,26 m²</strong> (Área = π · r² = 3,14 · 3² = 3,14 · 9 = 28,26).</p>
    `;
    feedbackOverlay.classList.add('active');
  }

  // Clique em uma alternativa
  options.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!gameActive) return;
      gameActive = false;
      clearInterval(timerInterval);

      playClickSound();
      const isCorrect = btn.getAttribute('data-correct') === 'true';

      if (isCorrect) {
        playCorrectSound();
        // Cálculo de pontuação pedagógica gamificada (baseada na velocidade)
        const score = Math.round(500 + (timeLeft / 20) * 500);

        feedbackBody.innerHTML = `
          <div class="feedback-status status-correct">✓ RESPOSTA CORRETA!</div>
          <div class="feedback-points">+${score} PONTOS</div>
          <p class="feedback-explanation">Parabéns! Área = π · r² = 3,14 · 3² = 3,14 · 9 = <strong>28,26 m²</strong>.</p>
        `;
        triggerConfetti();
      } else {
        playWrongSound();
        feedbackBody.innerHTML = `
          <div class="feedback-status status-wrong">✕ RESPOSTA INCORRETA</div>
          <div class="feedback-points">+0 PONTOS</div>
          <p class="feedback-explanation">A alternativa correta era o losango azul: <strong>28,26 m²</strong> (Área = 3,14 · 9 = 28,26).</p>
        `;
      }

      feedbackOverlay.classList.add('active');
    });
  });

  // Reiniciar Simulador
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      feedbackOverlay.classList.remove('active');
      startTimer();
    });
  }

  // Efeito de Confetes estilo Pódio
  function triggerConfetti() {
    const screen = document.getElementById('demo-screen');
    if (!screen) return;

    for (let i = 0; i < 35; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti-particle';
      const colors = ['#e21b3c', '#1368ce', '#ffa602', '#26890c', '#6a25d9', '#00d2ff'];
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.left = `${Math.random() * 90 + 5}%`;
      conf.style.top = `-10px`;
      conf.style.position = 'absolute';
      conf.style.width = `${Math.random() * 8 + 6}px`;
      conf.style.height = `${Math.random() * 12 + 8}px`;
      conf.style.borderRadius = '2px';
      conf.style.zIndex = '99';
      conf.style.pointerEvents = 'none';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      conf.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      screen.appendChild(conf);

      setTimeout(() => {
        conf.style.top = `${Math.random() * 60 + 40}%`;
        conf.style.opacity = '0';
        conf.style.transform = `rotate(${Math.random() * 720}deg) scale(0.5)`;
      }, 20);

      setTimeout(() => conf.remove(), 1600);
    }
  }

  // Iniciar timer logo que carregar
  startTimer();
}

/* ==========================================================================
   3. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Fecha outros itens
      faqItems.forEach(i => i.classList.remove('open'));

      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* ==========================================================================
   4. CÓPIA DO COMANDO GIT
   ========================================================================== */
function initGitCopy() {
  const copyBtn = document.getElementById('btn-copy-git');
  const codeEl = document.getElementById('git-clone-code');

  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeEl.innerText).then(() => {
        showToast('Comando de clone copiado com sucesso!');
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => copyBtn.textContent = 'Copiar Comando', 2500);
      });
    });
  }
}

/* ==========================================================================
   5. MENU MOBILE
   ========================================================================== */
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('nav-links');
  const links = document.querySelectorAll('.n-link');

  if (btn && nav) {
    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });

    links.forEach(l => {
      l.addEventListener('click', () => {
        nav.classList.remove('open');
      });
    });
  }
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

/* ==========================================================================
   6. MURAL DE COMENTÁRIOS DO EDUQUIZ (COM REAÇÕES, RESPOSTAS E LIDO)
   ========================================================================== */
function initEduQuizComments() {
  const form = document.getElementById('eduquiz-comment-form');
  const feed = document.getElementById('eduquiz-comments-feed');
  if (!feed) return;

  const STORAGE_KEY = 'eduquiz_local_comments_v1';

  const REACTIONS = [
    { emoji: '👍', label: 'Gostei' },
    { emoji: '❤️', label: 'Amei' },
    { emoji: '🎉', label: 'Parabéns' },
    { emoji: '🔥', label: 'Incrível' },
  ];

  const defaultComments = [];

  function getComments() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultComments;
  }

  function saveComments(comments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }

  function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str || '';
    return p.innerHTML;
  }

  function genId() {
    return 'kc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function nowStr() {
    const now = new Date();
    return `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  /* ── Renderiza sub-respostas ── */
  function buildReplyCard(reply, parentId, replyIndex, comments, depth) {
    const initials = reply.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const starsStr = '★'.repeat(reply.stars || 0) + '☆'.repeat(5 - (reply.stars || 0));

    const div = document.createElement('div');
    div.className = 'reply-card';
    div.id = `k-reply-${parentId}-${replyIndex}`;

    const reactionBtns = REACTIONS.map(r => {
      const count = (reply.reactions && reply.reactions[r.emoji]) || 0;
      const active = reply.userReactions && reply.userReactions.includes(r.emoji) ? 'active' : '';
      return `<button class="reaction-btn ${active}"
                data-parent="${parentId}" data-reply="${replyIndex}"
                data-emoji="${r.emoji}" title="${r.label}" aria-label="${r.label}">
                ${r.emoji} <span class="reaction-count">${count > 0 ? count : ''}</span>
              </button>`;
    }).join('');

    const canReplyAgain = depth < 2;
    const replyBtn = canReplyAgain
      ? `<button class="reply-toggle-btn" data-parent="${parentId}" data-reply="${replyIndex}" data-depth="${depth}">💬 Responder</button>`
      : '';

    div.innerHTML = `
      <div class="comment-header-row">
        <div class="commenter-meta">
          <div class="commenter-avatar">${initials}</div>
          <div>
            <div class="commenter-name">${escapeHTML(reply.name)}</div>
            <div class="commenter-role">${escapeHTML(reply.role || '')} ${reply.date ? `• <span style="opacity:0.7">${reply.date}</span>` : ''}</div>
          </div>
        </div>
        ${reply.stars ? `<div class="comment-stars" title="${reply.stars} de 5">${starsStr}</div>` : ''}
      </div>
      <p class="comment-body-text">${escapeHTML(reply.text)}</p>
      <div class="comment-actions-bar">
        ${reactionBtns}
        ${replyBtn}
      </div>
      <div class="reply-form-placeholder-${parentId}-${replyIndex}"></div>
      <div class="nested-replies-${parentId}-${replyIndex}"></div>
    `;

    if (reply.replies && reply.replies.length > 0 && depth < 2) {
      const nested = div.querySelector(`.nested-replies-${parentId}-${replyIndex}`);
      const nestedSection = document.createElement('div');
      nestedSection.className = 'replies-section';
      reply.replies.forEach((sr, si) => {
        nestedSection.appendChild(buildReplyCard(sr, `${parentId}-${replyIndex}`, si, comments, depth + 1));
      });
      nested.appendChild(nestedSection);
    }

    return div;
  }

  /* ── Renderiza card principal do comentário ── */
  function buildCard(item, index, comments) {
    const initials = item.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const starsStr = '★'.repeat(item.stars) + '☆'.repeat(5 - item.stars);

    const card = document.createElement('div');
    card.className = 'comment-card-item';
    card.id = `card-${item.id}`;

    const reactionBtns = REACTIONS.map(r => {
      const count = (item.reactions && item.reactions[r.emoji]) || 0;
      const active = item.userReactions && item.userReactions.includes(r.emoji) ? 'active' : '';
      return `<button class="reaction-btn ${active}"
                data-id="${item.id}" data-emoji="${r.emoji}"
                title="${r.label}" aria-label="${r.label}">
                ${r.emoji} <span class="reaction-count">${count > 0 ? count : ''}</span>
              </button>`;
    }).join('');

    const badgeLido = item.read
      ? `<div class="badge-lido">✓ Lido pelo Autor</div>`
      : '';

    card.innerHTML = `
      ${badgeLido}
      <div class="comment-header-row" style="${item.read ? 'padding-right:120px' : ''}">
        <div class="commenter-meta">
          <div class="commenter-avatar">${initials}</div>
          <div>
            <div class="commenter-name">${escapeHTML(item.name)}</div>
            <div class="commenter-role">${escapeHTML(item.role)} • <span style="opacity:0.7">${item.date}</span></div>
          </div>
        </div>
        <div class="comment-stars" title="${item.stars} de 5 estrelas">${starsStr}</div>
      </div>
      <p class="comment-body-text">${escapeHTML(item.text)}</p>
      <div class="comment-actions-bar">
        ${reactionBtns}
        <button class="reply-toggle-btn" data-id="${item.id}">💬 Responder</button>
        ${!item.read ? `<button class="mark-read-btn" data-id="${item.id}">✓ Marcar como lido</button>` : ''}
      </div>
      <div class="reply-form-placeholder-${item.id}"></div>
      <div class="replies-wrapper-${item.id}"></div>
    `;

    if (item.replies && item.replies.length > 0) {
      const wrapper = card.querySelector(`.replies-wrapper-${item.id}`);
      const section = document.createElement('div');
      section.className = 'replies-section';
      item.replies.forEach((r, ri) => {
        section.appendChild(buildReplyCard(r, item.id, ri, comments, 1));
      });
      wrapper.appendChild(section);
    }

    return card;
  }

  function renderComments() {
    const comments = getComments();
    feed.innerHTML = '';

    if (comments.length === 0) {
      feed.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 26px 16px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.12);">
          <span style="font-size: 1.6rem; display: block; margin-bottom: 8px;">🎮</span>
          <strong>Mural limpo e pronto para a comunidade!</strong>
          <p style="font-size: 0.82rem; margin-top: 4px; opacity: 0.8;">Seja o primeiro a compartilhar como foi a experiência com seus alunos.</p>
        </div>
      `;
      return;
    }

    comments.forEach((item, index) => {
      feed.appendChild(buildCard(item, index, comments));
    });
    attachListeners();
  }

  function showReplyForm(placeholderSel, onSubmit, onCancel) {
    const placeholder = document.querySelector(placeholderSel);
    if (!placeholder || placeholder.querySelector('.reply-form-inline')) return;

    const formEl = document.createElement('div');
    formEl.className = 'reply-form-inline';
    formEl.innerHTML = `
      <input type="text" class="reply-name-in" placeholder="Seu nome" maxlength="60" required>
      <textarea class="reply-text-in" rows="2" placeholder="Escreva sua resposta..." required></textarea>
      <div class="reply-form-row">
        <button class="reply-submit-btn">Enviar resposta</button>
        <button class="reply-cancel-btn">Cancelar</button>
      </div>
    `;

    formEl.querySelector('.reply-submit-btn').addEventListener('click', () => {
      const nameVal = formEl.querySelector('.reply-name-in').value.trim();
      const textVal = formEl.querySelector('.reply-text-in').value.trim();
      if (!nameVal || !textVal) return;
      onSubmit(nameVal, textVal);
    });

    formEl.querySelector('.reply-cancel-btn').addEventListener('click', () => {
      formEl.remove();
      if (onCancel) onCancel();
    });

    placeholder.appendChild(formEl);
    formEl.querySelector('.reply-name-in').focus();
  }

  function attachListeners() {
    /* Reação em comentário principal */
    feed.querySelectorAll('.reaction-btn[data-id]:not([data-parent])').forEach(btn => {
      btn.addEventListener('click', () => {
        const comments = getComments();
        const id = btn.dataset.id;
        const emoji = btn.dataset.emoji;
        const item = comments.find(c => c.id === id);
        if (!item) return;

        item.reactions = item.reactions || {};
        item.userReactions = item.userReactions || [];

        if (item.userReactions.includes(emoji)) {
          item.reactions[emoji] = Math.max(0, (item.reactions[emoji] || 1) - 1);
          item.userReactions = item.userReactions.filter(e => e !== emoji);
        } else {
          item.reactions[emoji] = (item.reactions[emoji] || 0) + 1;
          item.userReactions.push(emoji);
        }
        saveComments(comments);
        renderComments();
      });
    });

    /* Reação em resposta */
    feed.querySelectorAll('.reaction-btn[data-parent]').forEach(btn => {
      btn.addEventListener('click', () => {
        const comments = getComments();
        const parentId = btn.dataset.parent;
        const replyIndex = parseInt(btn.dataset.reply);
        const emoji = btn.dataset.emoji;

        const parts = parentId.split('-');
        const rootId = parts.slice(0, 3).join('-');
        const root = comments.find(c => c.id === rootId);
        if (!root) return;

        let reply;
        if (parts.length === 3) {
          reply = root.replies[replyIndex];
        } else {
          const midIndex = parseInt(parts[3]);
          reply = root.replies[midIndex]?.replies?.[replyIndex];
        }
        if (!reply) return;

        reply.reactions = reply.reactions || {};
        reply.userReactions = reply.userReactions || [];

        if (reply.userReactions.includes(emoji)) {
          reply.reactions[emoji] = Math.max(0, (reply.reactions[emoji] || 1) - 1);
          reply.userReactions = reply.userReactions.filter(e => e !== emoji);
        } else {
          reply.reactions[emoji] = (reply.reactions[emoji] || 0) + 1;
          reply.userReactions.push(emoji);
        }
        saveComments(comments);
        renderComments();
      });
    });

    /* Marcar como lido */
    feed.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const comments = getComments();
        const item = comments.find(c => c.id === btn.dataset.id);
        if (item) { item.read = true; saveComments(comments); renderComments(); }
      });
    });

    /* Responder comentário principal */
    feed.querySelectorAll('.reply-toggle-btn[data-id]:not([data-parent])').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        showReplyForm(`.reply-form-placeholder-${id}`, (name, text) => {
          const comments = getComments();
          const item = comments.find(c => c.id === id);
          if (!item) return;
          item.replies = item.replies || [];
          item.replies.push({
            id: genId(), name, role: 'Professor(a) / Visitante', date: nowStr(),
            text, reactions: {}, userReactions: [], replies: []
          });
          saveComments(comments);
          renderComments();
          showToast('Resposta publicada!');
        });
      });
    });

    /* Responder a outra resposta */
    feed.querySelectorAll('.reply-toggle-btn[data-parent]').forEach(btn => {
      btn.addEventListener('click', () => {
        const parentId = btn.dataset.parent;
        const replyIndex = parseInt(btn.dataset.reply);
        showReplyForm(`.reply-form-placeholder-${parentId}-${replyIndex}`, (name, text) => {
          const comments = getComments();
          const parts = parentId.split('-');
          const rootId = parts.slice(0, 3).join('-');
          const root = comments.find(c => c.id === rootId);
          if (!root) return;

          let targetReplies;
          if (parts.length === 3) {
            root.replies[replyIndex].replies = root.replies[replyIndex].replies || [];
            targetReplies = root.replies[replyIndex].replies;
          } else {
            const midIndex = parseInt(parts[3]);
            root.replies[midIndex].replies = root.replies[midIndex].replies || [];
            targetReplies = root.replies[midIndex].replies;
          }
          targetReplies.push({
            id: genId(), name, role: 'Professor(a) / Visitante', date: nowStr(),
            text, reactions: {}, userReactions: [], replies: []
          });
          saveComments(comments);
          renderComments();
          showToast('Resposta publicada!');
        });
      });
    });
  }

  /* ── Envio do formulário principal ── */
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('k-comment-name');
      const roleInput = document.getElementById('k-comment-role');
      const ratingInput = document.getElementById('k-comment-rating');
      const schoolInput = document.getElementById('k-comment-school');
      const messageInput = document.getElementById('k-comment-message');

      const name = nameInput.value.trim();
      const role = roleInput.value;
      const school = schoolInput.value.trim();
      const rating = parseInt(ratingInput.value) || 5;
      const message = messageInput.value.trim();

      if (!name || !message) return;

      const fullRole = school ? `${role} (${school})` : role;
      const newComment = {
        id: genId(),
        name: name,
        role: fullRole,
        stars: rating,
        date: nowStr(),
        text: message,
        reactions: { '👍': 0, '❤️': 0, '🎉': 0, '🔥': 0 },
        userReactions: [],
        read: false,
        replies: []
      };

      const currentComments = getComments();
      currentComments.unshift(newComment);
      saveComments(currentComments);

      renderComments();
      form.reset();
      showToast('Comentário publicado no mural com sucesso!');
    });
  }

  renderComments();
}
