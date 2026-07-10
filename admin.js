function adminFormatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function adminFormatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function adminSetText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function adminEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function adminFormatDate(dateString) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function initAdminTopbar() {
  const shell = document.querySelector(".admin-shell");
  const sidebar = document.getElementById("admin-sidebar");
  const menuButton = document.getElementById("admin-menu-button");
  const languageSelect = document.getElementById("admin-language-select");
  const mobileQuery = window.matchMedia("(max-width: 960px)");

  if (menuButton && sidebar) {
    const setMobileMenuState = (isOpen) => {
      sidebar.classList.toggle("is-open", isOpen);
      menuButton.classList.toggle("is-active", isOpen);
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    };

    const syncMenuState = () => {
      if (mobileQuery.matches) {
        setMobileMenuState(false);
        return;
      }

      const isCollapsed = shell?.classList.contains("is-menu-collapsed") ?? false;
      sidebar.classList.remove("is-open");
      menuButton.classList.remove("is-active");
      menuButton.setAttribute("aria-expanded", String(!isCollapsed));
      menuButton.setAttribute("aria-label", isCollapsed ? "Открыть меню" : "Скрыть меню");
    };

    menuButton.addEventListener("click", () => {
      if (mobileQuery.matches) {
        setMobileMenuState(!sidebar.classList.contains("is-open"));
        return;
      }

      const isCollapsed = shell?.classList.toggle("is-menu-collapsed") ?? false;
      menuButton.setAttribute("aria-expanded", String(!isCollapsed));
      menuButton.setAttribute("aria-label", isCollapsed ? "Открыть меню" : "Скрыть меню");
    });

    sidebar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobileQuery.matches) {
          setMobileMenuState(false);
        }
      });
    });

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncMenuState);
    } else {
      mobileQuery.addListener(syncMenuState);
    }

    syncMenuState();
  }

  if (languageSelect) {
    const savedLanguage = localStorage.getItem("mining-power-admin-language") || document.documentElement.lang || "ru";
    const hasSavedOption = Array.from(languageSelect.options).some((option) => option.value === savedLanguage);

    if (hasSavedOption) {
      languageSelect.value = savedLanguage;
    }

    document.documentElement.lang = languageSelect.value;
    languageSelect.addEventListener("change", () => {
      localStorage.setItem("mining-power-admin-language", languageSelect.value);
      document.documentElement.lang = languageSelect.value;
    });
  }
}

