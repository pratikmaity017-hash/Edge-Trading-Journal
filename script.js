// ===== USER SYSTEM =====
let currentUser = localStorage.getItem("currentUser") || null;

function login() {
    const username = document.getElementById("username").value.trim();
    if (!username) return alert("Enter username");

    currentUser = username;
    localStorage.setItem("currentUser", username);

    initApp();
}

// ===== DATA STORAGE (PER USER) =====
function getTrades() {
    return JSON.parse(localStorage.getItem("trades_" + currentUser)) || [];
}

function saveTrades(trades) {
    localStorage.setItem("trades_" + currentUser, JSON.stringify(trades));
}

// ===== INIT =====
function initApp() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";

    loadApp();
}

// AUTO LOGIN
if (currentUser) initApp();

// ===== ADD TRADE =====
function addTrade() {
    const date = document.getElementById("date").value;
    const entry = +document.getElementById("entry").value;
    const exit = +document.getElementById("exit").value;
    const qty = +document.getElementById("qty").value;
    const notes = document.getElementById("notes").value;

    if (!date || !entry || !exit || !qty) {
        alert("Fill all required fields");
        return;
    }

    const pnl = (exit - entry) * qty;

    let trades = getTrades();

    trades.push({
        id: Date.now(),
        date,
        entry,
        exit,
        qty,
        pnl,
        notes
    });

    saveTrades(trades);
    loadApp();
}

// ===== DELETE TRADE =====
function deleteTrade(id) {
    let trades = getTrades().filter(t => t.id !== id);
    saveTrades(trades);
    loadApp();
}

// ===== LOAD APP =====
function loadApp() {
    renderTrades();
    calculatePNL();
    renderCalendar();
}

// ===== RENDER TRADES =====
function renderTrades() {
    const list = document.getElementById("tradeList");
    list.innerHTML = "";

    const trades = getTrades().reverse();

    trades.forEach(t => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <strong>${t.date}</strong><br>
            Entry: ${t.entry} | Exit: ${t.exit} | Qty: ${t.qty}<br>
            P&L: <span class="${t.pnl >= 0 ? 'profit' : 'loss'}">${t.pnl}</span><br>
            Notes: ${t.notes || "-"}<br>
            <button onclick="deleteTrade(${t.id})">Delete</button>
        `;

        list.appendChild(div);
    });
}

// ===== P&L CALCULATION =====
function calculatePNL() {
    const trades = getTrades();

    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    let daily = 0, monthly = 0, yearly = 0;

    trades.forEach(t => {
        if (t.date === today) daily += t.pnl;
        if (t.date.startsWith(month)) monthly += t.pnl;
        if (t.date.startsWith(year)) yearly += t.pnl;
    });

    document.getElementById("daily").innerText = daily;
    document.getElementById("monthly").innerText = monthly;
    document.getElementById("yearly").innerText = yearly;
}

// ===== ADVANCED CALENDAR =====
function renderCalendar() {
    const cal = document.getElementById("calendar");
    cal.innerHTML = "";

    const trades = getTrades();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // empty slots
    for (let i = 0; i < firstDay; i++) {
        cal.innerHTML += `<div></div>`;
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

        const dayPnl = trades
            .filter(t => t.date === dateStr)
            .reduce((sum, t) => sum + t.pnl, 0);

        const div = document.createElement("div");
        div.className = "day";

        div.innerHTML = `
            ${i}<br>
            <small>${dayPnl !== 0 ? dayPnl : ""}</small>
        `;

        if (dayPnl > 0) div.style.color = "#00c896";
        else if (dayPnl < 0) div.style.color = "#ff4d4f";

        cal.appendChild(div);
    }
}