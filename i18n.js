(function () {
  "use strict";

  const STORAGE_KEY = "mining-power-language";
  const supported = new Set(["ru", "en", "kk"]);
  const translations = {
    en: {
      "Язык": "Language", "Выбор языка": "Select language", "Главная": "Home", "О нас": "About us",
      "Оборудование": "Equipment", "Инвесторам": "Investors", "Контакты": "Contacts",
      "Личный кабинет": "Dashboard", "Вход / регистрация": "Sign in / Register", "На главную": "Home",
      "Клиентский вход": "Client login", "Открыть меню": "Open menu", "Закрыть меню": "Close menu",
      "Добываем будущее уже сегодня": "Mining the future today", "Майнинг фермы нового поколения": "Next-generation mining farms",
      "Профессиональный майнинг криптовалют на современных фермах с использованием возобновляемой энергии, прозрачной аналитики и автоматизированного оборудования.": "Professional cryptocurrency mining on modern farms powered by renewable energy, transparent analytics and automated equipment.",
      "Рассчитать доход": "Calculate return", "Узнать больше": "Learn more", "Поддерживаемые криптовалюты": "Supported cryptocurrencies",
      "Аптайм ферм": "Farm uptime", "Зеленая энергия": "Green energy", "Современное оборудование": "Modern equipment",
      "Прозрачность и отчетность": "Transparency and reporting", "Почему мы": "Why us", "Надежность. Опыт. Результат.": "Reliability. Experience. Results.",
      "Опытная команда специалистов": "Experienced team", "Собственные дата-центры": "Proprietary data centers",
      "Низкие затраты на электроэнергию": "Low electricity costs", "Ежедневные выплаты и контроль": "Daily payouts and control", "Поддержка 24/7": "24/7 support",
      "Площадка": "Site", "Казахстан": "Kazakhstan", "Туркестанская область": "Turkistan Region", "Инфраструктура": "Infrastructure",
      "Воздушные ASIC": "Air-cooled ASICs", "Гидро охлаждение": "Hydro cooling", "Алгоритмы": "Algorithms",
      "Рассчитайте свой доход": "Calculate your return", "Сумма инвестиций и тарифный план": "Investment amount and plan",
      "Сумма инвестиций": "Investment amount", "Тарифный план": "Investment plan", "Рассчитать": "Calculate",
      "Расчет дохода": "Return calculation", "За расчетное время": "For the selected term", "В год": "Per year", "В день": "Per day",
      "Тарифные планы": "Investment plans", "в месяц": "per month", "Начисление: ежедневно": "Accrual: daily", "Минимум: $10": "Minimum: $10",
      "Выбрать план": "Choose plan", "Часто задаваемые вопросы": "Frequently asked questions", "Навигация": "Navigation",
      "Регистрация": "Register", "Вход": "Sign in", "Ваше имя": "Your name", "Email": "Email", "Пароль": "Password",
      "Создать аккаунт": "Create account", "Войти": "Sign in", "Личный кабинет инвестора": "Investor dashboard",
      "Вход и регистрация на отдельной странице": "Sign in and register on a dedicated page", "Быстрый старт": "Quick start",
      "Локальная база": "Local database", "Привязка к данным": "Data integration", "Авторизация": "Authentication",
      "Административный доступ": "Administrative access", "Отдельный вход в админ-панель": "Dedicated admin panel login",
      "Закрытый доступ": "Restricted access", "Отдельная роль": "Separate role", "Быстрый переход": "Quick access",
      "Логин администратора": "Administrator login", "Войти в админ-панель": "Sign in to admin panel"
    },
    kk: {
      "Язык": "Тіл", "Выбор языка": "Тілді таңдау", "Главная": "Басты бет", "О нас": "Біз туралы",
      "Оборудование": "Жабдық", "Инвесторам": "Инвесторларға", "Контакты": "Байланыс",
      "Личный кабинет": "Жеке кабинет", "Вход / регистрация": "Кіру / Тіркелу", "На главную": "Басты бетке",
      "Клиентский вход": "Клиенттің кіруі", "Открыть меню": "Мәзірді ашу", "Закрыть меню": "Мәзірді жабу",
      "Добываем будущее уже сегодня": "Болашақты бүгіннен бастап өндіреміз", "Майнинг фермы нового поколения": "Жаңа буын майнинг фермалары",
      "Профессиональный майнинг криптовалют на современных фермах с использованием возобновляемой энергии, прозрачной аналитики и автоматизированного оборудования.": "Жаңартылатын энергияны, ашық аналитиканы және автоматтандырылған жабдықты қолданатын заманауи фермалардағы кәсіби криптовалюта майнингі.",
      "Рассчитать доход": "Табысты есептеу", "Узнать больше": "Толығырақ", "Поддерживаемые криптовалюты": "Қолдау көрсетілетін криптовалюталар",
      "Аптайм ферм": "Фермалардың жұмыс уақыты", "Зеленая энергия": "Жасыл энергия", "Современное оборудование": "Заманауи жабдық",
      "Прозрачность и отчетность": "Ашықтық және есептілік", "Почему мы": "Неліктен біз", "Надежность. Опыт. Результат.": "Сенімділік. Тәжірибе. Нәтиже.",
      "Опытная команда специалистов": "Тәжірибелі мамандар тобы", "Собственные дата-центры": "Меншікті деректер орталықтары",
      "Низкие затраты на электроэнергию": "Электр энергиясының төмен құны", "Ежедневные выплаты и контроль": "Күнделікті төлемдер және бақылау", "Поддержка 24/7": "Тәулік бойы қолдау",
      "Площадка": "Алаң", "Казахстан": "Қазақстан", "Туркестанская область": "Түркістан облысы", "Инфраструктура": "Инфрақұрылым",
      "Воздушные ASIC": "Ауамен салқындатылатын ASIC", "Гидро охлаждение": "Гидросалқындату", "Алгоритмы": "Алгоритмдер",
      "Рассчитайте свой доход": "Табысыңызды есептеңіз", "Сумма инвестиций и тарифный план": "Инвестиция сомасы және тарифтік жоспар",
      "Сумма инвестиций": "Инвестиция сомасы", "Тарифный план": "Тарифтік жоспар", "Рассчитать": "Есептеу",
      "Расчет дохода": "Табысты есептеу", "За расчетное время": "Таңдалған мерзім үшін", "В год": "Жылына", "В день": "Күніне",
      "Тарифные планы": "Тарифтік жоспарлар", "в месяц": "айына", "Начисление: ежедневно": "Есептеу: күн сайын", "Минимум: $10": "Минимум: $10",
      "Выбрать план": "Жоспарды таңдау", "Часто задаваемые вопросы": "Жиі қойылатын сұрақтар", "Навигация": "Навигация",
      "Регистрация": "Тіркелу", "Вход": "Кіру", "Ваше имя": "Атыңыз", "Email": "Email", "Пароль": "Құпиясөз",
      "Создать аккаунт": "Аккаунт жасау", "Войти": "Кіру", "Личный кабинет инвестора": "Инвестордың жеке кабинеті",
      "Вход и регистрация на отдельной странице": "Жеке бетте кіру және тіркелу", "Быстрый старт": "Жылдам бастау",
      "Локальная база": "Жергілікті дерекқор", "Привязка к данным": "Деректермен байланыстыру", "Авторизация": "Авторизация",
      "Административный доступ": "Әкімшілік қолжетімділік", "Отдельный вход в админ-панель": "Әкімшілік панельге бөлек кіру",
      "Закрытый доступ": "Жабық қолжетімділік", "Отдельная роль": "Бөлек рөл", "Быстрый переход": "Жылдам өту",
      "Логин администратора": "Әкімші логині", "Войти в админ-панель": "Әкімшілік панельге кіру"
    }
  };

  Object.assign(translations.en, {
    "Хотите попробовать майнинг, но нет возможности, дорогое оборудование, электричество или не хочется вникать в тонкости работы оборудования - мы предлагаем вам наше оборудование, наше обслуживание и нашу ответственность.": "Want to try mining without buying expensive equipment or managing electricity and maintenance? We provide the equipment, service and take full operational responsibility.",
    "Стабильная работа 24/7 без простоев": "Stable 24/7 operation without downtime",
    "Используем солнечные и ветровые источники": "Powered by solar and wind energy",
    "Только актуальные майнеры последнего поколения": "Only current-generation mining hardware",
    "Онлайн-мониторинг и ежедневные отчеты": "Online monitoring and daily reports",
    "Мы строим и управляем высокоэффективными майнинг-фермами, обеспечивая максимальную прибыль для частных и институциональных инвесторов.": "We build and operate high-performance mining farms designed to maximize returns for private and institutional investors.",
    "СЭС: 60 га": "Solar plant: 60 ha", "Выработка: 35 МВт": "Output: 35 MW", "Средняя цена: $0.01/кВт": "Average rate: $0.01/kWh",
    "Казахстан, Туркестанская область": "Kazakhstan, Turkistan Region",
    "Ферма размещена рядом с собственной солнечной электростанцией площадью около 60 гектаров с выработкой до 35 МВт.": "The farm is located next to its own 60-hectare solar power plant with output of up to 35 MW.",
    "Летом себестоимость энергии практически сводится к нулю": "In summer, energy costs are virtually zero",
    "Зимой энергия из сети в среднем около $0.02/кВт": "In winter, grid electricity averages about $0.02/kWh",
    "Среднегодовая расчетная цена электроэнергии: около $0.01/кВт": "Estimated annual average electricity rate: about $0.01/kWh",
    "Базовая линейка для надежной добычи на ликвидных алгоритмах при низкой цене энергии.": "Core hardware for reliable mining on liquid algorithms with low energy costs.",
    "Цена входа: около $5k-$7.5k за устройство": "Entry price: about $5k–$7.5k per unit", "Средний ориентир: около $5.75k в год на один майнер": "Average benchmark: about $5.75k a year per miner",
    "Решение для более плотного размещения и масштабирования под крупный чек инвестора.": "A high-density solution built to scale for larger investments.",
    "Цена оборудования: около $20k и $34k": "Equipment price: about $20k and $34k", "Ориентир по гидро-сегменту: доходность до 27.7% годовых": "Hydro segment benchmark: returns up to 27.7% per year",
    "Тарифная доходность от 5% до 9% в месяц в зависимости от срока": "Plan returns from 5% to 9% monthly depending on term",
    "Выберите срок 6, 9, 12, 18 или 24 месяца и рассчитайте ориентировочный доход в калькуляторе.": "Choose a 6, 9, 12, 18 or 24-month term and estimate your return with the calculator.",
    "SHA-256: Bitcoin и Bitcoin Cash, самый надежный и ликвидный сегмент": "SHA-256: Bitcoin and Bitcoin Cash, the most reliable and liquid segment",
    "Расчет ориентировочный: дневная доходность считается от месячного процента выбранного тарифного плана.": "This is an estimate: daily returns are calculated from the monthly rate of the selected plan.",
    "Как начать майнить с вами?": "How do I start mining with you?", "Какие криптовалюты вы добываете?": "Which cryptocurrencies do you mine?",
    "Как происходит выплата дохода?": "How are returns paid?", "Что входит в стоимость контракта?": "What is included in the contract?",
    "Укажите сумму инвестиций, выберите тарифный план и оставьте заявку. Менеджер поможет оформить договор.": "Enter an investment amount, choose a plan and submit a request. A manager will help arrange the contract.",
    "Основной фокус на BTC, LTC и инфраструктуре для стабильных PoW-активов с высокой ликвидностью.": "Our main focus is BTC, LTC and infrastructure for stable, highly liquid PoW assets.",
    "Выплаты можно получать в USDT, BTC или на банковские реквизиты по согласованному графику.": "Payouts are available in USDT, BTC or to bank details according to the agreed schedule.",
    "Включены размещение, обслуживание, мониторинг, доступ к кабинету и техническая поддержка.": "Hosting, maintenance, monitoring, dashboard access and technical support are included.",
    "Здесь пользователь создает аккаунт, входит в существующий профиль и получает доступ к панели управления фермой без смешивания с основным лендингом.": "Create an account or sign in to access the farm dashboard on a dedicated page.",
    "После регистрации пользователь сразу попадает в dashboard.": "After registration, the user goes directly to the dashboard.", "Телефон": "Phone",
    "Минимум 6 символов": "At least 6 characters", "Введите пароль": "Enter password", "Войти в кабинет": "Sign in to dashboard",
    "Неверный email или пароль.": "Incorrect email or password.", "Аккаунт создан. Открываем личный кабинет...": "Account created. Opening dashboard...",
    "Неверный логин администратора или пароль.": "Incorrect administrator login or password.", "Доступ подтверждён. Открываем админ-панель...": "Access confirmed. Opening admin panel..."
  });

  Object.assign(translations.kk, {
    "Хотите попробовать майнинг, но нет возможности, дорогое оборудование, электричество или не хочется вникать в тонкости работы оборудования - мы предлагаем вам наше оборудование, наше обслуживание и нашу ответственность.": "Қымбат жабдық сатып алмай және қызмет көрсетуге алаңдамай майнингті бастағыңыз келе ме? Біз жабдықты, қызмет көрсетуді және толық операциялық жауапкершілікті ұсынамыз.",
    "Стабильная работа 24/7 без простоев": "Тоқтаусыз тәулік бойы тұрақты жұмыс", "Используем солнечные и ветровые источники": "Күн және жел энергиясын қолданамыз",
    "Только актуальные майнеры последнего поколения": "Тек соңғы буындағы өзекті майнерлер", "Онлайн-мониторинг и ежедневные отчеты": "Онлайн-мониторинг және күнделікті есептер",
    "Мы строим и управляем высокоэффективными майнинг-фермами, обеспечивая максимальную прибыль для частных и институциональных инвесторов.": "Біз жеке және институционалдық инвесторлар үшін табысты арттыратын тиімді майнинг фермаларын саламыз және басқарамыз.",
    "СЭС: 60 га": "КЭС: 60 га", "Выработка: 35 МВт": "Өндіріс: 35 МВт", "Средняя цена: $0.01/кВт": "Орташа баға: $0.01/кВт·сағ", "Казахстан, Туркестанская область": "Қазақстан, Түркістан облысы",
    "Ферма размещена рядом с собственной солнечной электростанцией площадью около 60 гектаров с выработкой до 35 МВт.": "Ферма қуаты 35 МВт-қа дейінгі, аумағы шамамен 60 гектар меншікті күн электр станциясының жанында орналасқан.",
    "Летом себестоимость энергии практически сводится к нулю": "Жазда энергияның өзіндік құны нөлге жуықтайды", "Зимой энергия из сети в среднем около $0.02/кВт": "Қыста желіден алынатын энергия орта есеппен $0.02/кВт·сағ",
    "Среднегодовая расчетная цена электроэнергии: около $0.01/кВт": "Электр энергиясының есептік орташа жылдық бағасы: шамамен $0.01/кВт·сағ",
    "Базовая линейка для надежной добычи на ликвидных алгоритмах при низкой цене энергии.": "Энергия бағасы төмен болғанда өтімді алгоритмдерде сенімді өндіруге арналған негізгі желі.",
    "Цена входа: около $5k-$7.5k за устройство": "Бастапқы баға: бір құрылғыға шамамен $5k–$7.5k", "Средний ориентир: около $5.75k в год на один майнер": "Орташа көрсеткіш: бір майнерге жылына шамамен $5.75k",
    "Решение для более плотного размещения и масштабирования под крупный чек инвестора.": "Ірі инвестицияларға арналған тығыз орналастыру және масштабтау шешімі.",
    "Цена оборудования: около $20k и $34k": "Жабдық бағасы: шамамен $20k және $34k", "Ориентир по гидро-сегменту: доходность до 27.7% годовых": "Гидро сегмент көрсеткіші: жылына 27.7%-ға дейін",
    "Тарифная доходность от 5% до 9% в месяц в зависимости от срока": "Мерзімге қарай ай сайынғы тарифтік табыс 5%-дан 9%-ға дейін",
    "Выберите срок 6, 9, 12, 18 или 24 месяца и рассчитайте ориентировочный доход в калькуляторе.": "6, 9, 12, 18 немесе 24 ай мерзімін таңдап, калькуляторда болжамды табысты есептеңіз.",
    "SHA-256: Bitcoin и Bitcoin Cash, самый надежный и ликвидный сегмент": "SHA-256: Bitcoin және Bitcoin Cash — ең сенімді әрі өтімді сегмент",
    "Расчет ориентировочный: дневная доходность считается от месячного процента выбранного тарифного плана.": "Есеп болжамды: күндік табыс таңдалған жоспардың айлық пайызынан есептеледі.",
    "Как начать майнить с вами?": "Сіздермен майнингті қалай бастауға болады?", "Какие криптовалюты вы добываете?": "Қандай криптовалюталарды өндіресіздер?",
    "Как происходит выплата дохода?": "Табыс қалай төленеді?", "Что входит в стоимость контракта?": "Келісімшарт құнына не кіреді?",
    "Укажите сумму инвестиций, выберите тарифный план и оставьте заявку. Менеджер поможет оформить договор.": "Инвестиция сомасын көрсетіп, жоспарды таңдап, өтінім қалдырыңыз. Менеджер келісімшартты рәсімдеуге көмектеседі.",
    "Основной фокус на BTC, LTC и инфраструктуре для стабильных PoW-активов с высокой ликвидностью.": "Негізгі бағыт — BTC, LTC және өтімділігі жоғары тұрақты PoW активтерінің инфрақұрылымы.",
    "Выплаты можно получать в USDT, BTC или на банковские реквизиты по согласованному графику.": "Төлемдерді келісілген кесте бойынша USDT, BTC немесе банк деректемелеріне алуға болады.",
    "Включены размещение, обслуживание, мониторинг, доступ к кабинету и техническая поддержка.": "Орналастыру, қызмет көрсету, мониторинг, кабинетке қолжетімділік және техникалық қолдау кіреді.",
    "Здесь пользователь создает аккаунт, входит в существующий профиль и получает доступ к панели управления фермой без смешивания с основным лендингом.": "Бұл бетте пайдаланушы аккаунт жасап немесе профиліне кіріп, ферманы басқару панеліне қол жеткізеді.",
    "После регистрации пользователь сразу попадает в dashboard.": "Тіркелгеннен кейін пайдаланушы бірден басқару панеліне өтеді.", "Телефон": "Телефон",
    "Минимум 6 символов": "Кемінде 6 таңба", "Введите пароль": "Құпиясөзді енгізіңіз", "Войти в кабинет": "Кабинетке кіру",
    "Неверный email или пароль.": "Email немесе құпиясөз қате.", "Аккаунт создан. Открываем личный кабинет...": "Аккаунт жасалды. Жеке кабинет ашылуда...",
    "Неверный логин администратора или пароль.": "Әкімші логині немесе құпиясөзі қате.", "Доступ подтверждён. Открываем админ-панель...": "Қолжетімділік расталды. Әкімшілік панель ашылуда..."
  });

  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  function translateText(value, language) {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized || language === "ru") return value;
    const translated = translations[language]?.[normalized];
    if (!translated) return value;
    const leading = value.match(/^\s*/)?.[0] || "";
    const trailing = value.match(/\s*$/)?.[0] || "";
    return `${leading}${translated}${trailing}`;
  }

  function applyLanguage(language) {
    const lang = supported.has(language) ? language : "ru";
    document.documentElement.lang = lang;
    document.querySelectorAll("#site-language-select, [data-language-select]").forEach((select) => { select.value = lang; });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return /\S/.test(node.nodeValue) && !node.parentElement.closest("script, style")
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      node.nodeValue = translateText(originalText.get(node), lang);
    });

    document.querySelectorAll("[aria-label], [placeholder], [title]").forEach((element) => {
      if (!originalAttributes.has(element)) originalAttributes.set(element, {});
      const originals = originalAttributes.get(element);
      ["aria-label", "placeholder", "title"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
        element.setAttribute(attribute, translateText(originals[attribute], lang));
      });
    });
    window.dispatchEvent(new CustomEvent("miningpower:languagechange", { detail: { language: lang } }));
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const language = supported.has(saved) ? saved : "ru";
    applyLanguage(language);
    document.addEventListener("change", (event) => {
      if (!event.target.matches("#site-language-select, [data-language-select]")) return;
      localStorage.setItem(STORAGE_KEY, event.target.value);
      applyLanguage(event.target.value);
    });
    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.addedNodes.length || mutation.type === "characterData")) return;
      const active = document.documentElement.lang;
      if (active !== "ru") applyLanguage(active);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.MiningPowerI18n = { applyLanguage };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
