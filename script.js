const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 60, 320)}ms`;
  revealObserver.observe(element);
});

const accordionItems = document.querySelectorAll(".accordion__item");

accordionItems.forEach((item) => {
  const trigger = item.querySelector(".accordion__trigger");
  trigger.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");

    accordionItems.forEach((entry) => entry.classList.remove("is-open"));
    if (!isOpen) {
      item.classList.add("is-open");
    }
  });
});

const deviceSelect = document.getElementById("device-select");
const deviceCount = document.getElementById("device-count");
const termSelect = document.getElementById("term-select");
const profitValue = document.getElementById("profit-value");
const profitForm = document.getElementById("profit-form");
const stepButtons = document.querySelectorAll(".stepper__btn");

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function calculateProfit() {
  if (!deviceSelect || !deviceCount || !termSelect || !profitValue) {
    return;
  }

  const powerRate = Number(deviceSelect.value);
  const units = Math.max(1, Number(deviceCount.value) || 1);
  const months = Number(termSelect.value);
  const monthlyCoefficient = months >= 24 ? 1.18 : months >= 12 ? 0.95 : 0.76;
  const estimated = powerRate * units * months * monthlyCoefficient;

  profitValue.textContent = formatUsd(estimated);
}

stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.step);
    const current = Math.max(1, Number(deviceCount.value) || 1);
    const next = Math.min(250, Math.max(1, current + step));

    deviceCount.value = String(next);
    calculateProfit();
  });
});

[deviceSelect, deviceCount, termSelect]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener("input", calculateProfit);
    element.addEventListener("change", calculateProfit);
  });

if (profitForm) {
  profitForm.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateProfit();
    profitForm.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

calculateProfit();

const authLink = document.getElementById("auth-link");
const cabinetLink = document.getElementById("cabinet-link");

async function refreshAuthState() {
  if (!authLink || !cabinetLink || !window.MiningPowerDB) {
    return;
  }

  const session = window.MiningPowerDB.getSession();
  if (!session?.userId) {
    authLink.textContent = "Вход / регистрация";
    authLink.setAttribute("href", "auth.html");
    cabinetLink.textContent = "Личный кабинет";
    cabinetLink.setAttribute("href", "dashboard.html");
    return;
  }

  const user = await window.MiningPowerDB.getUserById(session.userId);
  if (!user) {
    window.MiningPowerDB.clearSession();
    return refreshAuthState();
  }

  authLink.textContent = "Открыть кабинет";
  authLink.setAttribute("href", "dashboard.html");
  cabinetLink.textContent = user.name.split(" ")[0];
  cabinetLink.setAttribute("href", "dashboard.html");
}

refreshAuthState();

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
