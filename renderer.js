(() => {
  // ── DOM ──────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const app = $("app");
  const body = document.body;
  const ring = $("ring");
  const display = $("timer-display");
  const modeLabel = $("mode-label");
  const timerSection = $("timer-section");
  const btnStart = $("btn-start");
  const btnPause = $("btn-pause");
  const btnReset = $("btn-reset");
  const btnPin = $("btn-pin");
  const btnClose = $("btn-close");
  const btnMinimize = $("btn-minimize");
  const themeToggle = $("theme-toggle");
  const statCount = $("stat-count");
  const statTime = $("stat-time");
  const modeTabs = document.querySelectorAll(".mode-segment");

  // ── 常量 ─────────────────────────────────
  const CIRCUMFERENCE = 2 * Math.PI * 100; // r=100

  const MODES = {
    work: { seconds: 25 * 60, label: "专注时间", color: "#FF3B30", cls: "mode-work" },
    short: { seconds: 5 * 60, label: "短休息", color: "#34C759", cls: "mode-short" },
    long: { seconds: 15 * 60, label: "长休息", color: "#AF52DE", cls: "mode-long" },
  };

  // ── 状态 ─────────────────────────────────
  let mode = "work";
  let totalSeconds = MODES.work.seconds;
  let secondsLeft = totalSeconds;
  let running = false;
  let timerInterval = null;
  let sessions = 0;
  let focusMinutes = 0;

  // ── 显示 ─────────────────────────────────
  function fmt(s) {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function render() {
    display.textContent = fmt(secondsLeft);
    const frac = secondsLeft / totalSeconds;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - frac);
    window.api.updateTitle(`${fmt(secondsLeft)} — Pomodoro`);
  }

  function renderStats() {
    statCount.textContent = sessions;
    const h = Math.floor(focusMinutes / 60);
    const m = focusMinutes % 60;
    statTime.textContent = h > 0 ? `${h}h${m}m` : `${m}m`;
  }

  // ── 模式切换 ─────────────────────────────
  function setMode(newMode) {
    if (running) return;
    mode = newMode;
    const cfg = MODES[mode];
    totalSeconds = cfg.seconds;
    secondsLeft = totalSeconds;

    // 更新 UI 样式
    timerSection.className = "flex-1 flex items-center justify-center relative " + cfg.cls;
    modeLabel.textContent = cfg.label;

    modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));

    // 重置按钮状态
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnStart.textContent = "▶";

    render();
  }

  // ── 计时器 ───────────────────────────────
  function start() {
    if (running) return;
    running = true;
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnStart.textContent = "▶";
    modeTabs.forEach((t) => (t.style.pointerEvents = "none"));

    const startedAt = Date.now();
    const saved = secondsLeft;

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      secondsLeft = Math.max(0, saved - elapsed);
      render();

      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        running = false;
        onComplete();
      }
    }, 250);
  }

  function pause() {
    if (!running) return;
    clearInterval(timerInterval);
    timerInterval = null;
    running = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnStart.textContent = "▶";
  }

  function reset() {
    clearInterval(timerInterval);
    timerInterval = null;
    running = false;
    secondsLeft = MODES[mode].seconds;
    totalSeconds = MODES[mode].seconds;
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnStart.textContent = "▶";
    modeTabs.forEach((t) => (t.style.pointerEvents = ""));
    render();
  }

  function onComplete() {
    btnStart.disabled = false;
    btnPause.disabled = true;
    modeTabs.forEach((t) => (t.style.pointerEvents = ""));

    if (mode === "work") {
      sessions++;
      focusMinutes += Math.round(MODES.work.seconds / 60);
      renderStats();
      playChime();
      // 自动切换休息模式
      setMode(sessions % 4 === 0 ? "long" : "short");
    } else {
      playChime();
      setMode("work");
    }
  }

  // ── 提示音 ───────────────────────────────
  function playChime() {
    try {
      const ctx = new AudioContext();
      const notes = [880, 1100, 1320];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch {
      /* 静默降级 */
    }
  }

  // ── 深色/浅色模式 ────────────────────────
  function toggleTheme() {
    body.classList.toggle("dark");
  }

  // ── 事件绑定 ─────────────────────────────
  btnStart.addEventListener("click", start);
  btnPause.addEventListener("click", pause);
  btnReset.addEventListener("click", reset);

  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  themeToggle.addEventListener("click", toggleTheme);

  btnPin.addEventListener("click", async () => {
    const onTop = await window.api.toggleAlwaysOnTop();
    btnPin.classList.toggle("pin-active", onTop);
  });

  btnClose.addEventListener("click", () => window.api.close());
  btnMinimize.addEventListener("click", () => window.api.minimize());

  // ── 深色模式下文字颜色 ──────────────────
  function updateTextColors() {
    const isDark = body.classList.contains("dark");
    const textMain = isDark ? "rgba(235,235,245,0.9)" : "rgba(60,60,67,0.9)";
    const textSub = isDark ? "rgba(235,235,245,0.45)" : "rgba(60,60,67,0.45)";
    const textLight = isDark ? "rgba(235,235,245,0.35)" : "rgba(60,60,67,0.35)";
    const textVal = isDark ? "rgba(235,235,245,0.85)" : "rgba(60,60,67,0.85)";

    display.style.color = textMain;
    modeLabel.style.color = textSub;

    document.querySelectorAll("[style*='color: rgba(60,60,67']").forEach((el) => {
      if (el.id === "timer-display") return;
      if (el.id === "mode-label") return;
    });

    statCount.style.color = textVal;
    statTime.style.color = textVal;

    document.querySelectorAll(".stat-label, [class*='uppercase']").forEach((el) => {
      el.style.color = textLight;
    });
  }

  // 监听主题切换
  const observer = new MutationObserver(updateTextColors);
  observer.observe(body, { attributes: true, attributeFilter: ["class"] });

  // ── 初始化 ───────────────────────────────
  render();
  renderStats();
  updateTextColors();
})();
