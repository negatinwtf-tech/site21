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
        <td colspan="7" class="equipment-table__empty">Оборудование пока не установлено. Пополните баланс и купите первый майнер ниже.</td>
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

function buildEquipmentMarket(items) {
  const market = document.getElementById("equipment-market");
  if (!market) {
    return;
  }

  market.innerHTML = items
    .map(
      (item) => `
        <article class="market-card">
          <div class="market-card__head">
            <div>
              <h3>${item.shortName}</h3>
              <p>${item.name}</p>
            </div>
            <strong>${formatCurrency(item.priceUsd)}</strong>
          </div>
          <div class="market-card__specs">
            <span>Алгоритм: <strong>${item.algorithm}</strong></span>
            <span>Хешрейт: <strong>${item.displayHashrate}</strong></span>
            <span>Потребление: <strong>${formatNumber(item.powerKw, 2)} kW</strong></span>
            <span>Доход в сутки: <strong>${formatCurrency(item.dailyRevenueUsd)}</strong></span>
            <span>Доход в месяц: <strong>${formatCurrency(item.monthlyRevenueUsd)}</strong></span>
            <span>Охлаждение: <strong>${item.cooling}</strong></span>
          </div>
          <div class="market-card__footer">
            <span>Установлено у вас: ${item.ownedCount}</span>
            <button
              class="market-card__button"
              type="button"
              data-catalog-id="${item.id}"
              ${item.canBuy ? "" : "disabled"}
              title="${item.canBuy ? "Купить устройство" : item.disabledReason}"
            >
              ${item.canBuy ? "Купить" : item.disabledReason}
            </button>
          </div>
        </article>
      `
    )
    .join("");
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
  flashElement(document.getElementById("equipment-market-panel"));

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

  setText("equipment-subtitle", `Добро пожаловать, ${user.name}. План: ${data.planName}.`);
  setText("equipment-period", data.periodLabel);
  setText("profile-name", initials(user.name));
  setText("equipment-balance", formatCurrency(data.investmentBalanceUsd));
  setText("equipment-slots", data.installedSlotsLabel);
  setText("equipment-daily", formatCurrency(data.dailyRevenueUsd));
  setText("equipment-active", String(data.activeMiners));

  buildEquipmentMarket(data.equipmentCatalog);
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
  setPurchaseStatus("Баланс увеличен, а после покупки устройство сразу начнёт участвовать в статистике.", "is-success");
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

document.getElementById("balance-actions")?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-topup-amount]");
  if (!button || !currentUser) {
    return;
  }

  const amount = Number(button.dataset.topupAmount || 0);
  setButtonBusy(button, true, "Пополняем...");
  setPurchaseStatus("Зачисляем средства на баланс оборудования...", "");

  try {
    currentUser = await window.MiningPowerDB.topUpEquipmentBalance(currentUser.id, amount);
    renderEquipmentPage(currentUser);
    flashElement(document.getElementById("equipment-balance-card"));
    setPurchaseStatus(`Баланс пополнен на ${formatCurrency(amount)}. Можно покупать новые устройства.`, "is-success");
  } catch (error) {
    setPurchaseStatus("Не удалось пополнить баланс. Попробуйте ещё раз.", "is-error");
  } finally {
    setButtonBusy(button, false, "Пополнить");
  }
});

document.getElementById("equipment-market")?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-catalog-id]");
  if (!button || !currentUser) {
    return;
  }

  const { catalogId } = button.dataset;
  setButtonBusy(button, true, "Покупаем...");
  setPurchaseStatus("Покупаем оборудование и подключаем телеметрию...", "");

  try {
    currentUser = await window.MiningPowerDB.purchaseEquipment(currentUser.id, catalogId);
    renderEquipmentPage(currentUser);
    celebratePurchase(button);
    setPurchaseStatus("Покупка завершена. Новое устройство уже добавлено и данные пересчитаны.", "is-success");
  } catch (error) {
    const messageByCode = {
      INSUFFICIENT_FUNDS: "На балансе недостаточно средств для этой покупки.",
      CAPACITY_REACHED: "Все слоты заняты. Освободите место или смените тариф.",
      EQUIPMENT_NOT_FOUND: "Устройство не найдено в каталоге.",
      USER_NOT_FOUND: "Пользователь не найден. Перезайдите в кабинет.",
    };

    renderEquipmentPage(currentUser);
    setPurchaseStatus(messageByCode[error.message] || "Не удалось завершить покупку. Попробуйте ещё раз.", "is-error");
  } finally {
    setButtonBusy(button, false, "Купить");
  }
});

bootstrapEquipmentPage();