function buildUsersTable(usersWithData) {
  const tbody = document.getElementById("admin-users-body");
  if (!tbody) {
    return;
  }

  if (!usersWithData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="equipment-table__empty">Пользователи пока не зарегистрированы.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = usersWithData
    .map(
      ({ user, data }) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${data.installedMiners}</td>
          <td>${adminFormatCurrency(data.investmentBalanceUsd)}</td>
          <td>${adminFormatCurrency(data.balanceUsd)}</td>
        </tr>
      `
    )
    .join("");
}

function buildDetailList(id, items) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.innerHTML = items
    .map(
      (item) => `
        <div class="detail-list__item">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `
    )
    .join("");
}

function buildMiniStats(id, items) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.innerHTML = items
    .map(
      (item) => `
        <div class="mini-stat">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `
    )
    .join("");
}

function buildLogsTimeline(logs) {
  const element = document.getElementById("admin-logs-timeline");
  if (!element) {
    return;
  }

  if (!logs.length) {
    element.innerHTML = `
      <article class="timeline-item">
        <div class="timeline-item__dot"></div>
        <div class="timeline-item__body">
          <div class="timeline-item__top">
            <strong>Логи пока отсутствуют</strong>
            <span>${adminFormatDate(new Date().toISOString())}</span>
          </div>
          <p>После регистраций, покупок и действий системы события появятся здесь.</p>
          <small>Ожидание данных</small>
        </div>
      </article>
    `;
    return;
  }

  element.innerHTML = logs
    .slice(0, 16)
    .map(
      (item) => `
        <article class="timeline-item ${item.stateClass || ""}">
          <div class="timeline-item__dot"></div>
          <div class="timeline-item__body">
            <div class="timeline-item__top">
              <strong>${item.title}</strong>
              <span>${adminFormatDate(item.createdAt)}</span>
            </div>
            <p>${item.description}</p>
            <small>${item.group}</small>
          </div>
        </article>
      `
    )
    .join("");
}

let adminFaqItems = [];

function renderAdminFaq() {
  const list = document.getElementById("admin-faq-list");
  if (!list) {
    return;
  }

  if (!adminFaqItems.length) {
    list.innerHTML = `<div class="equipment-table__empty">Вопросы пока не добавлены.</div>`;
    return;
  }

  list.innerHTML = adminFaqItems
    .map(
      (item) => `
        <article class="admin-faq-item" data-faq-id="${adminEscapeHtml(item.id)}">
          <div>
            <strong>${adminEscapeHtml(item.question)}</strong>
            <p>${adminEscapeHtml(item.answer)}</p>
          </div>
          <div class="admin-faq-item__actions">
            <button type="button" data-action="edit">Изменить</button>
            <button type="button" data-action="delete">Удалить</button>
          </div>
        </article>
      `
    )
    .join("");
}

function resetAdminFaqForm() {
  const form = document.getElementById("admin-faq-form");
  const idInput = document.getElementById("admin-faq-id");
  const submitButton = document.getElementById("admin-faq-submit");
  const cancelButton = document.getElementById("admin-faq-cancel");

  form?.reset();
  if (idInput) {
    idInput.value = "";
  }
  if (submitButton) {
    submitButton.textContent = "Добавить вопрос";
  }
  if (cancelButton) {
    cancelButton.hidden = true;
  }
}

function saveAdminFaqItems() {
  adminFaqItems = window.MiningPowerDB.saveFaqItems(adminFaqItems);
  renderAdminFaq();
}

function initAdminFaqEditor() {
  const form = document.getElementById("admin-faq-form");
  const idInput = document.getElementById("admin-faq-id");
  const questionInput = document.getElementById("admin-faq-question");
  const answerInput = document.getElementById("admin-faq-answer");
  const submitButton = document.getElementById("admin-faq-submit");
  const cancelButton = document.getElementById("admin-faq-cancel");
  const list = document.getElementById("admin-faq-list");

  if (!form || !idInput || !questionInput || !answerInput || !window.MiningPowerDB?.getFaqItems) {
    return;
  }

  adminFaqItems = window.MiningPowerDB.getFaqItems();
  renderAdminFaq();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const id = idInput.value || `faq-${Date.now()}`;
    const nextItem = {
      id,
      question: questionInput.value.trim(),
      answer: answerInput.value.trim(),
    };

    if (!nextItem.question || !nextItem.answer) {
      return;
    }

    const existingIndex = adminFaqItems.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      adminFaqItems = adminFaqItems.map((item) => (item.id === id ? nextItem : item));
    } else {
      adminFaqItems = [...adminFaqItems, nextItem];
    }

    saveAdminFaqItems();
    resetAdminFaqForm();
  });

  cancelButton?.addEventListener("click", resetAdminFaqForm);

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const itemElement = event.target.closest(".admin-faq-item");
    if (!button || !itemElement) {
      return;
    }

    const item = adminFaqItems.find((entry) => entry.id === itemElement.dataset.faqId);
    if (!item) {
      return;
    }

    if (button.dataset.action === "delete") {
      adminFaqItems = adminFaqItems.filter((entry) => entry.id !== item.id);
      saveAdminFaqItems();
      resetAdminFaqForm();
      return;
    }

    idInput.value = item.id;
    questionInput.value = item.question;
    answerInput.value = item.answer;
    if (submitButton) {
      submitButton.textContent = "Сохранить изменения";
    }
    if (cancelButton) {
      cancelButton.hidden = false;
    }
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

let adminTickets = [];

function renderAdminTickets() {
  const list = document.getElementById("admin-ticket-list");
  if (!list) {
    return;
  }

  if (!adminTickets.length) {
    list.innerHTML = `<div class="equipment-table__empty">Новых тикетов нет.</div>`;
    return;
  }

  list.innerHTML = adminTickets
    .map((ticket) => {
      const mailSubject = encodeURIComponent(`Re: ${ticket.subject}`);
      const mailBody = encodeURIComponent(
        `Здравствуйте, ${ticket.name}.\n\n\n\nВаш вопрос:\n${ticket.message}`
      );

      return `
        <article class="admin-ticket-item" data-ticket-id="${adminEscapeHtml(ticket.id)}">
          <div class="admin-ticket-item__top">
            <div>
              <strong>${adminEscapeHtml(ticket.subject)}</strong>
              <span>${adminEscapeHtml(ticket.name)} / ${adminEscapeHtml(ticket.email)}</span>
            </div>
            <small>${adminFormatDate(ticket.createdAt)}</small>
          </div>
          <p>${adminEscapeHtml(ticket.message)}</p>
          <div class="admin-ticket-item__actions">
            <a href="mailto:${encodeURIComponent(ticket.email)}?subject=${mailSubject}&body=${mailBody}">Ответить с почты</a>
            <button type="button" data-action="delete-ticket">Удалить</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function initAdminTickets() {
  const list = document.getElementById("admin-ticket-list");
  if (!list || !window.MiningPowerDB?.getSupportTickets) {
    return;
  }

  adminTickets = window.MiningPowerDB.getSupportTickets();
  renderAdminTickets();

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='delete-ticket']");
    const item = event.target.closest(".admin-ticket-item");
    if (!button || !item) {
      return;
    }

    adminTickets = window.MiningPowerDB.deleteSupportTicket(item.dataset.ticketId);
    renderAdminTickets();
  });
}

