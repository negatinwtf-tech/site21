(function () {
  const DB_NAME = "mining-power-db";
  const DB_VERSION = 1;
  const STORE_NAME = "users";
  const USERS_KEY = "mining-power-users";
  const SESSION_KEY = "mining-power-session";
  const ADMIN_SESSION_KEY = "mining-power-admin-session";
  const FAQ_KEY = "mining-power-faq";
  const PLAN_CONFIG_KEY = "mining-power-plan-config";
  const CONTACTS_KEY = "mining-power-contacts";
  const SUPPORT_TICKETS_KEY = "mining-power-support-tickets";
  const DATA_VERSION = 5;
  const BTC_USD_RATE = 96500;
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;
  const TARIFF_HASHRATE_TH_PER_USD = 0.033;
  const TARIFF_POWER_KW_PER_USD = 0.00042;
  const TARIFF_DYNAMIC_VARIATION = 0.03;
  const PAGE_DYNAMIC_SEED = Math.random().toString(36).slice(2);

  const EQUIPMENT_CATALOG = Object.freeze([
    {
      id: "antminer-s21-pro",
      name: "Bitmain Antminer S21 Pro",
      shortName: "S21 Pro",
      algorithm: "SHA-256",
      cooling: "Воздушное",
      priceUsd: 5400,
      powerKw: 3.51,
      displayHashrateValue: 234,
      displayHashrateUnit: "TH/s",
      normalizedHashrateTh: 234,
      dailyRevenueUsd: 17.8,
      baseTemperatureC: 60,
      efficiencyJTh: 15,
      coinMix: [{ name: "Bitcoin (BTC)", color: "#f7931a", share: 100 }],
    },
    {
      id: "whatsminer-m60s",
      name: "MicroBT WhatsMiner M60S",
      shortName: "M60S",
      algorithm: "SHA-256",
      cooling: "Воздушное",
      priceUsd: 4300,
      powerKw: 3.44,
      displayHashrateValue: 186,
      displayHashrateUnit: "TH/s",
      normalizedHashrateTh: 186,
      dailyRevenueUsd: 14.6,
      baseTemperatureC: 58,
      efficiencyJTh: 18.5,
      coinMix: [{ name: "Bitcoin (BTC)", color: "#f7931a", share: 100 }],
    },
    {
      id: "antminer-l9",
      name: "Bitmain Antminer L9",
      shortName: "L9",
      algorithm: "Scrypt",
      cooling: "Воздушное",
      priceUsd: 8800,
      powerKw: 3.36,
      displayHashrateValue: 17,
      displayHashrateUnit: "GH/s",
      normalizedHashrateTh: 205,
      dailyRevenueUsd: 24.7,
      baseTemperatureC: 57,
      efficiencyJTh: 16.4,
      coinMix: [
        { name: "Litecoin (LTC)", color: "#53d0ff", share: 62 },
        { name: "Dogecoin (DOGE)", color: "#ffd84d", share: 38 },
      ],
    },
    {
      id: "iceriver-ks5m",
      name: "IceRiver KS5M",
      shortName: "KS5M",
      algorithm: "KHeavyHash",
      cooling: "Воздушное",
      priceUsd: 7600,
      powerKw: 3.4,
      displayHashrateValue: 15,
      displayHashrateUnit: "TH/s",
      normalizedHashrateTh: 172,
      dailyRevenueUsd: 19.1,
      baseTemperatureC: 56,
      efficiencyJTh: 19.8,
      coinMix: [{ name: "Kaspa (KAS)", color: "#5ad190", share: 100 }],
    },
    {
      id: "antminer-s21-hyd",
      name: "Bitmain Antminer S21 XP Hyd",
      shortName: "S21 Hyd",
      algorithm: "SHA-256",
      cooling: "Hydro",
      priceUsd: 9200,
      powerKw: 5.36,
      displayHashrateValue: 335,
      displayHashrateUnit: "TH/s",
      normalizedHashrateTh: 335,
      dailyRevenueUsd: 25.4,
      baseTemperatureC: 48,
      efficiencyJTh: 16,
      coinMix: [{ name: "Bitcoin (BTC)", color: "#f7931a", share: 100 }],
    },
  ]);

  const EQUIPMENT_BY_ID = new Map(EQUIPMENT_CATALOG.map((item) => [item.id, item]));

  const TARIFF_PLAN_CONFIG = Object.freeze({
    6: { months: 6, monthlyPercent: 5 },
    9: { months: 9, monthlyPercent: 6.2 },
    12: { months: 12, monthlyPercent: 7.5 },
    18: { months: 18, monthlyPercent: 8.3 },
    24: { months: 24, monthlyPercent: 9 },
  });
  const TARIFF_PLAN_TERMS = Object.freeze(Object.keys(TARIFF_PLAN_CONFIG).map(Number));

  const PLAN_CONFIG = Object.freeze({
    start: {
      label: "Старт",
      payoutPercent: 5,
      slots: 8,
      equipmentBalanceUsd: 0,
      starterCatalogIds: [],
      payoutIntervalSeconds: 4 * 60 * 60,
    },
    optimal: {
      label: "Оптимальный",
      payoutPercent: 7,
      slots: 16,
      equipmentBalanceUsd: 0,
      starterCatalogIds: [],
      payoutIntervalSeconds: 3 * 60 * 60,
    },
    pro: {
      label: "Профессионал",
      payoutPercent: 10,
      slots: 28,
      equipmentBalanceUsd: 0,
      starterCatalogIds: [],
      payoutIntervalSeconds: 2 * 60 * 60,
    },
  });

  const LEGACY_MODEL_MAP = {
    "Antminer S23 Air": "antminer-s21-pro",
    "WhatsMiner M60S+": "whatsminer-m60s",
    "Antminer S23 Hyd": "antminer-s21-hyd",
    "SealMiner A4 Ultra Hydro": "iceriver-ks5m",
  };

  const ADMIN_CREDENTIALS = Object.freeze({
    login: ["mp", "root", "ops", "2026"].join("."),
    password: ["K9!", "Vault#", "Sigma_", "Mine@472"].join(""),
  });

  const DEFAULT_FAQ_ITEMS = Object.freeze([
    {
      id: "faq-start",
      question: "Как начать майнить с вами?",
      answer: "Укажите сумму инвестиций, выберите тарифный план и оставьте заявку. Менеджер поможет оформить договор.",
    },
    {
      id: "faq-coins",
      question: "Какие криптовалюты вы добываете?",
      answer: "Основной фокус на BTC, LTC и инфраструктуре для стабильных PoW-активов с высокой ликвидностью.",
    },
    {
      id: "faq-payouts",
      question: "Как происходит выплата дохода?",
      answer: "Выплаты можно получать в USDT, BTC или на банковские реквизиты по согласованному графику.",
    },
    {
      id: "faq-contract",
      question: "Что входит в стоимость контракта?",
      answer: "Включены размещение, обслуживание, мониторинг, доступ к кабинету и техническая поддержка.",
    },
  ]);

  const DEFAULT_CONTACTS = Object.freeze({
    email: "info@miningpower.com",
    phone: "+1 234 567 89 00",
    telegram: "https://t.me/",
    whatsapp: "https://wa.me/12345678900",
  });

  let dbPromise = null;
  let useFallbackStorage = false;

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value ?? "");
    } catch (error) {
      return fallback;
    }
  }

  function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function seedFromString(input) {
    return Array.from(String(input || "")).reduce(
      (total, char, index) => (total * 33 + char.charCodeAt(0) * (index + 1)) % 2147483647,
      5381
    );
  }

  function seededValue(seed, min, max, digits = 2) {
    const raw = Math.abs(Math.sin(seed) * 10000) % 1;
    return round(min + raw * (max - min), digits);
  }

  function formatHashrateValue(value) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: value < 100 ? 1 : 0,
      maximumFractionDigits: value < 100 ? 2 : 1,
    });
  }

  function formatPercentValue(value) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function formatMetricValue(value, digits) {
    return Number(value).toLocaleString("ru-RU", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function getPageDynamicFactor(key) {
    const seed = seedFromString(`${PAGE_DYNAMIC_SEED}:${key}`);
    return seededValue(seed, 1 - TARIFF_DYNAMIC_VARIATION, 1 + TARIFF_DYNAMIC_VARIATION, 4);
  }

  function getTariffDisplayMetrics(item) {
    const investedAmount = Number(item.investedAmountUsd);
    if (!Number.isFinite(investedAmount)) {
      return null;
    }

    const metricKey = item.id || `${item.tariffMonths || "tariff"}:${investedAmount}`;
    const hashrateTh = investedAmount * TARIFF_HASHRATE_TH_PER_USD * getPageDynamicFactor(`${metricKey}:hashrate`);
    const powerKw = investedAmount * TARIFF_POWER_KW_PER_USD * getPageDynamicFactor(`${metricKey}:power`);
    const temperatureC = item.temperatureC * getPageDynamicFactor(`${metricKey}:temperature`);
    const hashrateDigits = hashrateTh < 10 ? 2 : 1;
    const displayHashrateTh = round(hashrateTh, hashrateDigits);
    const displayTemperatureC = round(temperatureC, 1);
    const displayPowerKw = round(powerKw, 3);

    return {
      hashrateTh: displayHashrateTh,
      temperatureC: displayTemperatureC,
      powerKw: displayPowerKw,
      hashrate: `~${formatMetricValue(displayHashrateTh, hashrateDigits)}ТН/s`,
      temperature: `~${formatMetricValue(displayTemperatureC, 1)} °C`,
      power: `~${formatMetricValue(displayPowerKw, 3)}кВт`,
    };
  }

  function getTariffPlanConfig(termMonths) {
    return TARIFF_PLAN_CONFIG[Number(termMonths)] || null;
  }

  function getTariffMonthlyPercent(device) {
    if (typeof device?.tariffMonthlyPercent === "number") {
      return device.tariffMonthlyPercent;
    }

    return getTariffPlanConfig(device?.tariffMonths)?.monthlyPercent ?? null;
  }

  function formatDuration(hours) {
    const totalHours = Math.max(0, Math.floor(hours));
    const days = Math.floor(totalHours / 24);
    const remainderHours = totalHours % 24;
    const minutes = Math.floor((hours - totalHours) * 60);

    return `${days}д ${remainderHours}ч ${minutes}м`;
  }

  function formatDateLabel(date) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  function formatDateRangeLabel(startDate, endDate) {
    const startDay = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(startDate);
    const endDay = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(endDate);

    return `${startDay} - ${endDay}`;
  }

  function normalizeRangeDays(value) {
    const days = Number(value);
    return [7, 14, 30].includes(days) ? days : 7;
  }

  function planLabel(plan) {
    return getPlanConfig(plan).label;
  }

  function getPlanConfig(plan) {
    const key = Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan) ? plan : "optimal";
    const saved = safeJsonParse(localStorage.getItem(PLAN_CONFIG_KEY), {});
    return { ...PLAN_CONFIG[key], ...(saved[key] || {}) };
  }

  function getPlanConfigs() {
    return Object.keys(PLAN_CONFIG).map((id) => ({ id, ...getPlanConfig(id) }));
  }

  function savePlanConfigs(items) {
    const saved = {};
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!Object.prototype.hasOwnProperty.call(PLAN_CONFIG, item.id)) return;
      saved[item.id] = {
        label: String(item.label || PLAN_CONFIG[item.id].label).trim(),
        payoutPercent: Math.min(100, Math.max(0, Number(item.payoutPercent) || 0)),
        slots: Math.max(1, Math.floor(Number(item.slots) || PLAN_CONFIG[item.id].slots)),
        payoutIntervalSeconds: Math.max(60, Math.floor(Number(item.payoutIntervalSeconds) || PLAN_CONFIG[item.id].payoutIntervalSeconds)),
      };
    });
    localStorage.setItem(PLAN_CONFIG_KEY, JSON.stringify(saved));
    return getPlanConfigs();
  }

  function getCatalogById(catalogId) {
    return EQUIPMENT_BY_ID.get(catalogId) || null;
  }

  function readFallbackUsers() {
    return safeJsonParse(localStorage.getItem(USERS_KEY), []);
  }

  function writeFallbackUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function normalizeFaqItems(items) {
    if (!Array.isArray(items)) {
      return DEFAULT_FAQ_ITEMS.map((item) => ({ ...item }));
    }

    return items
      .map((item, index) => ({
        id: String(item.id || `faq-${Date.now()}-${index}`),
        question: String(item.question || "").trim(),
        answer: String(item.answer || "").trim(),
      }))
      .filter((item) => item.question && item.answer);
  }

  function getFaqItems() {
    const parsedItems = safeJsonParse(localStorage.getItem(FAQ_KEY), null);
    if (Array.isArray(parsedItems)) {
      return normalizeFaqItems(parsedItems);
    }

    return DEFAULT_FAQ_ITEMS.map((item) => ({ ...item }));
  }

  function saveFaqItems(items) {
    const normalizedItems = normalizeFaqItems(items);
    localStorage.setItem(FAQ_KEY, JSON.stringify(normalizedItems));
    return normalizedItems;
  }

  function getContacts() {
    const saved = safeJsonParse(localStorage.getItem(CONTACTS_KEY), {});
    return {
      email: String(saved.email || DEFAULT_CONTACTS.email).trim(),
      phone: String(saved.phone || DEFAULT_CONTACTS.phone).trim(),
      telegram: String(saved.telegram || DEFAULT_CONTACTS.telegram).trim(),
      whatsapp: String(saved.whatsapp || DEFAULT_CONTACTS.whatsapp).trim(),
    };
  }

  function saveContacts(contacts) {
    const normalized = {
      email: String(contacts?.email || "").trim(),
      phone: String(contacts?.phone || "").trim(),
      telegram: String(contacts?.telegram || "").trim(),
      whatsapp: String(contacts?.whatsapp || "").trim(),
    };
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(normalized));
    return getContacts();
  }

  function normalizeSupportTickets(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item, index) => ({
        id: String(item.id || `ticket-${Date.now()}-${index}`),
        userId: String(item.userId || ""),
        name: String(item.name || "").trim(),
        email: String(item.email || "").trim(),
        subject: String(item.subject || "").trim(),
        message: String(item.message || "").trim(),
        createdAt: item.createdAt || new Date().toISOString(),
      }))
      .filter((item) => item.name && item.email && item.subject && item.message);
  }

  function getSupportTickets() {
    return normalizeSupportTickets(safeJsonParse(localStorage.getItem(SUPPORT_TICKETS_KEY), []));
  }

  function saveSupportTickets(items) {
    const normalizedItems = normalizeSupportTickets(items);
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(normalizedItems));
    return normalizedItems;
  }

  function createSupportTicket(ticket) {
    const tickets = getSupportTickets();
    const nextTicket = normalizeSupportTickets([
      {
        ...ticket,
        id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
      },
    ])[0];

    if (!nextTicket) {
      throw new Error("INVALID_SUPPORT_TICKET");
    }

    return saveSupportTickets([nextTicket, ...tickets])[0];
  }

  function deleteSupportTicket(ticketId) {
    const nextTickets = getSupportTickets().filter((ticket) => ticket.id !== ticketId);
    return saveSupportTickets(nextTickets);
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Database request failed"));
    });
  }

  function openDatabase() {
    if (useFallbackStorage || typeof indexedDB === "undefined") {
      return Promise.resolve(null);
    }

    if (!dbPromise) {
      dbPromise = new Promise((resolve) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
              const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
              store.createIndex("email", "email", { unique: true });
            }
          };

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => {
            useFallbackStorage = true;
            resolve(null);
          };
        } catch (error) {
          useFallbackStorage = true;
          resolve(null);
        }
      });
    }

    return dbPromise;
  }

  async function getAllUsers() {
    const database = await openDatabase();
    if (!database) {
      return readFallbackUsers();
    }

    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      return await requestToPromise(store.getAll());
    } catch (error) {
      useFallbackStorage = true;
      return readFallbackUsers();
    }
  }

  async function getUserById(id) {
    if (!id) {
      return null;
    }

    const database = await openDatabase();
    if (!database) {
      return readFallbackUsers().find((user) => user.id === id) || null;
    }

    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      return (await requestToPromise(store.get(id))) || null;
    } catch (error) {
      useFallbackStorage = true;
      return readFallbackUsers().find((user) => user.id === id) || null;
    }
  }

  async function getUserByEmail(email) {
    if (!email) {
      return null;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const database = await openDatabase();
    if (!database) {
      return readFallbackUsers().find((user) => user.email === normalizedEmail) || null;
    }

    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("email");
      return (await requestToPromise(index.get(normalizedEmail))) || null;
    } catch (error) {
      useFallbackStorage = true;
      return readFallbackUsers().find((user) => user.email === normalizedEmail) || null;
    }
  }

  async function createUser(user) {
    const normalizedUser = {
      ...user,
      email: String(user.email).trim().toLowerCase(),
    };

    const database = await openDatabase();
    if (!database) {
      const users = readFallbackUsers();
      users.push(normalizedUser);
      writeFallbackUsers(users);
      return normalizedUser;
    }

    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      await requestToPromise(store.add(normalizedUser));
      return normalizedUser;
    } catch (error) {
      useFallbackStorage = true;
      const users = readFallbackUsers();
      users.push(normalizedUser);
      writeFallbackUsers(users);
      return normalizedUser;
    }
  }

  async function updateUser(user) {
    const normalizedUser = {
      ...user,
      email: String(user.email).trim().toLowerCase(),
    };

    const database = await openDatabase();
    if (!database) {
      const users = readFallbackUsers().map((entry) => (entry.id === normalizedUser.id ? normalizedUser : entry));
      writeFallbackUsers(users);
      return normalizedUser;
    }

    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      await requestToPromise(store.put(normalizedUser));
      return normalizedUser;
    } catch (error) {
      useFallbackStorage = true;
      const users = readFallbackUsers().map((entry) => (entry.id === normalizedUser.id ? normalizedUser : entry));
      writeFallbackUsers(users);
      return normalizedUser;
    }
  }

  function getSession() {
    return safeJsonParse(localStorage.getItem(SESSION_KEY), null);
  }

  function setSession(payload) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getAdminSession() {
    return safeJsonParse(localStorage.getItem(ADMIN_SESSION_KEY), null);
  }

  function setAdminSession(payload) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
  }

  function clearAdminSession() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function verifyAdminCredentials(login, password) {
    return (
      String(login || "").trim() === ADMIN_CREDENTIALS.login &&
      String(password || "") === ADMIN_CREDENTIALS.password
    );
  }

  function isAdminAuthenticated() {
    const session = getAdminSession();
    return Boolean(session?.login && session?.authorizedAt);
  }

  function mapLegacyModelToCatalogId(model, index, plan) {
    if (LEGACY_MODEL_MAP[model]) {
      return LEGACY_MODEL_MAP[model];
    }

    const preset = getPlanConfig(plan);
    if (preset.starterCatalogIds.length) {
      return preset.starterCatalogIds[index % preset.starterCatalogIds.length];
    }

    return EQUIPMENT_CATALOG[index % EQUIPMENT_CATALOG.length]?.id || null;
  }

  function createEquipmentInstance(catalogId, order, options = {}) {
    const timestamp = options.purchasedAtMs ?? Date.now();
    const label = options.label || `RIG-${String(order).padStart(3, "0")}`;
    const localSeed = seedFromString(`${catalogId}:${label}:${timestamp}`);
    const startedAtMs = options.startedAtMs ?? timestamp;
    const tariffMonthlyPercent =
      typeof options.tariffMonthlyPercent === "number"
        ? options.tariffMonthlyPercent
        : getTariffPlanConfig(options.tariffMonths)?.monthlyPercent;

    return {
      id: options.id || `eq_${catalogId}_${timestamp}_${Math.floor(seededValue(localSeed * 0.02, 100, 999, 0))}`,
      catalogId,
      label,
      purchasedAt: new Date(timestamp).toISOString(),
      startedAt: new Date(startedAtMs).toISOString(),
      source: options.source || "purchase",
      investedAmountUsd: options.investedAmountUsd,
      tariffMonths: options.tariffMonths,
      tariffMonthlyPercent,
    };
  }

  function createStarterState(profile) {
    const preset = getPlanConfig(profile.plan);

    return {
      dataVersion: DATA_VERSION,
      equipmentBalanceUsd: preset.equipmentBalanceUsd,
      equipmentInventory: [],
      purchaseHistory: [],
      createdMiningProfileAt: new Date().toISOString(),
    };
  }

  function normalizeEquipmentInventory(user) {
    const inventory = Array.isArray(user.equipmentInventory) ? user.equipmentInventory : null;
    if (inventory?.length) {
      return inventory
        .map((item, index) => {
          const catalogId = getCatalogById(item.catalogId)
            ? item.catalogId
            : mapLegacyModelToCatalogId(item.model, index, user.plan);
          const parsedPurchasedAtMs = item.purchasedAt ? Date.parse(item.purchasedAt) : NaN;
          const purchasedAtMs = Number.isFinite(parsedPurchasedAtMs)
            ? parsedPurchasedAtMs
            : Date.now() - (index + 14) * DAY_MS;
          const rawStartedAtMs = item.startedAt
            ? Date.parse(item.startedAt)
            : item.purchasedAt
              ? purchasedAtMs + 4 * HOUR_MS
              : Date.now() - (index + 13) * DAY_MS;
          const startedAtMs = Number.isFinite(rawStartedAtMs)
            ? Math.max(purchasedAtMs, rawStartedAtMs)
            : purchasedAtMs;

          return createEquipmentInstance(catalogId, index + 1, {
            ...item,
            label: item.label || item.name || `RIG-${String(index + 1).padStart(3, "0")}`,
            purchasedAtMs,
            startedAtMs,
            source: item.source || "purchase",
          });
        })
        .filter(Boolean);
    }

    const legacyMiners = Array.isArray(user.dashboard?.miners) ? user.dashboard.miners : [];
    if (legacyMiners.length) {
      return legacyMiners.map((item, index) => {
        const catalogId = mapLegacyModelToCatalogId(item.model, index, user.plan);
        const purchaseTimeMs = Date.now() - (index + 24) * DAY_MS;

        return createEquipmentInstance(catalogId, index + 1, {
          purchasedAtMs: purchaseTimeMs,
          startedAtMs: purchaseTimeMs + 6 * HOUR_MS,
          source: "migration",
        });
      });
    }

    return [];
  }

  function needsUserUpgrade(user) {
    return (
      !user ||
      user.dataVersion !== DATA_VERSION ||
      !Array.isArray(user.equipmentInventory) ||
      typeof user.equipmentBalanceUsd !== "number" ||
      !Array.isArray(user.purchaseHistory)
    );
  }

  function upgradeUserData(user) {
    if (!user) {
      return null;
    }

    const preset = getPlanConfig(user.plan);
    const starterState = createStarterState(user);

    return {
      ...user,
      dataVersion: DATA_VERSION,
      equipmentBalanceUsd:
        typeof user.equipmentBalanceUsd === "number" ? round(user.equipmentBalanceUsd, 2) : preset.equipmentBalanceUsd,
      equipmentInventory: normalizeEquipmentInventory(user),
      purchaseHistory: Array.isArray(user.purchaseHistory) ? user.purchaseHistory : starterState.purchaseHistory,
      createdMiningProfileAt: user.createdMiningProfileAt || user.createdAt || starterState.createdMiningProfileAt,
    };
  }

  function buildDeviceTelemetry(device, index, nowMs) {
    const catalog = getCatalogById(device.catalogId);
    if (!catalog) {
      return null;
    }

    const startedAtMs = Date.parse(device.startedAt || device.purchasedAt || new Date().toISOString());
    const runtimeHours = Math.max(0, (nowMs - startedAtMs) / HOUR_MS);
    const hourSeed = seedFromString(`${device.id}:${Math.floor(nowMs / HOUR_MS)}`);
    const statusRoll = seededValue(hourSeed * 0.011, 0, 1, 4);

    let status = { code: "online", label: "Онлайн", className: "is-online" };
    let load = seededValue(hourSeed * 0.013, 84, 98, 0);
    let performanceFactor = seededValue(hourSeed * 0.017, 0.94, 1.02, 3);
    let healthPercent = seededValue(hourSeed * 0.019, 97.2, 99.8, 1);

    if (statusRoll <= 0.09) {
      status = { code: "turbo", label: "Разгон", className: "is-turbo" };
      load = seededValue(hourSeed * 0.021, 96, 100, 0);
      performanceFactor = seededValue(hourSeed * 0.023, 1.02, 1.07, 3);
      healthPercent = seededValue(hourSeed * 0.025, 96.8, 99.4, 1);
    } else if (statusRoll >= 0.87 && statusRoll < 0.97) {
      status = { code: "cooling", label: "Охлаждение", className: "is-warning" };
      load = seededValue(hourSeed * 0.027, 58, 76, 0);
      performanceFactor = seededValue(hourSeed * 0.029, 0.72, 0.89, 3);
      healthPercent = seededValue(hourSeed * 0.031, 90.2, 96.4, 1);
    } else if (statusRoll >= 0.97) {
      status = { code: "service", label: "Сервис", className: "is-service" };
      load = seededValue(hourSeed * 0.033, 0, 12, 0);
      performanceFactor = 0;
      healthPercent = seededValue(hourSeed * 0.035, 68, 84, 1);
    }

    if (startedAtMs > nowMs) {
      status = { code: "pending", label: "Запуск", className: "is-warning" };
      load = 0;
      performanceFactor = 0;
      healthPercent = 100;
    }

    const actualDisplayHashrate = round(catalog.displayHashrateValue * performanceFactor, catalog.displayHashrateValue < 30 ? 2 : 1);
    const actualHashrateTh = round(catalog.normalizedHashrateTh * performanceFactor, 2);
    const powerKw = round(
      performanceFactor === 0
        ? catalog.powerKw * seededValue(hourSeed * 0.037, 0.08, 0.18, 3)
        : catalog.powerKw * (0.84 + load / 500),
      2
    );
    const coolingOffset = catalog.cooling === "Hydro" ? -8 : 0;
    const temperatureC = round(catalog.baseTemperatureC + coolingOffset + load / 8 + seededValue(hourSeed * 0.039, -1.6, 1.8, 2), 1);
    const tariffMonthlyPercent = getTariffMonthlyPercent(device);
    const tariffDailyRate = typeof tariffMonthlyPercent === "number" ? tariffMonthlyPercent / 100 / 30 : null;
    const tariffDailyRevenueUsd =
      typeof device.investedAmountUsd === "number" && tariffDailyRate !== null
        ? round(device.investedAmountUsd * tariffDailyRate * performanceFactor, 2)
        : null;
    const dailyRevenueUsd = tariffDailyRevenueUsd ?? round(catalog.dailyRevenueUsd * performanceFactor, 2);
    const lifetimeRevenueUsd = round(dailyRevenueUsd * (runtimeHours / 24), 2);

    return {
      id: device.id,
      name: device.label || `RIG-${String(index + 1).padStart(3, "0")}`,
      model: catalog.shortName,
      fullModel: catalog.name,
      algorithm: catalog.algorithm,
      status: status.label,
      statusClass: status.className,
      load,
      healthPercent,
      temperatureC,
      temperature: `${temperatureC.toFixed(1)} °C`,
      powerKw,
      startedAtMs,
      power: `${powerKw.toFixed(2)} kW`,
      displayHashrate: `${formatHashrateValue(actualDisplayHashrate)} ${catalog.displayHashrateUnit}`,
      actualHashrateTh,
      runtimeHours,
      runtime: formatDuration(runtimeHours),
      dailyRevenueUsd,
      lifetimeRevenueUsd,
      coinMix: catalog.coinMix,
      catalog,
      investedAmountUsd: device.investedAmountUsd,
      tariffMonths: device.tariffMonths,
      tariffMonthlyPercent,
    };
  }

  function buildTimeline(length, baseValue, seedKey, minFactor, maxFactor, digits = 2) {
    return Array.from({ length }, (_, index) => {
      if (baseValue <= 0) {
        return 0;
      }

      const seed = seedFromString(`${seedKey}:${index}`);
      return round(baseValue * seededValue(seed * 0.01, minFactor, maxFactor, 3), digits);
    });
  }

  function buildDailyLabels(length, nowMs) {
    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);

    return Array.from({ length }, (_, index) => {
      const date = new Date(todayStart.getTime() - (length - 1 - index) * DAY_MS);
      return formatDateLabel(date);
    });
  }

  function getCurrentPeriodStart(nowMs, unitMs) {
    const current = new Date(nowMs);
    if (unitMs === DAY_MS) {
      current.setHours(0, 0, 0, 0);
      return current.getTime();
    }

    if (unitMs === HOUR_MS) {
      current.setMinutes(0, 0, 0);
      return current.getTime();
    }

    return Math.floor(nowMs / unitMs) * unitMs;
  }

  function buildDeviceSeries(length, telemetry, nowMs, unitMs, valueGetter, seedKey, minFactor, maxFactor, digits = 2) {
    const currentStart = getCurrentPeriodStart(nowMs, unitMs);

    return Array.from({ length }, (_, index) => {
      const periodStart = currentStart - (length - 1 - index) * unitMs;
      const periodEnd = index === length - 1 ? nowMs : periodStart + unitMs;
      const periodMs = Math.max(1, periodEnd - periodStart);
      const value = telemetry.reduce((sum, item) => {
        if (!Number.isFinite(item.startedAtMs) || item.startedAtMs >= periodEnd) {
          return sum;
        }

        const activeMs = Math.max(0, periodEnd - Math.max(periodStart, item.startedAtMs));
        if (!activeMs) {
          return sum;
        }

        const seed = seedFromString(`${seedKey}:${item.id}:${periodStart}`);
        const factor = seededValue(seed * 0.01, minFactor, maxFactor, 3);
        return sum + valueGetter(item) * factor * Math.min(1, activeMs / periodMs);
      }, 0);

      return round(value, digits);
    });
  }

  function buildCoinDistribution(telemetry) {
    const totals = new Map();

    telemetry.forEach((device) => {
      device.coinMix.forEach((coin) => {
        const current = totals.get(coin.name) || { name: coin.name, color: coin.color, amountUsd: 0 };
        current.amountUsd += device.dailyRevenueUsd * (coin.share / 100);
        totals.set(coin.name, current);
      });
    });

    const totalRevenueUsd = Array.from(totals.values()).reduce((sum, item) => sum + item.amountUsd, 0);
    if (!totalRevenueUsd) {
      return [{ name: "Свободная мощность", value: 100, color: "#9aa8b6" }];
    }

    return Array.from(totals.values())
      .sort((left, right) => right.amountUsd - left.amountUsd)
      .map((item) => ({
        name: item.name,
        color: item.color,
        value: round((item.amountUsd / totalRevenueUsd) * 100, 1),
      }));
  }

  function buildPayouts(totalPaidUsd, nowMs) {
    if (totalPaidUsd <= 0) {
      return [];
    }

    const shares = [0.29, 0.23, 0.19, 0.16, 0.13];
    return shares.map((share, index) => {
      const payoutDate = new Date(nowMs - index * 2 * DAY_MS - 3 * HOUR_MS);
      const payoutBtc = round((totalPaidUsd * share) / BTC_USD_RATE, 8);

      return {
        coin: "BTC",
        date: new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(payoutDate),
        time: new Intl.DateTimeFormat("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(payoutDate),
        amount: `${payoutBtc.toFixed(8)} BTC`,
        status: "Успешно",
      };
    });
  }

  function buildCatalogView(user, telemetry, slots) {
    const ownedCount = telemetry.reduce((accumulator, item) => {
      accumulator[item.catalog.id] = (accumulator[item.catalog.id] || 0) + 1;
      return accumulator;
    }, {});
    const installedCount = telemetry.length;

    return EQUIPMENT_CATALOG.map((item) => {
      const canAfford = user.equipmentBalanceUsd >= item.priceUsd;
      const hasSlots = installedCount < slots;
      const canBuy = canAfford && hasSlots;

      return {
        ...item,
        ownedCount: ownedCount[item.id] || 0,
        displayHashrate: `${formatHashrateValue(item.displayHashrateValue)} ${item.displayHashrateUnit}`,
        monthlyRevenueUsd: round(item.dailyRevenueUsd * 30, 2),
        canBuy,
        disabledReason: hasSlots ? "Недостаточно средств" : "Слоты оборудования заполнены",
      };
    });
  }

  function buildDashboardData(user, options = {}) {
    const normalizedUser = upgradeUserData(user);
    const preset = getPlanConfig(normalizedUser.plan);
    const nowMs = Date.now();
    const rangeDays = normalizeRangeDays(typeof options === "number" ? options : options?.rangeDays);
    const telemetry = normalizedUser.equipmentInventory
      .map((device, index) => buildDeviceTelemetry(device, index, nowMs))
      .filter(Boolean)
      .map((item) => ({
        ...item,
        tariffDisplayMetrics: getTariffDisplayMetrics(item),
      }));
    const activeTelemetry = telemetry.filter((item) => (item.tariffDisplayMetrics?.hashrateTh ?? item.actualHashrateTh) > 0);
    const totalHashrateTh = round(
      activeTelemetry.reduce((sum, item) => sum + (item.tariffDisplayMetrics?.hashrateTh ?? item.actualHashrateTh), 0),
      2
    );
    const nominalHashrateTh = round(telemetry.reduce((sum, item) => sum + item.catalog.normalizedHashrateTh, 0), 2);
    const totalPowerKw = round(telemetry.reduce((sum, item) => sum + (item.tariffDisplayMetrics?.powerKw ?? item.powerKw), 0), 3);
    const hasActiveTariff = telemetry.length > 0;
    const averageTemperature = telemetry.length
      ? round(
          telemetry.reduce((sum, item) => sum + (item.tariffDisplayMetrics?.temperatureC ?? item.temperatureC), 0) /
            telemetry.length,
          1
        )
      : 0;
    const efficiency = nominalHashrateTh ? round((totalHashrateTh / nominalHashrateTh) * 100, 1) : 0;
    const uptimePercent = hasActiveTariff ? 100 : 0;
    const averageRuntimeHours = telemetry.length
      ? telemetry.reduce((sum, item) => sum + item.runtimeHours, 0) / telemetry.length
      : 0;
    const totalDailyRevenueUsd = round(activeTelemetry.reduce((sum, item) => sum + item.dailyRevenueUsd, 0), 2);
    const totalEarnedUsd = round(telemetry.reduce((sum, item) => sum + item.lifetimeRevenueUsd, 0), 2);
    const payoutRatio = seedFromString(`${normalizedUser.id}:payout`) % 2 === 0 ? 0.72 : 0.68;
    const totalPaidUsd = round(totalEarnedUsd * payoutRatio, 2);
    const miningBalanceUsd = round(totalEarnedUsd - totalPaidUsd, 2);
    const revenueWeek = buildDeviceSeries(
      rangeDays,
      telemetry,
      nowMs,
      DAY_MS,
      (item) => item.dailyRevenueUsd,
      `${normalizedUser.id}:revenue`,
      0.9,
      1.13,
      2
    );
    const hashrateIntraday = buildDeviceSeries(
      24,
      telemetry,
      nowMs,
      HOUR_MS,
      (item) => item.tariffDisplayMetrics?.hashrateTh ?? item.actualHashrateTh,
      `${normalizedUser.id}:intraday`,
      0.94,
      1.06,
      2
    );
    const hashrateWeek = buildDeviceSeries(
      rangeDays,
      telemetry,
      nowMs,
      DAY_MS,
      (item) => item.tariffDisplayMetrics?.hashrateTh ?? item.actualHashrateTh,
      `${normalizedUser.id}:hashrate`,
      0.91,
      1.08,
      2
    );
    const powerTimeline = buildTimeline(12, totalPowerKw, `${normalizedUser.id}:power`, 0.93, 1.07, 2);
    const balanceTimeline = buildTimeline(12, miningBalanceUsd, `${normalizedUser.id}:balance`, 0.9, 1.05, 2);
    const today = new Date(nowMs);
    const weekStart = new Date(nowMs - (rangeDays - 1) * DAY_MS);
    const timelineLabels = buildDailyLabels(rangeDays, nowMs);
    const nextPayoutSeconds = (() => {
      const originMs = Date.parse(normalizedUser.createdMiningProfileAt || normalizedUser.createdAt || new Date().toISOString());
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - originMs) / 1000));
      const remainder = elapsedSeconds % preset.payoutIntervalSeconds;
      return remainder === 0 ? preset.payoutIntervalSeconds : preset.payoutIntervalSeconds - remainder;
    })();

    return {
      planName: planLabel(normalizedUser.plan),
      periodLabel: formatDateRangeLabel(weekStart, today),
      totalHashratePh: round(totalHashrateTh / 1000, 2),
      totalHashrateTh,
      totalHashrateGh: Math.round(totalHashrateTh * 1000),
      totalHashrateLabel: hasActiveTariff
        ? `~${formatMetricValue(totalHashrateTh, totalHashrateTh < 10 ? 2 : 1)}ТН/s`
        : "~0,00ТН/s",
      totalHashrateMeta: hasActiveTariff
        ? `~${Math.round(totalHashrateTh * 1000).toLocaleString("ru-RU")} GH/s`
        : "~0 GH/s",
      activeMiners: activeTelemetry.length,
      installedMiners: telemetry.length,
      hasActiveTariff,
      minersCapacity: preset.slots,
      temperature: averageTemperature,
      temperatureLabel: hasActiveTariff ? `~${formatMetricValue(averageTemperature, 1)} °C` : "~0,0 °C",
      temperatureStatus: hasActiveTariff
        ? averageTemperature >= 66
          ? "Нагрузка"
          : averageTemperature >= 58
            ? "Стабильно"
            : "Норма"
        : "Нет тарифа",
      powerMw: round(totalPowerKw / 1000, 3),
      powerKw: totalPowerKw,
      powerLabel: hasActiveTariff ? `~${formatMetricValue(totalPowerKw, 3)}кВт` : "~0,000кВт",
      efficiency,
      uptimeLabel: formatDuration(averageRuntimeHours),
      uptimePercent,
      earnedBtc: round(totalEarnedUsd / BTC_USD_RATE, 8),
      paidBtc: round(totalPaidUsd / BTC_USD_RATE, 8),
      balanceBtc: round(miningBalanceUsd / BTC_USD_RATE, 8),
      earnedUsd: totalEarnedUsd,
      paidUsd: totalPaidUsd,
      balanceUsd: miningBalanceUsd,
      revenueWeek,
      hashrateIntraday,
      hashrateWeek,
      powerTimeline,
      balanceTimeline,
      rangeDays,
      coinDistribution: buildCoinDistribution(activeTelemetry),
      miners: telemetry.map((item) => {
        const tariffDisplayMetrics = item.tariffDisplayMetrics;
        const tariffTermPercent =
          typeof item.tariffMonthlyPercent === "number" && item.tariffMonths
            ? item.tariffMonthlyPercent * item.tariffMonths
            : null;
        const tariffRateLabel =
          typeof item.tariffMonthlyPercent === "number"
            ? ` · ${formatPercentValue(item.tariffMonthlyPercent)}%/мес.${
                typeof tariffTermPercent === "number" ? ` · ${formatPercentValue(tariffTermPercent)}% за срок` : ""
              }`
            : "";

        return {
          name: item.tariffMonths ? `Тариф ${item.tariffMonths} мес.` : item.name,
          model: item.tariffMonths
            ? `$${Math.round(Number(item.investedAmountUsd) || 0).toLocaleString("en-US")}${tariffRateLabel}`
            : item.fullModel,
          hashrate: tariffDisplayMetrics?.hashrate || item.displayHashrate,
          status: item.status,
          statusClass: item.statusClass,
          temperature: tariffDisplayMetrics?.temperature || item.temperature,
          load: item.load,
          power: tariffDisplayMetrics?.power || item.power,
          runtime: item.runtime,
          revenue: item.dailyRevenueUsd,
          tariffMonthlyPercent: item.tariffMonthlyPercent,
        };
      }),
      payouts: buildPayouts(totalPaidUsd, nowMs),
      nextPayoutSeconds,
      dailyRevenueUsd: totalDailyRevenueUsd,
      investmentBalanceUsd: round(normalizedUser.equipmentBalanceUsd, 2),
      installedSlotsLabel: String(telemetry.length),
      equipmentCatalog: buildCatalogView(normalizedUser, telemetry, preset.slots),
      revenueLabels: timelineLabels,
      hashrateLabels: timelineLabels,
      donutValue: round(totalEarnedUsd / BTC_USD_RATE, 8),
      hashrateDelta:
        hashrateWeek.length > 1 && hashrateWeek[0] > 0
          ? round(((hashrateWeek[hashrateWeek.length - 1] - hashrateWeek[0]) / hashrateWeek[0]) * 100, 1)
          : 0,
      powerDelta:
        powerTimeline.length > 1 && powerTimeline[0] > 0
          ? round(((powerTimeline[powerTimeline.length - 1] - powerTimeline[0]) / powerTimeline[0]) * 100, 1)
          : 0,
      revenueDelta:
        revenueWeek.length > 1 && revenueWeek[0] > 0
          ? round(((revenueWeek[revenueWeek.length - 1] - revenueWeek[0]) / revenueWeek[0]) * 100, 1)
          : 0,
    };
  }

  async function purchaseEquipment(userId, catalogId) {
    const catalog = getCatalogById(catalogId);
    if (!catalog) {
      throw new Error("EQUIPMENT_NOT_FOUND");
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedUser = upgradeUserData(user);
    const preset = getPlanConfig(normalizedUser.plan);
    if (normalizedUser.equipmentInventory.length >= preset.slots) {
      throw new Error("CAPACITY_REACHED");
    }

    if (normalizedUser.equipmentBalanceUsd < catalog.priceUsd) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const purchasedAtMs = Date.now();
    const nextOrder = normalizedUser.equipmentInventory.length + 1;
    const equipment = createEquipmentInstance(catalogId, nextOrder, {
      purchasedAtMs,
      startedAtMs: purchasedAtMs,
      source: "purchase",
    });

    const updatedUser = {
      ...normalizedUser,
      equipmentBalanceUsd: round(normalizedUser.equipmentBalanceUsd - catalog.priceUsd, 2),
      equipmentInventory: [...normalizedUser.equipmentInventory, equipment],
      purchaseHistory: [
        ...normalizedUser.purchaseHistory,
        {
          type: "purchase",
          catalogId,
          equipmentId: equipment.id,
          amountUsd: catalog.priceUsd,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return updateUser(updatedUser);
  }

  async function topUpEquipmentBalance(userId, amountUsd = 15000) {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedUser = upgradeUserData(user);
    const creditAmount = round(Math.max(0, Number(amountUsd) || 0), 2);
    if (!creditAmount) {
      throw new Error("INVALID_TOP_UP_AMOUNT");
    }

    const updatedUser = {
      ...normalizedUser,
      equipmentBalanceUsd: round(normalizedUser.equipmentBalanceUsd + creditAmount, 2),
      purchaseHistory: [
        ...normalizedUser.purchaseHistory,
        {
          type: "top-up",
          amountUsd: creditAmount,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return updateUser(updatedUser);
  }

  async function withdrawEquipmentBalance(userId, amountUsd) {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedUser = upgradeUserData(user);
    const debitAmount = round(Math.max(0, Number(amountUsd) || 0), 2);
    if (debitAmount < 10) {
      throw new Error("INVALID_WITHDRAW_AMOUNT");
    }

    if (normalizedUser.equipmentBalanceUsd < debitAmount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const updatedUser = {
      ...normalizedUser,
      equipmentBalanceUsd: round(normalizedUser.equipmentBalanceUsd - debitAmount, 2),
      purchaseHistory: [
        ...normalizedUser.purchaseHistory,
        {
          type: "withdraw",
          amountUsd: debitAmount,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return updateUser(updatedUser);
  }

  async function purchaseTariffPlan(userId, amountUsd, termMonths) {
    const amount = round(Math.max(0, Number(amountUsd) || 0), 2);
    const months = Number(termMonths);
    const tariffPlan = getTariffPlanConfig(months);

    if (amount < 10) {
      throw new Error("MINIMUM_TARIFF_AMOUNT");
    }

    if (!tariffPlan) {
      throw new Error("INVALID_TARIFF_TERM");
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedUser = upgradeUserData(user);
    const preset = getPlanConfig(normalizedUser.plan);

    if (normalizedUser.equipmentInventory.length >= preset.slots) {
      throw new Error("CAPACITY_REACHED");
    }

    if (normalizedUser.equipmentBalanceUsd < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const catalogId = amount >= 50000 ? "antminer-s21-hyd" : amount >= 25000 ? "antminer-l9" : "antminer-s21-pro";
    const purchasedAtMs = Date.now();
    const nextOrder = normalizedUser.equipmentInventory.length + 1;
    const tariff = createEquipmentInstance(catalogId, nextOrder, {
      purchasedAtMs,
      startedAtMs: purchasedAtMs,
      source: "tariff",
      label: `Тариф ${months} мес.`,
      investedAmountUsd: amount,
      tariffMonths: months,
      tariffMonthlyPercent: tariffPlan.monthlyPercent,
    });

    const updatedUser = {
      ...normalizedUser,
      equipmentBalanceUsd: round(normalizedUser.equipmentBalanceUsd - amount, 2),
      equipmentInventory: [...normalizedUser.equipmentInventory, tariff],
      purchaseHistory: [
        ...normalizedUser.purchaseHistory,
        {
          type: "tariff",
          amountUsd: amount,
          termMonths: months,
          monthlyPercent: tariffPlan.monthlyPercent,
          catalogId,
          equipmentId: tariff.id,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return updateUser(updatedUser);
  }

  window.MiningPowerDB = {
    buildDashboardData,
    clearAdminSession,
    clearSession,
    createStarterState,
    createSupportTicket,
    createUser,
    deleteSupportTicket,
    getAllUsers,
    getAdminSession,
    getContacts,
    getEquipmentCatalog: () => EQUIPMENT_CATALOG.map((item) => ({ ...item })),
    getFaqItems,
    getPlanConfigs,
    getSession,
    getSupportTickets,
    getTariffPlanConfig: (termMonths) => {
      const plan = getTariffPlanConfig(termMonths);
      return plan ? { ...plan } : null;
    },
    getTariffPlans: () => TARIFF_PLAN_TERMS.map((term) => ({ ...TARIFF_PLAN_CONFIG[term] })),
    getUserByEmail,
    getUserById,
    isAdminAuthenticated,
    needsUserUpgrade,
    planLabel,
    purchaseEquipment,
    purchaseTariffPlan,
    setAdminSession,
    saveFaqItems,
    saveContacts,
    savePlanConfigs,
    setSession,
    topUpEquipmentBalance,
    updateUser,
    upgradeUserData,
    verifyAdminCredentials,
    withdrawEquipmentBalance,
  };
})();
