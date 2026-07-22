let users = [];
let sortState = { key: "date", direction: "desc" };
let financeSortState = { key: "deposit", direction: "desc" };
const $ = selector => document.querySelector(selector);
const money = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const planNames = { start: "Старт", optimal: "Оптимальный", pro: "Профессионал" };

function hashPassword(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) { hash = (hash << 5) - hash + input.charCodeAt(index); hash |= 0; }
  return `mp_${Math.abs(hash)}`;
}
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value ?? ""; return node.innerHTML; }
function escapeAttribute(value) { return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function userBalance(user) { return Number(user.equipmentBalanceUsd ?? user.deposit ?? 0); }
function userWithdrawal(user) { return Number(user.withdrawal ?? user.totalWithdrawnUsd ?? 0); }
function userDate(user) { return user.createdAt || user.date || new Date(0).toISOString(); }
function withdrawalItems(user) { const items=(user.purchaseHistory||[]).filter(item=>item.type==="withdraw").sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); return items.length ? items : (userWithdrawal(user)>0 ? [{amountUsd:userWithdrawal(user),createdAt:userDate(user)}] : []); }
function userDeposit(user) { const topUps=(user.purchaseHistory||[]).filter(item=>item.type==="top-up"); return topUps.length ? topUps.reduce((sum,item)=>sum+Number(item.amountUsd||0),0) : userBalance(user); }
function currentWithdrawal(user) { return Number(withdrawalItems(user)[0]?.amountUsd||0); }
function accountAgeDays(user) { const time=new Date(userDate(user)).getTime(); return Math.max(0,Math.floor((Date.now()-time)/86400000)); }
function accountAgeLabel(user) { const days=accountAgeDays(user); if(days<30)return `${days} дн.`; if(days<365)return `${Math.floor(days/30)} мес. ${days%30} дн.`; return `${Math.floor(days/365)} г. ${Math.floor(days%365/30)} мес.`; }
function dateLabel(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU"); }
function dateTime(value) { return new Date(value).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }); }
function showToast(text) { const toast = $("#toast"); toast.textContent = text; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }

