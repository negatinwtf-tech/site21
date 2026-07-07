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

function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setPurchaseStatus(message, type = "") {
  const status = document.getElementById("purchase-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.remove("is-success", "is-error");
  if (type) {
    status.classList.add(type);
  }
}

function buildEquipmentTable(items) {
  const tbody = document.getElementById("equipment-body");
  if (!tbody) {
    return;
  }

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="equipment-table__empty">Тарифные планы пока не подключены. Пополните баланс и выберите первый план ниже.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.model}</td>
          <td>${item.hashrate}</td>
          <td><span class="status-pill ${item.statusClass}">${item.status}</span></td>
          <td>
            <div class="equipment-temperature">
              <span>${item.temperature}</span>
              <span class="load-bar"><i style="width:${item.load}%"></i></span>
            </div>
          </td>
          <td>${item.power}</td>
          <td>${item.runtime}</td>
        </tr>
      `
    )
    .join("");
}

function prepareTariffForm(termMonths = 12) {
  const form = document.getElementById("tariff-purchase-form");
  const amountInput = document.getElementById("tariff-amount");
  const termSelect = document.getElementById("tariff-term");
  const data = currentUser ? window.MiningPowerDB.buildDashboardData(currentUser) : null;

  if (!form || !amountInput || !termSelect || !data) {
    return;
  }

  if (data.investmentBalanceUsd < 10) {
    window.location.href = "finance.html#balance-panel";
    return;
  }

  amountInput.max = String(Math.floor(data.investmentBalanceUsd));
  amountInput.value = String(Math.min(Math.max(Number(amountInput.value) || 10, 10), Math.floor(data.investmentBalanceUsd)));
  termSelect.value = String(termMonths);
  form.hidden = false;
  setPurchaseStatus(`Можно подключить тариф на сумму до ${formatCurrency(data.investmentBalanceUsd)}.`, "is-success");
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function flashElement(element) {
  if (!element) {
    return;
  }

  element.classList.remove("is-highlight");
  void element.offsetWidth;
  element.classList.add("is-highlight");
  window.setTimeout(() => element.classList.remove("is-highlight"), 900);
}

function pulseButton(button) {
  if (!button) {
    return;
  }

  button.classList.remove("is-pressed");
  void button.offsetWidth;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 220);
}

function setButtonBusy(button, isBusy, busyText) {
  if (!button) {
    return;
  }

  if (!button.dataset.label) {
    button.dataset.label = button.textContent.trim();
  }

  button.disabled = isBusy;
  button.classList.toggle("is-busy", isBusy);
  button.textContent = isBusy ? busyText : button.dataset.label;
}

function celebratePurchase(button) {
  flashElement(document.getElementById("equipment-balance-card"));
  flashElement(document.getElementById("equipment-daily-card"));
  flashElement(document.getElementById("equipment-slots-card"));
  flashElement(document.getElementById("installed-equipment-panel"));
  flashElement(document.getElementById("tariff-plan-panel"));

  const card = button?.closest(".market-card");
  if (card) {
    card.classList.remove("is-success-pop");
    void card.offsetWidth;
    card.classList.add("is-success-pop");
    window.setTimeout(() => card.classList.remove("is-success-pop"), 900);
  }
}

let currentUser = null;

function renderEquipmentPage(user) {
  const data = window.MiningPowerDB.buildDashboardData(user);

  setText("equipment-subtitle", `Добро пожаловать, ${user.name}.`);
  setText("equipment-period", data.periodLabel);
  setText("profile-name", initials(user.name));
  setText("equipment-balance", formatCurrency(data.investmentBalanceUsd));
  setText("equipment-slots", data.installedSlotsLabel);
  setText("equipment-daily", formatCurrency(data.dailyRevenueUsd));
  setText("equipment-active", String(data.activeMiners));

  buildEquipmentTable(data.miners);
}

async function bootstrapEquipmentPage() {
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

  renderEquipmentPage(currentUser);
  setPurchaseStatus("Выберите тарифный план. Если баланс меньше $10, откроется страница пополнения.", "");
}

document.addEventListener("click", (event) => {
  const pressable = event.target.closest(".market-card__button, .balance-action, .sidebar-logout");
  if (pressable) {
    pulseButton(pressable);
  }
});

document.getElementById("logout-button")?.addEventListener("click", () => {
  window.MiningPowerDB.clearSession();
  window.location.href = "auth.html";
});

document.getElementById("tariff-plan-grid")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-term-months]");
  if (!button || !currentUser) {
    return;
  }

  prepareTariffForm(Number(button.dataset.termMonths || 12));
});

document.getElementById("tariff-purchase-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const amountInput = document.getElementById("tariff-amount");
  const termSelect = document.getElementById("tariff-term");
  const button = form.querySelector("button[type='submit']");
  if (!button || !currentUser) {
    return;
  }

  const amount = Number(amountInput?.value || 0);
  const termMonths = Number(termSelect?.value || 12);

  if (amount < 10) {
    setPurchaseStatus("Минимальная сумма подключения тарифа - $10.", "is-error");
    return;
  }

  setButtonBusy(button, true, "Подключаем...");
  setPurchaseStatus("Подключаем тарифный план и обновляем телеметрию...", "");

  try {
    currentUser = await window.MiningPowerDB.purchaseTariffPlan(currentUser.id, amount, termMonths);
    renderEquipmentPage(currentUser);
    celebratePurchase(button);
    form.hidden = true;
    setPurchaseStatus("Тариф подключен. Данные уже пересчитаны.", "is-success");
  } catch (error) {
    const messageByCode = {
      INSUFFICIENT_FUNDS: "На балансе недостаточно средств для подключения этого тарифа.",
      MINIMUM_TARIFF_AMOUNT: "Минимальная сумма подключения тарифа - $10.",
      INVALID_TARIFF_TERM: "Выбранный срок тарифа недоступен.",
      CAPACITY_REACHED: "Все места заняты. Освободите место или смените тариф.",
      EQUIPMENT_NOT_FOUND: "Тарифный план не найден в каталоге.",
      USER_NOT_FOUND: "Пользователь не найден. Перезайдите в кабинет.",
    };

    renderEquipmentPage(currentUser);
    setPurchaseStatus(messageByCode[error.message] || "Не удалось подключить тариф. Попробуйте ещё раз.", "is-error");
  } finally {
    setButtonBusy(button, false, "Подключить");
  }
});

bootstrapEquipmentPage();
