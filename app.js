// Replace with your Supabase URL & ANON KEY
const supabaseUrl = 'https://iqgckedxoflhxgxmenwq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2NrZWR4b2ZsaHhneG1lbndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTUxMTAsImV4cCI6MjA4OTI3MTExMH0.OLkQPZ-PxPMHdDwkqcF6YVI4u5gyllokgvyRoq6PBXg';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

// Login / Register
const loginBtn = document.getElementById('loginBtn');
const guestBtn = document.getElementById('guestBtn');

if(loginBtn){
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        if(email || phone){
            const { data, error } = await supabase.auth.signUp({
                email: email || undefined,
                phone: phone || undefined,
                password: password
            });
            if(error) {
                document.getElementById('message').innerText = error.message;
            } else {
                currentUser = data.user;
                window.location.href = 'dashboard.html';
            }
        }
    });
}

if(guestBtn){
    guestBtn.addEventListener('click', async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'guest@example.com',
            password: 'guest123'
        });
        if(error) console.log(error);
        else {
            currentUser = data.user;
            window.location.href = 'dashboard.html';
        }
    });
}

// Dashboard logic
if(window.location.pathname.includes('dashboard.html')){
    supabase.auth.getUser().then(({ data }) => {
        currentUser = data.user;
        loadTrades();
    });

    const addBtn = document.getElementById('addTradeBtn');
    addBtn.addEventListener('click', addTrade);

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

async function addTrade(){
    const date = document.getElementById('tradeDate').value;
    const entry = parseFloat(document.getElementById('entryPrice').value);
    const exit = parseFloat(document.getElementById('exitPrice').value);
    const notes = document.getElementById('notes').value;
    const profit_loss = exit - entry;

    await supabase.from('trades').insert([{
        user_id: currentUser.id,
        trade_date: date,
        entry_price: entry,
        exit_price: exit,
        profit_loss: profit_loss,
        notes: notes
    }]);
    loadTrades();
}

async function loadTrades(){
    const { data: trades, error } = await supabase.from('trades').select('*').eq('user_id', currentUser.id);
    const tbody = document.querySelector('#tradesTable tbody');
    tbody.innerHTML = '';
    trades.forEach(trade => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trade.trade_date}</td>
            <td>${trade.entry_price}</td>
            <td>${trade.exit_price}</td>
            <td>${trade.profit_loss}</td>
            <td>${trade.notes}</td>
            <td><button onclick="deleteTrade('${trade.id}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    renderCharts(trades);
}

async function deleteTrade(id){
    await supabase.from('trades').delete().eq('id', id);
    loadTrades();
}

// Charts
function renderCharts(trades){
    const profitCtx = document.getElementById('profitChart').getContext('2d');
    const winCtx = document.getElementById('winRateChart').getContext('2d');

    const labels = trades.map(t => t.trade_date);
    const profits = trades.map(t => t.profit_loss);
    const wins = trades.filter(t => t.profit_loss > 0).length;
    const losses = trades.filter(t => t.profit_loss <= 0).length;

    new Chart(profitCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit / Loss',
                data: profits,
                backgroundColor: '#1e88e5'
            }]
        }
    });

    new Chart(winCtx, {
        type: 'pie',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ['#43a047','#e53935']
            }]
        }
    });
}