function renderUsers() {
  const query = $("#searchInput").value.trim().toLocaleLowerCase("ru");
  const direction = sortState.direction === "asc" ? 1 : -1;
  const values = users.filter(user => `${user.name} ${user.email}`.toLocaleLowerCase("ru").includes(query)).sort((a, b) => {
    const getters = { name: u => u.name, email: u => u.email, date: u => new Date(userDate(u)).getTime(), deposit: userBalance, withdrawal: userWithdrawal, plan: u => planNames[u.plan] || "Старт" };
    const av = getters[sortState.key](a), bv = getters[sortState.key](b);
    return (typeof av === "number" ? av - bv : String(av).localeCompare(String(bv), "ru")) * direction;
  });
  $("#usersBody").innerHTML = values.length ? values.map(user => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${dateLabel(userDate(user))}</td><td>${money.format(userBalance(user))} $</td><td>${money.format(userWithdrawal(user))} $</td><td><span class="plan-badge">${planNames[user.plan] || "Старт"}</span></td><td><button class="edit-button" data-edit="${escapeHtml(user.id)}">Редактировать</button></td></tr>`).join("") : `<tr><td class="empty" colspan="7">Пользователи не найдены</td></tr>`;
  $("#totalText").textContent = query ? `Найдено пользователей: ${values.length}` : `Всего пользователей: ${users.length}`;
  document.querySelectorAll(".sortable").forEach(th => { th.classList.toggle("sorted", th.dataset.sort === sortState.key); th.dataset.direction = th.dataset.sort === sortState.key ? sortState.direction : ""; });
}

function openEdit(id) {
  const user = users.find(item => item.id === id); if (!user) return;
  const form = $("#editForm"); form.elements.id.value = user.id; form.elements.email.value = user.email; form.elements.balance.value = userBalance(user); form.elements.password.value = ""; form.elements.plan.value = user.plan || "start"; $("#editUserName").textContent = user.name; $("#editDialog").showModal();
}

function buildLogs() {
  const tickets = window.MiningPowerDB?.getSupportTickets?.() || [];
  const logs = users.flatMap(user => [
    { type: "account", date: userDate(user), title: "Регистрация пользователя", text: `${user.name} · ${user.email}` },
    ...(user.purchaseHistory || []).map(item => ({ type: "finance", date: item.createdAt, title: item.type === "tariff" ? "Подключение пакета" : "Покупка оборудования", text: `${user.name} · ${money.format(item.amountUsd || 0)} $` }))
  ]).concat(tickets.map(ticket => ({ type: "support", date: ticket.createdAt, title: "Создан тикет поддержки", text: `${ticket.name} · ${ticket.subject}` }))).sort((a,b) => new Date(b.date)-new Date(a.date));
  const query = $("#logSearch").value.toLocaleLowerCase("ru"), type = $("#logType").value;
  const filtered = logs.filter(log => (type === "all" || log.type === type) && `${log.title} ${log.text}`.toLocaleLowerCase("ru").includes(query));
  $("#logList").innerHTML = filtered.length ? filtered.map(log => `<article class="log-item"><span class="log-icon ${log.type}"></span><div><strong>${escapeHtml(log.title)}</strong><p>${escapeHtml(log.text)}</p></div><time>${dateTime(log.date)}</time></article>`).join("") : `<div class="empty-state">События не найдены</div>`;
}

function renderTickets() {
  const tickets = window.MiningPowerDB?.getSupportTickets?.() || [], query = $("#ticketSearch").value.toLocaleLowerCase("ru");
  const filtered = tickets.filter(t => `${t.name} ${t.email} ${t.subject} ${t.message}`.toLocaleLowerCase("ru").includes(query));
  $("#ticketCounter").textContent = `${tickets.length} ${tickets.length === 1 ? "тикет" : "тикетов"}`;
  $("#ticketList").innerHTML = filtered.length ? filtered.map(ticket => `<article class="ticket"><div class="ticket__top"><div><span class="ticket-id">#${escapeHtml(ticket.id.slice(-8))}</span><strong>${escapeHtml(ticket.subject)}</strong></div><time>${dateTime(ticket.createdAt)}</time></div><div class="ticket__author">${escapeHtml(ticket.name)} · <a href="mailto:${escapeHtml(ticket.email)}">${escapeHtml(ticket.email)}</a></div><p>${escapeHtml(ticket.message)}</p><div class="ticket__actions"><a class="primary small" href="mailto:${escapeHtml(ticket.email)}?subject=Re: ${encodeURIComponent(ticket.subject)}">Ответить</a><button class="secondary small" data-delete-ticket="${escapeHtml(ticket.id)}">Закрыть тикет</button></div></article>`).join("") : `<div class="empty-state">Новых тикетов нет</div>`;
}

function renderFinance() {
  const query=$("#financeSearch").value.trim().toLocaleLowerCase("ru"), direction=financeSortState.direction==="asc"?1:-1;
  const getters={name:u=>u.name,email:u=>u.email,age:accountAgeDays,deposit:userDeposit,current:currentWithdrawal,count:u=>withdrawalItems(u).length};
  const values=users.filter(user=>`${user.name} ${user.email}`.toLocaleLowerCase("ru").includes(query)).sort((a,b)=>{const av=getters[financeSortState.key](a),bv=getters[financeSortState.key](b);return(typeof av==="number"?av-bv:String(av).localeCompare(String(bv),"ru"))*direction;});
  $("#financeBody").innerHTML=values.length?values.map(user=>`<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${accountAgeLabel(user)}</td><td>${money.format(userDeposit(user))} $</td><td><strong class="current-payment">${money.format(currentWithdrawal(user))} $</strong></td><td>${withdrawalItems(user).length}</td></tr>`).join(""):`<tr><td class="empty" colspan="6">Пользователи не найдены</td></tr>`;
  $("#financeTotalText").textContent=query?`Найдено пользователей: ${values.length}`:`Всего пользователей: ${users.length}`;
  $("#totalDeposit").textContent=`${money.format(users.reduce((sum,user)=>sum+userDeposit(user),0))} $`;
  $("#totalWithdrawal").textContent=`${money.format(users.reduce((sum,user)=>sum+withdrawalItems(user).reduce((total,item)=>total+Number(item.amountUsd||0),0),0))} $`;
  document.querySelectorAll(".finance-sortable").forEach(th=>{th.classList.toggle("sorted",th.dataset.financeSort===financeSortState.key);th.dataset.direction=th.dataset.financeSort===financeSortState.key?financeSortState.direction:"";});
}

let faqItems = [];
let levelItems = [];
let contacts = {};

function renderSettings() {
  faqItems = window.MiningPowerDB?.getFaqItems?.() || [];
  levelItems = window.MiningPowerDB?.getPlanConfigs?.() || [];
  contacts = window.MiningPowerDB?.getContacts?.() || {};
  renderFaqEditor();
  renderLevelEditor();
  $("#contactEmail").value = contacts.email || "";
  $("#contactPhone").value = contacts.phone || "";
  $("#contactTelegram").value = contacts.telegram || "";
  $("#contactWhatsapp").value = contacts.whatsapp || "";
}

function renderFaqEditor() {
  $("#faqEditor").innerHTML = faqItems.length ? faqItems.map((item, index) => `<article class="faq-edit-item" data-faq-index="${index}"><label class="settings-field">Вопрос<input data-faq-field="question" value="${escapeAttribute(item.question)}" required></label><label class="settings-field">Ответ<textarea data-faq-field="answer" required>${escapeHtml(item.answer)}</textarea></label><button class="remove-faq" type="button" data-remove-faq="${index}" aria-label="Удалить вопрос">×</button></article>`).join("") : `<div class="empty-state">Добавьте первый вопрос</div>`;
}

function renderLevelEditor() {
  $("#levelEditor").innerHTML = levelItems.map((item, index) => `<article class="level-row" data-level-index="${index}"><label class="settings-field"><span class="level-id">${escapeHtml(item.id)}</span>Название уровня<input data-level-field="label" value="${escapeAttribute(item.label)}" required></label><label class="settings-field">Процент выплат, %<input data-level-field="payoutPercent" type="number" min="0" max="100" step="0.01" value="${Number(item.payoutPercent || 0)}" required></label></article>`).join("");
}

function collectSettings() {
  faqItems = [...document.querySelectorAll("[data-faq-index]")].map((row) => ({ id: faqItems[Number(row.dataset.faqIndex)]?.id || `faq-${Date.now()}-${row.dataset.faqIndex}`, question: row.querySelector('[data-faq-field="question"]').value.trim(), answer: row.querySelector('[data-faq-field="answer"]').value.trim() }));
  levelItems = [...document.querySelectorAll("[data-level-index]")].map((row) => { const original = levelItems[Number(row.dataset.levelIndex)]; return { ...original, label: row.querySelector('[data-level-field="label"]').value.trim(), payoutPercent: Number(row.querySelector('[data-level-field="payoutPercent"]').value) }; });
  contacts = { email: $("#contactEmail").value.trim(), phone: $("#contactPhone").value.trim(), telegram: $("#contactTelegram").value.trim(), whatsapp: $("#contactWhatsapp").value.trim() };
}

function switchView(view) {
  document.querySelectorAll(".users-view").forEach(el => el.hidden = view !== "users");
  $("#logsView").hidden = view !== "logs"; $("#supportView").hidden = view !== "support"; $("#financeView").hidden = view !== "finance"; $("#settingsView").hidden = view !== "settings"; $("#placeholderView").hidden = ["users","logs","support","finance","settings"].includes(view);
  if (!["users","logs","support","finance","settings"].includes(view)) $("#placeholderTitle").textContent = "Раздел";
  if (view === "logs") buildLogs(); if (view === "support") renderTickets(); if(view === "finance") renderFinance();
  if (view === "settings") renderSettings();
}

async function init() {
  (window.MiningPowerDB?.getPlanConfigs?.() || []).forEach(item => { planNames[item.id] = item.label; });
  const stored = await window.MiningPowerDB?.getAllUsers?.();
  users = stored?.length ? stored : [
    { id:"demo-1", name:"Иван Иванов", email:"ivan@example.com", createdAt:"2025-06-01", equipmentBalanceUsd:1200, withdrawal:200, plan:"optimal" },
    { id:"demo-2", name:"Мария Петрова", email:"maria@example.com", createdAt:"2025-06-02", equipmentBalanceUsd:850, withdrawal:150, plan:"start" },
    { id:"demo-3", name:"Алексей Смирнов", email:"alex@example.com", createdAt:"2025-06-03", equipmentBalanceUsd:500, withdrawal:0, plan:"pro" }
  ];
  renderUsers();
}

$("#searchInput").addEventListener("input", renderUsers);
document.querySelectorAll(".sortable").forEach(th => th.addEventListener("click", () => { sortState.direction = sortState.key === th.dataset.sort && sortState.direction === "asc" ? "desc" : "asc"; sortState.key = th.dataset.sort; renderUsers(); }));
$("#usersBody").addEventListener("click", e => { const button = e.target.closest("[data-edit]"); if (button) openEdit(button.dataset.edit); });
$("#updateButton").addEventListener("click", async event => { const form = $("#editForm"); if (!form.reportValidity()) { event.preventDefault(); return; } const user = users.find(item => item.id === form.elements.id.value); if (!user) return; user.email = form.elements.email.value.trim().toLowerCase(); user.equipmentBalanceUsd = Number(form.elements.balance.value); user.plan = form.elements.plan.value; if (form.elements.password.value) user.passwordHash = hashPassword(form.elements.password.value); if (!user.id.startsWith("demo-") && window.MiningPowerDB) await window.MiningPowerDB.updateUser(user); renderUsers(); showToast("Изменения сохранены"); });
$("#addButton").addEventListener("click", () => $("#userDialog").showModal());
$("#saveButton").addEventListener("click", async event => { const form=$("#userForm"); if(!form.reportValidity()){event.preventDefault();return;} const data=new FormData(form), starter=window.MiningPowerDB?.createStarterState?.({name:data.get("name"),email:data.get("email")})||{}, user={...starter,id:`user_${Date.now()}`,name:data.get("name"),email:data.get("email"),createdAt:new Date().toISOString(),equipmentBalanceUsd:Number(data.get("deposit")),withdrawal:Number(data.get("withdrawal")),plan:"start",passwordHash:hashPassword("123456")}; await window.MiningPowerDB?.createUser?.(user); users.unshift(user); renderUsers(); form.reset(); showToast("Пользователь добавлен"); });
$("#logSearch").addEventListener("input", buildLogs); $("#logType").addEventListener("change", buildLogs); $("#refreshLogs").addEventListener("click", buildLogs); $("#ticketSearch").addEventListener("input", renderTickets);
$("#financeSearch").addEventListener("input",renderFinance); document.querySelectorAll(".finance-sortable").forEach(th=>th.addEventListener("click",()=>{financeSortState.direction=financeSortState.key===th.dataset.financeSort&&financeSortState.direction==="asc"?"desc":"asc";financeSortState.key=th.dataset.financeSort;renderFinance();}));
$("#ticketList").addEventListener("click", e => { const button=e.target.closest("[data-delete-ticket]"); if(button && confirm("Закрыть и удалить этот тикет?")){window.MiningPowerDB.deleteSupportTicket(button.dataset.deleteTicket);renderTickets();showToast("Тикет закрыт");} });
$("#addFaq").addEventListener("click", () => { collectSettings(); faqItems.push({ id: `faq-${Date.now()}`, question: "", answer: "" }); renderFaqEditor(); });
$("#faqEditor").addEventListener("click", event => { const button = event.target.closest("[data-remove-faq]"); if (!button) return; collectSettings(); faqItems.splice(Number(button.dataset.removeFaq), 1); renderFaqEditor(); });
$("#saveSettings").addEventListener("click", () => { collectSettings(); const invalidFaq = faqItems.some(item => !item.question || !item.answer); const invalidLevel = levelItems.some(item => !item.label || !Number.isFinite(item.payoutPercent) || item.payoutPercent < 0 || item.payoutPercent > 100); const invalidContacts = !contacts.email || !contacts.phone || !contacts.telegram || !contacts.whatsapp || Boolean($("#contactsEditor").querySelector("input:invalid")); if (invalidFaq || invalidLevel || invalidContacts) { showToast("Заполните все поля корректно"); return; } faqItems = window.MiningPowerDB.saveFaqItems(faqItems); levelItems = window.MiningPowerDB.savePlanConfigs(levelItems); contacts = window.MiningPowerDB.saveContacts(contacts); levelItems.forEach(item => { planNames[item.id] = item.label; }); renderSettings(); renderUsers(); showToast("Настройки сохранены"); });
document.querySelectorAll(".nav__item").forEach(item => item.addEventListener("click", event => { event.preventDefault(); document.querySelector(".nav__item.active")?.classList.remove("active"); item.classList.add("active"); switchView(item.getAttribute("href").slice(1)); if(innerWidth<=760) toggleMenu(); }));
const app=$("#app"); function toggleMenu(){if(innerWidth<=760)app.classList.toggle("mobile-open");else app.classList.toggle("collapsed");} $("#menuButton").addEventListener("click",toggleMenu);$("#overlay").addEventListener("click",toggleMenu);
$("#logout").addEventListener("click",()=>{window.MiningPowerDB?.clearAdminSession?.();location.href="admin-login.html";});
init();
