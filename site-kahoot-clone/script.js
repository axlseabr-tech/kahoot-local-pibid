/**
 * KAHOOT LOCAL PIBID - SCRIPT INTERATIVO
 * Funcionalidades: Simulador Demo jogável com Web Audio API, Temporizador,
 * Efeitos de Confetes, FAQ Accordion, Dark/Light Mode e Toast.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initQuizSimulator();
  initFaqAccordion();
  initGitCopy();
  initMobileMenu();
});

/* ==========================================================================
   1. MODO CLARO / ESCURO
   ========================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  const savedTheme = localStorage.getItem('kahoot-theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('kahoot-theme', next);
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
        // Cálculo de pontuação estilo Kahoot (baseada em velocidade)
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
