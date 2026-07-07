function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDelta(value) {
  const numeric = Number(value) || 0;
  return `${numeric >= 0 ? "+" : ""}${formatNumber(numeric, 1)}%`;
}

function drawSparkline(canvas, values, lineColor = "#a8ff34") {
  if (!canvas || !values?.length) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(240, Math.floor(rect.width || canvas.width));
  const height = Math.max(70, Math.floor(rect.height || canvas.height));

  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  values.forEach((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * (height - 16) - 8;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.lineWidth = 2;
  ctx.strokeStyle = lineColor;
  ctx.shadowColor = "rgba(168, 255, 52, 0.2)";
  ctx.shadowBlur = 12;
  ctx.stroke();

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(168, 255, 52, 0.18)");
  gradient.addColorStop(1, "rgba(168, 255, 52, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawLineChart(canvas, values, labels) {
  if (!canvas || !values?.length) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(540, Math.floor(rect.width || canvas.width));
  const height = 320;

  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 20, right: 18, bottom: 36, left: 38 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let index = 0; index <= 5; index += 1) {
    const y = padding.top + (innerHeight / 5) * index;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = padding.left + (index / Math.max(values.length - 1, 1)) * innerWidth;
    const y = padding.top + innerHeight - ((value - min) / range) * innerHeight;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#a8ff34";
  ctx.shadowColor = "rgba(168, 255, 52, 0.2)";
  ctx.shadowBlur = 12;
  ctx.stroke();

  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height);
  gradient.addColorStop(0, "rgba(168, 255, 52, 0.22)");
  gradient.addColorStop(1, "rgba(168, 255, 52, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#7f8d9b";
  ctx.font = "12px Space Grotesk";
  labels.forEach((label, index) => {
    const x = padding.left + (index / Math.max(labels.length - 1, 1)) * innerWidth;
    ctx.fillText(label, x - 16, height - 12);
  });
}

function buildLegend(items) {
  const legend = document.getElementById("coin-legend");
  if (!legend) {
    return;
  }

  legend.innerHTML = items
    .map(
      (item) => `
        <div class="legend__item">
          <i style="background:${item.color}"></i>
          <span>${item.name}</span>
          <strong>${item.value}%</strong>
        </div>
      `
    )
    .join("");
}

function buildRevenueChart(values, labels) {
  const chart = document.getElementById("revenue-chart");
  if (!chart) {
    return;
  }

  const max = Math.max(...values, 1);

  chart.innerHTML = values
    .map((value, index) => {
      const height = Math.max(24, Math.round((value / max) * 180));
      return `
        <div class="bar-chart__item">
          <div class="bar-chart__bar" style="height:${height}px"></div>
          <span class="bar-chart__label">${labels[index]}</span>
        </div>
      `;
    })
    .join("");
}

function buildPayoutList(items) {
  const list = document.getElementById("payout-list");
  if (!list) {
    return;
  }

  if (!items.length) {
    list.innerHTML = `
      <div class="payout-item payout-item--empty">
        Выплаты появятся после накопления первой добычи.
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <div class="payout-item">
          <span class="payout-item__coin">${item.coin === "BTC" ? "₿" : item.coin[0]}</span>
          <div class="payout-item__meta">
            <strong>${item.date}</strong>
            <span>${item.time}</span>
          </div>
          <div class="payout-item__amount">
            <strong>${item.amount}</strong>
            <span>${item.status}</span>
          </div>
        </div>
      `
    )
    .join("");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

let currentUser = null;
let activeDashboardData = null;
let payoutTimerId = null;

function startCountdown(seconds) {
  const payoutElement = document.getElementById("next-payout");
  if (payoutTimerId) {
    window.clearInterval(payoutTimerId);
  }

  let remainingSeconds = seconds;

  function updateCountdown() {
    const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(remainingSeconds % 60).padStart(2, "0");

    if (payoutElement) {
      payoutElement.textContent = `${hours} : ${minutes} : ${secs}`;
    }

    remainingSeconds = remainingSeconds > 0 ? remainingSeconds - 1 : seconds;
  }

  updateCountdown();
  payoutTimerId = window.setInterval(updateCountdown, 1000);
}

function renderDonut(items) {
  const donutChart = document.getElementById("donut-chart");
  if (!donutChart) {
    return;
  }

  let current = 0;
  const segments = items
    .map((item) => {
      const start = current;
      current += item.value * 3.6;
      return `${item.color} ${start}deg ${current}deg`;
    })
    .join(", ");

  donutChart.style.background = `conic-gradient(${segments})`;
}

function renderDashboard(user) {
  const data = window.MiningPowerDB.buildDashboardData(user);
  activeDashboardData = data;

  setText("dashboard-subtitle", `Добро пожаловать, ${user.name}.`);
  setText("dashboard-date", data.periodLabel);
  setText("profile-name", initials(user.name));
  setText("profile-email", user.email);

  setText("total-hashrate", `${formatNumber(data.totalHashratePh)} PH/s`);
  setText("hashrate-gh", `${Math.round(data.totalHashrateGh).toLocaleString("en-US")} GH/s`);
  setText("hashrate-delta", formatDelta(data.hashrateDelta));
  setText("active-miners", String(data.activeMiners));
  setText("miners-capacity", `из ${data.minersCapacity}`);
  setText("miners-percent", `${formatNumber((data.activeMiners / Math.max(data.minersCapacity, 1)) * 100, 1)}%`);
  setText("temperature-value", `${formatNumber(data.temperature, 1)} °C`);
  setText("temperature-status", data.temperatureStatus);
  setText("power-value", `${formatNumber(data.powerMw, 3)} MW`);
  setText("power-delta", formatDelta(data.powerDelta));
  setText("efficiency-value", `Эффективность: ${formatNumber(data.efficiency, 1)}%`);
  setText("uptime-value", data.uptimeLabel);
  setText("uptime-percent", `${formatNumber(data.uptimePercent, 1)}%`);
  setText("earned-btc", `${formatNumber(data.earnedBtc, 8)} BTC`);
  setText("paid-btc", `${formatNumber(data.paidBtc, 8)} BTC`);
  setText("balance-btc", `${formatNumber(data.balanceBtc, 8)} BTC`);
  setText("earned-usd", `≈ ${formatCurrency(data.earnedUsd)}`);
  setText("paid-usd", `≈ ${formatCurrency(data.paidUsd)}`);
  setText("balance-usd", `≈ ${formatCurrency(data.balanceUsd)}`);
  setText("donut-value", formatNumber(data.donutValue, 8));
  setText("revenue-summary", formatCurrency(data.revenueWeek[data.revenueWeek.length - 1] || 0));
  setText("revenue-delta", formatDelta(data.revenueDelta));
  setText("equipment-balance", formatCurrency(data.investmentBalanceUsd));
  setText("equipment-slots", data.installedSlotsLabel);
  setText("equipment-daily", formatCurrency(data.dailyRevenueUsd));

  const sidebarStatus = document.querySelector(".sidebar-status");
  const sidebarStatusState = sidebarStatus?.querySelector(".sidebar-status__state");
  const sidebarStatusBar = sidebarStatus?.querySelector(".sidebar-status__bar i");
  const sidebarStatusPercent = sidebarStatus?.querySelector("strong");
  const systemPercent = data.hasActiveTariff ? 100 : 0;

  if (sidebarStatusState) {
    sidebarStatusState.textContent = data.hasActiveTariff ? "Все системы работают" : "Тариф не подключен";
  }
  if (sidebarStatusBar) {
    sidebarStatusBar.style.width = `${systemPercent}%`;
  }
  if (sidebarStatusPercent) {
    sidebarStatusPercent.textContent = `${systemPercent}%`;
  }

  const progress = document.getElementById("miners-progress");
  if (progress) {
    progress.style.width = `${(data.activeMiners / Math.max(data.minersCapacity, 1)) * 100}%`;
  }

  const gauge = document.getElementById("temperature-gauge");
  if (gauge) {
    if (!data.hasActiveTariff) {
      gauge.style.background = "radial-gradient(circle at center, rgba(8, 14, 22, 1) 54%, transparent 55%), conic-gradient(from 210deg, rgba(255,255,255,0.08) 0deg 300deg)";
    } else {
      const normalized = Math.max(0, Math.min(1, (data.temperature - 24) / 48));
      const degree = 210 + normalized * 90;
      gauge.style.background = `radial-gradient(circle at center, rgba(8, 14, 22, 1) 54%, transparent 55%), conic-gradient(from 210deg, #68d414 0deg, #ffd84d ${degree}deg, rgba(255,255,255,0.08) ${degree}deg 300deg)`;
    }
  }

  const uptimeStrip = document.getElementById("uptime-strip");
  if (uptimeStrip) {
    const activeBars = Math.max(0, Math.min(18, Math.round((data.uptimePercent / 100) * 18)));
    uptimeStrip.innerHTML = Array.from({ length: 18 }, (_, index) =>
      `<span class="${index < activeBars ? "is-on" : "is-off"}"></span>`
    ).join("");
  }

  buildLegend(data.coinDistribution);
  buildRevenueChart(data.revenueWeek, data.revenueLabels);
  buildPayoutList(data.payouts);
  renderDonut(data.coinDistribution);

  drawSparkline(document.getElementById("hashrate-spark"), data.hashrateIntraday);
  drawSparkline(document.getElementById("power-spark"), data.powerTimeline, "#8fe770");
  drawSparkline(document.getElementById("earned-spark"), data.revenueWeek);
  drawSparkline(
    document.getElementById("paid-spark"),
    data.revenueWeek.map((value) => Number((value * 0.72).toFixed(2)))
  );
  drawSparkline(document.getElementById("balance-spark"), data.balanceTimeline, "#53d0ff");
  drawLineChart(document.getElementById("hashrate-chart"), data.hashrateWeek, data.hashrateLabels);

  startCountdown(data.nextPayoutSeconds);
}

async function bootstrapDashboard() {
  const session = window.MiningPowerDB?.getSession();
  if (!session?.userId) {
    window.location.href = "auth.html";
    return;
  }

  const foundUser = await window.MiningPowerDB.getUserById(session.userId);
  if (!foundUser) {
    window.MiningPowerDB.clearSession();
    window.location.href = "auth.html";
    return;
  }

  currentUser = window.MiningPowerDB.needsUserUpgrade(foundUser)
    ? await window.MiningPowerDB.updateUser(window.MiningPowerDB.upgradeUserData(foundUser))
    : window.MiningPowerDB.upgradeUserData(foundUser);

  renderDashboard(currentUser);
}

document.getElementById("logout-button")?.addEventListener("click", () => {
  window.MiningPowerDB.clearSession();
  window.location.href = "auth.html";
});

window.addEventListener("resize", () => {
  if (!activeDashboardData) {
    return;
  }

  drawSparkline(document.getElementById("hashrate-spark"), activeDashboardData.hashrateIntraday);
  drawSparkline(document.getElementById("power-spark"), activeDashboardData.powerTimeline, "#8fe770");
  drawSparkline(document.getElementById("earned-spark"), activeDashboardData.revenueWeek);
  drawSparkline(
    document.getElementById("paid-spark"),
    activeDashboardData.revenueWeek.map((value) => Number((value * 0.72).toFixed(2)))
  );
  drawSparkline(document.getElementById("balance-spark"), activeDashboardData.balanceTimeline, "#53d0ff");
  drawLineChart(document.getElementById("hashrate-chart"), activeDashboardData.hashrateWeek, activeDashboardData.hashrateLabels);
});

bootstrapDashboard();