async function bootstrapAdmin() {
  if (!window.MiningPowerDB?.isAdminAuthenticated()) {
    window.location.href = "admin-login.html";
    return;
  }

  initAdminTopbar();

  const rawUsers = await window.MiningPowerDB.getAllUsers();
  const users = rawUsers.map((user) => window.MiningPowerDB.upgradeUserData(user)).filter(Boolean);
  const usersWithData = users.map((user) => ({
    user,
    data: window.MiningPowerDB.buildDashboardData(user),
  }));

  const allMiners = usersWithData.flatMap(({ data }) => data.miners);
  const allPayouts = usersWithData.flatMap(({ user, data }) =>
    data.payouts.map((payout) => ({
      ...payout,
      userName: user.name,
    }))
  );
  const allHistory = users.flatMap((user) =>
    (user.purchaseHistory || []).map((item) => ({
      ...item,
      userName: user.name,
      userEmail: user.email,
    }))
  );

  const totalEarnedUsd = usersWithData.reduce((sum, entry) => sum + entry.data.earnedUsd, 0);
  const totalPaidUsd = usersWithData.reduce((sum, entry) => sum + entry.data.paidUsd, 0);
  const totalMiningBalanceUsd = usersWithData.reduce((sum, entry) => sum + entry.data.balanceUsd, 0);
  const totalEquipmentBalanceUsd = usersWithData.reduce((sum, entry) => sum + entry.data.investmentBalanceUsd, 0);
  const activeMiners = allMiners.filter((miner) => !String(miner.statusClass).includes("service")).length;
  const offlineMiners = allMiners.length - activeMiners;
  const averageLoad =
    allMiners.length > 0 ? allMiners.reduce((sum, miner) => sum + Number(miner.load || 0), 0) / allMiners.length : 0;
  const commissionUsd = totalPaidUsd * 0.04;
  const transactionCount = allPayouts.length + allHistory.length;
  const walletsCount = users.filter((user) => user.email).length;
  const tariffConnections = allHistory.filter((item) => item.type === "tariff");
  const tariffVolumeUsd = tariffConnections.reduce((sum, item) => sum + Number(item.amountUsd || 0), 0);

  const logs = [
    ...users.map((user) => ({
      title: "Авторизация / регистрация",
      description: `${user.name} зарегистрирован в системе.`,
      group: "Авторизация",
      createdAt: user.createdAt || new Date().toISOString(),
      stateClass: "",
    })),
    ...allHistory.map((item) => ({
      title: item.type === "top-up" ? "Пополнение баланса" : "Действие пользователя",
      description:
        item.type === "top-up"
          ? `${item.userName}: пополнение на ${adminFormatCurrency(item.amountUsd || 0)}`
          : `${item.userName}: операция с оборудованием`,
      group: "Действия",
      createdAt: item.createdAt || new Date().toISOString(),
      stateClass: item.type === "top-up" ? "is-success" : "is-accent",
    })),
  ]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  adminSetText("admin-users-total", String(users.length));
  adminSetText("admin-miners-total", String(allMiners.length));
  adminSetText("admin-miners-online", `Онлайн: ${activeMiners}`);
  adminSetText("admin-earned-total", adminFormatCurrency(totalEarnedUsd));
  adminSetText("admin-paid-total", `Выплачено: ${adminFormatCurrency(totalPaidUsd)}`);
  adminSetText("admin-logs-total", String(logs.length));
  adminSetText("admin-period", `${users.length} пользователей / ${allMiners.length} устройств`);

  buildUsersTable(usersWithData);
  buildMiniStats("admin-balances-grid", [
    { label: "Баланс оборудования", value: adminFormatCurrency(totalEquipmentBalanceUsd) },
    { label: "Майнинг баланс", value: adminFormatCurrency(totalMiningBalanceUsd) },
    { label: "Средний баланс на пользователя", value: adminFormatCurrency(users.length ? totalMiningBalanceUsd / users.length : 0) },
  ]);
  buildDetailList("admin-finance-list", [
    { label: "Выплаты", value: adminFormatCurrency(totalPaidUsd) },
    { label: "Доход", value: adminFormatCurrency(totalEarnedUsd) },
    { label: "Комиссии", value: adminFormatCurrency(commissionUsd) },
    { label: "Транзакции", value: String(transactionCount) },
    { label: "Кошельки", value: String(walletsCount) },
  ]);
  buildMiniStats("admin-miners-grid", [
    { label: "Все устройства", value: String(allMiners.length) },
    { label: "Онлайн", value: String(activeMiners) },
    { label: "Оффлайн", value: String(offlineMiners) },
    { label: "Нагрузка", value: `${adminFormatNumber(averageLoad, 1)}%` },
  ]);
  buildDetailList("admin-tariffs-list", [
    { label: "Подключения", value: String(tariffConnections.length) },
    { label: "Сумма подключений", value: adminFormatCurrency(tariffVolumeUsd) },
    { label: "Пополнения", value: `${allHistory.filter((item) => item.type === "top-up").length} операций` },
  ]);
  buildDetailList("admin-settings-list", [
    { label: "Общие", value: "Активно" },
    { label: "SMTP", value: "Настроено" },
    { label: "API", value: "Подключено" },
    { label: "Криптовалюты", value: "BTC / LTC / DOGE / KAS" },
    { label: "Платежные системы", value: "Crypto wallets" },
    { label: "Безопасность", value: "Стандартный режим" },
  ]);
  initAdminFaqEditor();
  initAdminTickets();
  buildLogsTimeline(logs);

  document.getElementById("admin-logout-button")?.addEventListener("click", () => {
    window.MiningPowerDB.clearAdminSession();
    window.location.href = "admin-login.html";
  });
}

bootstrapAdmin();
