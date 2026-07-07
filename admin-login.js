const adminLoginForm = document.getElementById("admin-login-form");
const adminAuthStatus = document.getElementById("admin-auth-status");

function setAdminAuthStatus(message, type = "") {
  if (!adminAuthStatus) {
    return;
  }

  adminAuthStatus.textContent = message;
  adminAuthStatus.classList.remove("is-success", "is-error");
  if (type) {
    adminAuthStatus.classList.add(type);
  }
}

function initAdminParticles() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) {
    return;
  }

  const particles = [];
  const particleCount = 42;

  function resizeCanvas() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function createParticles() {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.28,
        speedY: Math.random() * 0.4 + 0.08,
        alpha: Math.random() * 0.7 + 0.15,
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.y > window.innerHeight + 16) {
        particle.y = -12;
        particle.x = Math.random() * window.innerWidth;
      }

      if (particle.x > window.innerWidth + 10) {
        particle.x = -10;
      }

      if (particle.x < -10) {
        particle.x = window.innerWidth + 10;
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(180, 255, 49, ${particle.alpha})`;
      ctx.shadowColor = "rgba(180, 255, 49, 0.5)";
      ctx.shadowBlur = 12;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });
}

if (window.MiningPowerDB?.isAdminAuthenticated()) {
  window.location.href = "admin.html";
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setAdminAuthStatus("");

    const formData = new FormData(adminLoginForm);
    const login = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");

    if (!window.MiningPowerDB.verifyAdminCredentials(login, password)) {
      setAdminAuthStatus("Неверный логин администратора или пароль.", "is-error");
      return;
    }

    window.MiningPowerDB.setAdminSession({
      login,
      authorizedAt: new Date().toISOString(),
    });

    setAdminAuthStatus("Доступ подтверждён. Открываем админ-панель...", "is-success");
    adminLoginForm.reset();
    window.setTimeout(() => {
      window.location.href = "admin.html";
    }, 350);
  });
}

initAdminParticles();
