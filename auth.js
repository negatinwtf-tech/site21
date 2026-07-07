function simpleHash(input) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return `mp_${Math.abs(hash)}`;
}

const authTabs = document.querySelectorAll(".auth-tabs__button");
const authForms = document.querySelectorAll(".auth-form");
const authStatus = document.getElementById("auth-status");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const cabinetLink = document.getElementById("cabinet-link");

function setAuthStatus(message, type = "") {
  if (!authStatus) {
    return;
  }

  authStatus.textContent = message;
  authStatus.classList.remove("is-success", "is-error");

  if (type) {
    authStatus.classList.add(type);
  }
}

function switchAuthTab(target) {
  authTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authTarget === target);
  });

  authForms.forEach((form) => {
    form.classList.toggle("is-active", form.id === `${target}-form`);
  });

  setAuthStatus("");
}

function normalizeFormData(formData) {
  return Object.fromEntries(formData.entries());
}

async function refreshHeaderState() {
  if (!cabinetLink || !window.MiningPowerDB) {
    return;
  }

  const session = window.MiningPowerDB.getSession();
  if (!session?.userId) {
    cabinetLink.textContent = "Личный кабинет";
    cabinetLink.setAttribute("href", "dashboard.html");
    return;
  }

  const user = await window.MiningPowerDB.getUserById(session.userId);
  if (!user) {
    window.MiningPowerDB.clearSession();
    return refreshHeaderState();
  }

  cabinetLink.textContent = user.name.split(" ")[0];
  cabinetLink.setAttribute("href", "dashboard.html");
}

authTabs.forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTarget));
});

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthStatus("");

    const values = normalizeFormData(new FormData(registerForm));
    const email = String(values.email || "").trim().toLowerCase();
    const password = String(values.password || "");
    const name = String(values.name || "").trim();

    if (!name) {
      setAuthStatus("Укажите имя владельца аккаунта.", "is-error");
      return;
    }

    if (password.length < 6) {
      setAuthStatus("Пароль должен содержать минимум 6 символов.", "is-error");
      return;
    }

    const existingUser = await window.MiningPowerDB.getUserByEmail(email);
    if (existingUser) {
      setAuthStatus("Пользователь с таким email уже зарегистрирован.", "is-error");
      switchAuthTab("login");
      return;
    }

    const user = {
      id: `user_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      name,
      email,
      phone: String(values.phone || "").trim(),
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
      ...window.MiningPowerDB.createStarterState({
        name,
        email,
      }),
    };

    await window.MiningPowerDB.createUser(user);
    window.MiningPowerDB.setSession({
      userId: user.id,
      loginAt: new Date().toISOString(),
    });

    setAuthStatus("Аккаунт создан. Открываем личный кабинет...", "is-success");
    registerForm.reset();
    window.setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthStatus("");

    const values = normalizeFormData(new FormData(loginForm));
    const email = String(values.email || "").trim().toLowerCase();
    const password = String(values.password || "");
    const foundUser = await window.MiningPowerDB.getUserByEmail(email);

    if (!foundUser || foundUser.passwordHash !== simpleHash(password)) {
      setAuthStatus("Неверный email или пароль.", "is-error");
      return;
    }

    if (window.MiningPowerDB.needsUserUpgrade(foundUser)) {
      await window.MiningPowerDB.updateUser(window.MiningPowerDB.upgradeUserData(foundUser));
    }

    window.MiningPowerDB.setSession({
      userId: foundUser.id,
      loginAt: new Date().toISOString(),
    });

    setAuthStatus("Вход выполнен. Переходим в кабинет...", "is-success");
    loginForm.reset();
    window.setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 400);
  });
}

refreshHeaderState();

const canvas = document.getElementById("bg-canvas");
const ctx = canvas?.getContext("2d");
const particles = [];
const particleCount = 42;

function resizeCanvas() {
  if (!canvas || !ctx) {
    return;
  }

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
  if (!ctx) {
    return;
  }

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

if (canvas && ctx) {
  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });
}
