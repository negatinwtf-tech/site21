function cabinetFormatNumber(value, digits = 2) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function cabinetFormatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function cabinetFormatPercent(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function cabinetInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function cabinetSetText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

let cabinetCurrentUser = null;

function cabinetSetStatus(id, message, type = "") {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("is-success", "is-error");
  if (type) {
    element.classList.add(type);
  }
}

function cabinetEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cabinetFormatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function cabinetFormatDurationFromSeconds(totalSeconds) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours} : ${minutes} : ${seconds}`;
}

function buildPayoutListHtml(items) {
  if (!items.length) {
    return `
      <div class="payout-item payout-item--empty">
        Выплаты появятся после накопления первой добычи.
      </div>
    `;
  }

  return items
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

function buildHistoryHtml(user, data) {
  const history = [...(user.purchaseHistory || [])]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((item) => {
      if (item.type === "top-up") {
        return {
          title: "Пополнение баланса",
          description: `На баланс тарифных планов зачислено ${cabinetFormatCurrency(item.amountUsd || 0)}.`,
          meta: "Баланс обновлён",
          stateClass: "is-success",
          createdAt: item.createdAt,
        };
      }

      if (item.type === "withdraw") {
        return {
          title: "Вывод средств",
          description: `С баланса тарифных планов выведено ${cabinetFormatCurrency(item.amountUsd || 0)}.`,
          meta: "Заявка обработана",
          stateClass: "",
          createdAt: item.createdAt,
        };
      }

      const catalog = data.equipmentCatalog.find((entry) => entry.id === item.catalogId);
      const label = item.type === "starter" ? "Первый тариф" : "Подключение тарифа";
      const amount = typeof item.amountUsd === "number" ? cabinetFormatCurrency(item.amountUsd) : "Без оплаты";
      const tariffPlan = window.MiningPowerDB.getTariffPlanConfig(item.termMonths || 12);
      const monthlyPercent = typeof item.monthlyPercent === "number" ? item.monthlyPercent : tariffPlan?.monthlyPercent;
      const percentLabel = typeof monthlyPercent === "number" ? ` под ${cabinetFormatPercent(monthlyPercent)}% в месяц` : "";
      const tariffDescription =
        item.type === "tariff"
          ? `Тариф на ${item.termMonths || 12} месяцев${percentLabel} подключен к ферме.`
          : `${catalog?.name || "Тарифный план"} подключен к ферме.`;

      return {
        title: label,
        description: tariffDescription,
        meta: amount,
        stateClass: item.type === "starter" ? "" : "is-accent",
        createdAt: item.createdAt,
      };
    });

  if (!history.length) {
    return `
      <article class="timeline-item">
        <div class="timeline-item__dot"></div>
        <div class="timeline-item__body">
          <strong>История пока пуста</strong>
          <p>После пополнений и подключений тарифов здесь появятся все события кабинета.</p>
        </div>
      </article>
    `;
  }

  return history
    .map(
      (item) => `
        <article class="timeline-item ${item.stateClass}">
          <div class="timeline-item__dot"></div>
          <div class="timeline-item__body">
            <div class="timeline-item__top">
              <strong>${item.title}</strong>
              <span>${cabinetFormatDate(item.createdAt || new Date().toISOString())}</span>
            </div>
            <p>${item.description}</p>
            <small>${item.meta}</small>
          </div>
        </article>
      `
    )
    .join("");
}

function renderFinancePage(user, data) {
  cabinetSetText("page-subtitle", `Финансовая сводка для ${user.name}.`);
  cabinetSetText("page-period", data.periodLabel);
  cabinetSetText("profile-name", cabinetInitials(user.name));

  cabinetSetText("finance-earned-btc", `${cabinetFormatNumber(data.earnedBtc, 8)} BTC`);
  cabinetSetText("finance-earned-usd", cabinetFormatCurrency(data.earnedUsd));
  cabinetSetText("finance-paid-btc", `${cabinetFormatNumber(data.paidBtc, 8)} BTC`);
  cabinetSetText("finance-paid-usd", cabinetFormatCurrency(data.paidUsd));
  cabinetSetText("finance-balance-btc", `${cabinetFormatNumber(data.balanceBtc, 8)} BTC`);
  cabinetSetText("finance-balance-usd", cabinetFormatCurrency(data.balanceUsd));
  cabinetSetText("finance-equipment-balance", cabinetFormatCurrency(data.investmentBalanceUsd));
  cabinetSetText("finance-daily", cabinetFormatCurrency(data.dailyRevenueUsd));
  cabinetSetText("finance-monthly", cabinetFormatCurrency(data.dailyRevenueUsd * 30));
  cabinetSetText("finance-yearly", cabinetFormatCurrency(data.dailyRevenueUsd * 365));
  cabinetSetText("finance-efficiency", `${cabinetFormatNumber(data.efficiency, 1)}%`);
  cabinetSetText("finance-miners", String(data.activeMiners));
}

async function refreshFinancePage() {
  if (!cabinetCurrentUser) {
    return;
  }

  const data = window.MiningPowerDB.buildDashboardData(cabinetCurrentUser);
  renderFinancePage(cabinetCurrentUser, data);
}

function initFinanceBalanceActions() {
  const form = document.getElementById("finance-balance-form");
  const amountInput = document.getElementById("finance-balance-amount");
  if (!form || !amountInput) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const action = event.submitter?.dataset.financeAction;
    const amount = Number(amountInput.value || 0);

    if (!cabinetCurrentUser || amount < 10) {
      cabinetSetStatus("finance-balance-status", "Минимальная сумма операции - $10.", "is-error");
      return;
    }

    cabinetSetStatus(
      "finance-balance-status",
      action === "withdraw" ? "Оформляем вывод средств..." : "Зачисляем средства на баланс...",
      ""
    );

    try {
      cabinetCurrentUser =
        action === "withdraw"
          ? await window.MiningPowerDB.withdrawEquipmentBalance(cabinetCurrentUser.id, amount)
          : await window.MiningPowerDB.topUpEquipmentBalance(cabinetCurrentUser.id, amount);

      await refreshFinancePage();
      cabinetSetStatus(
        "finance-balance-status",
        action === "withdraw"
          ? `Выведено ${cabinetFormatCurrency(amount)}.`
          : `Внесено ${cabinetFormatCurrency(amount)}. Теперь можно подключать тарифы.`,
        "is-success"
      );
    } catch (error) {
      const messages = {
        INSUFFICIENT_FUNDS: "Недостаточно средств для вывода.",
        INVALID_TOP_UP_AMOUNT: "Введите корректную сумму пополнения.",
        INVALID_WITHDRAW_AMOUNT: "Введите корректную сумму вывода.",
        USER_NOT_FOUND: "Пользователь не найден. Перезайдите в кабинет.",
      };
      cabinetSetStatus("finance-balance-status", messages[error.message] || "Операция не выполнена. Попробуйте ещё раз.", "is-error");
    }
  });
}

function renderPayoutsPage(user, data) {
  cabinetSetText("page-subtitle", `График выплат и последние транзакции для ${user.name}.`);
  cabinetSetText("page-period", data.periodLabel);
  cabinetSetText("profile-name", cabinetInitials(user.name));

  cabinetSetText("payouts-next", cabinetFormatDurationFromSeconds(data.nextPayoutSeconds));
  cabinetSetText("payouts-available-usd", cabinetFormatCurrency(data.balanceUsd));
  cabinetSetText("payouts-minimum", "$10.00");
  cabinetSetText("payouts-status", data.payouts.length ? "Автовыплаты активны" : "Ожидание первой выплаты");

  const list = document.getElementById("payout-list");
  if (list) {
    list.innerHTML = buildPayoutListHtml(data.payouts);
  }

  const stats = document.getElementById("payout-stats");
  if (stats) {
    stats.innerHTML = `
      <div class="mini-stat">
        <span>Всего выплат</span>
        <strong>${data.payouts.length}</strong>
      </div>
      <div class="mini-stat">
        <span>Доход в сутки</span>
        <strong>${cabinetFormatCurrency(data.dailyRevenueUsd)}</strong>
      </div>
      <div class="mini-stat">
        <span>Активные тарифы</span>
        <strong>${data.activeMiners}</strong>
      </div>
    `;
  }
}

function renderHistoryPage(user, data) {
  cabinetSetText("page-subtitle", `Лента событий по аккаунту ${user.name}.`);
  cabinetSetText("page-period", data.periodLabel);
  cabinetSetText("profile-name", cabinetInitials(user.name));

  cabinetSetText("history-events", String((user.purchaseHistory || []).length));
  cabinetSetText("history-installed", String(data.installedMiners));
  cabinetSetText("history-runtime", data.uptimeLabel);

  const timeline = document.getElementById("history-timeline");
  if (timeline) {
    timeline.innerHTML = buildHistoryHtml(user, data);
  }
}

function renderSupportPage(user, data) {
  cabinetSetText("page-subtitle", `Каналы связи и справка по ферме для ${user.name}.`);
  cabinetSetText("page-period", data.periodLabel);
  cabinetSetText("profile-name", cabinetInitials(user.name));
  const faqList = document.getElementById("support-faq-list");
  if (faqList && window.MiningPowerDB?.getFaqItems) {
    faqList.innerHTML = window.MiningPowerDB
      .getFaqItems()
      .map(
        (item) => `
          <article class="faq-item">
            <strong>${cabinetEscapeHtml(item.question)}</strong>
            <p>${cabinetEscapeHtml(item.answer)}</p>
          </article>
        `
      )
      .join("");
  }
}

function initSupportTicketForm() {
  const form = document.getElementById("support-ticket-form");
  if (!form) {
    return;
  }

  const nameInput = document.getElementById("support-ticket-name");
  const emailInput = document.getElementById("support-ticket-email");
  const subjectInput = document.getElementById("support-ticket-subject");
  const messageInput = document.getElementById("support-ticket-message");

  if (nameInput && cabinetCurrentUser?.name) {
    nameInput.value = cabinetCurrentUser.name;
  }
  if (emailInput && cabinetCurrentUser?.email) {
    emailInput.value = cabinetCurrentUser.email;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      window.MiningPowerDB.createSupportTicket({
        userId: cabinetCurrentUser?.id,
        name: nameInput?.value,
        email: emailInput?.value,
        subject: subjectInput?.value,
        message: messageInput?.value,
      });

      form.reset();
      if (nameInput && cabinetCurrentUser?.name) {
        nameInput.value = cabinetCurrentUser.name;
      }
      if (emailInput && cabinetCurrentUser?.email) {
        emailInput.value = cabinetCurrentUser.email;
      }
      cabinetSetStatus("support-ticket-status", "Заявка отправлена. Ответ придёт на указанную почту.", "is-success");
    } catch (error) {
      cabinetSetStatus("support-ticket-status", "Заполните все поля заявки и попробуйте ещё раз.", "is-error");
    }
  });
}

async function bootstrapCabinetPage() {
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

  const user = window.MiningPowerDB.needsUserUpgrade(foundUser)
    ? await window.MiningPowerDB.updateUser(window.MiningPowerDB.upgradeUserData(foundUser))
    : window.MiningPowerDB.upgradeUserData(foundUser);
  cabinetCurrentUser = user;

  const data = window.MiningPowerDB.buildDashboardData(user);
  const page = document.body.dataset.cabinetPage;

  if (page === "finance") {
    renderFinancePage(user, data);
    initFinanceBalanceActions();
  } else if (page === "payouts") {
    renderPayoutsPage(user, data);
  } else if (page === "history") {
    renderHistoryPage(user, data);
  } else if (page === "support") {
    renderSupportPage(user, data);
    initSupportTicketForm();
  }

  document.getElementById("logout-button")?.addEventListener("click", () => {
    window.MiningPowerDB.clearSession();
    window.location.href = "auth.html";
  });
}

bootstrapCabinetPage();
