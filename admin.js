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

function adminFormatDate(dateString) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function buildUsersTable(usersWithData) {
  const tbody = document.getElementById("admin-users-body");
  if (!tbody) {
    return;
  }

  if (!usersWithData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="equipment-table__empty">Пользователи пока не зарегистрированы.</td>
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
          <td>${data.planName}</td>
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

async function bootstrapAdmin() {
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
  const totalHashratePh = usersWithData.reduce((sum, entry) => sum + entry.data.totalHashratePh, 0);
  const activeMiners = allMiners.filter((miner) => !String(miner.statusClass).includes("service")).length;
  const offlineMiners = allMiners.length - activeMiners;
  const averageTemperature =
    allMiners.length > 0
      ? allMiners.reduce((sum, miner) => sum + parseFloat(String(miner.temperature).replace(/[^\d.]/g, "") || 0), 0) / allMiners.length
      : 0;
  const averageLoad =
    allMiners.length > 0 ? allMiners.reduce((sum, miner) => sum + Number(miner.load || 0), 0) / allMiners.length : 0;
  const commissionUsd = totalPaidUsd * 0.04;
  const transactionCount = allPayouts.length + allHistory.length;
  const walletsCount = users.filter((user) => user.email).length;
  const planCounts = users.reduce(
    (accumulator, user) => {
      const key = user.plan || "optimal";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    },
    { start: 0, optimal: 0, pro: 0 }
  );

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
    { label: "Температуры", value: `${adminFormatNumber(averageTemperature, 1)} °C` },
    { label: "Хешрейт", value: `${adminFormatNumber(totalHashratePh, 2)} PH/s` },
    { label: "Нагрузка", value: `${adminFormatNumber(averageLoad, 1)}%` },
  ]);
  buildDetailList("admin-tariffs-list", [
    { label: "Планы", value: `Start: ${planCounts.start}, Optimal: ${planCounts.optimal}, Pro: ${planCounts.pro}` },
    { label: "Контракты", value: String(users.length) },
    { label: "Бонусы", value: `${allHistory.filter((item) => item.type === "top-up").length} активностей` },
  ]);
  buildDetailList("admin-settings-list", [
    { label: "Общие", value: "Активно" },
    { label: "SMTP", value: "Настроено" },
    { label: "API", value: "Подключено" },
    { label: "Криптовалюты", value: "BTC / LTC / DOGE / KAS" },
    { label: "Платежные системы", value: "Crypto wallets" },
    { label: "Безопасность", value: "Стандартный режим" },
  ]);
  buildLogsTimeline(logs);
}

bootstrapAdmin();
