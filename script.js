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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initAccordions() {
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
}

function renderFaqAccordion() {
  const accordion = document.getElementById("faq-accordion");
  if (!accordion || !window.MiningPowerDB?.getFaqItems) {
    initAccordions();
    return;
  }

  const faqItems = window.MiningPowerDB.getFaqItems();
  accordion.innerHTML = faqItems
    .map(
      (item, index) => `
        <article class="accordion__item ${index === 0 ? "is-open" : ""}">
          <button class="accordion__trigger" type="button">${escapeHtml(item.question)}</button>
          <div class="accordion__content">
            <p>${escapeHtml(item.answer)}</p>
          </div>
        </article>
      `
    )
    .join("");

  initAccordions();
}

renderFaqAccordion();

const investmentAmount = document.getElementById("investment-amount");
const termSelect = document.getElementById("term-select");
const profitForm = document.getElementById("profit-form");
const profitResult = document.getElementById("profit-result");
const profitTitle = document.getElementById("profit-title");
const termPercent = document.getElementById("term-percent");
const termProfit = document.getElementById("term-profit");
const annualPercent = document.getElementById("annual-percent");
const annualProfit = document.getElementById("annual-profit");
const dailyPercent = document.getElementById("daily-percent");
const dailyProfit = document.getElementById("daily-profit");

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMonths(value) {
  return Number(value) === 24 ? "24 месяца" : `${value} месяцев`;
}

function hideProfitResult() {
  if (!profitResult) {
    return;
  }

  profitResult.hidden = true;
  profitResult.classList.remove("is-visible");
}

function calculateProfit() {
  if (
    !investmentAmount ||
    !termSelect ||
    !profitResult ||
    !profitTitle ||
    !termPercent ||
    !termProfit ||
    !annualPercent ||
    !annualProfit ||
    !dailyPercent ||
    !dailyProfit
  ) {
    return;
  }

  const amount = Math.max(0, Number(investmentAmount.value) || 0);
  const months = Number(termSelect.value);
  const dailyRate = 0.2;
  const annualRate = dailyRate * 360;
  const termRate = dailyRate * 30 * months;

  profitTitle.textContent = `${formatUsd(amount)} на ${formatMonths(months)}`;
  termPercent.textContent = `${termRate}%`;
  termProfit.textContent = formatUsd((amount * termRate) / 100);
  annualPercent.textContent = `${annualRate}%`;
  annualProfit.textContent = formatUsd((amount * annualRate) / 100);
  dailyPercent.textContent = `${dailyRate}%`;
  dailyProfit.textContent = formatUsd((amount * dailyRate) / 100);
  profitResult.hidden = false;
  profitResult.classList.remove("is-visible");
  window.requestAnimationFrame(() => profitResult.classList.add("is-visible"));
}

[investmentAmount, termSelect]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener("input", hideProfitResult);
    element.addEventListener("change", hideProfitResult);
  });

if (profitForm) {
  profitForm.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateProfit();
    profitResult?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

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
