document.addEventListener("DOMContentLoaded", () => {

    // LOGIN
    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) {
        loginBtn.onclick = () => {

            const pass = document.getElementById("loginPassword").value;

            if (pass === "8691") {

                document.getElementById("loginPage").style.display = "none";
                document.getElementById("app").style.display = "flex";

                render();

            } else {

                document.getElementById("loginError").textContent = "";

            }
        };
    }

    // TRANSACTION FORM
    const form = document.getElementById("transactionForm");

    if (form) {
        form.onsubmit = e => {

            e.preventDefault();

            const type = document.getElementById("type").value;
            const description = document.getElementById("description").value;
            const amount = Number(document.getElementById("amount").value);

            const carbon = amount * 0.02;

            const item = {
                type,
                description,
                amount,
                carbon,
                date: new Date()
            };

            if (editIndex === null) {
                transactions.push(item);
            } else {
                transactions[editIndex] = item;
                editIndex = null;
            }

            localStorage.setItem("manduloTransactions", JSON.stringify(transactions));

            form.reset();

            render();
        };
    }

});


// SIDEBAR
function showTab(id, el) {

    document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));

    document.getElementById(id).classList.remove("hidden");

    document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));

    if (el) el.classList.add("active");
}


// DATA STORAGE
let transactions = JSON.parse(localStorage.getItem("manduloTransactions")) || [];
let editIndex = null;


// RENDER DASHBOARD
function render() {

    let income = 0;
    let expenses = 0;
    let carbonTotal = 0;

    const table = document.getElementById("transactionTable");

    if (!table) return;

    table.innerHTML = "";

    transactions.forEach((t, i) => {

        if (t.type === "income") income += t.amount;
        else expenses += t.amount;

        carbonTotal += t.carbon;

        table.innerHTML += `
        <tr>
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td>${t.type}</td>
            <td>${t.description}</td>
            <td>E${t.amount}</td>
            <td>${t.carbon.toFixed(2)} kg</td>
            <td>
                <button onclick="editTransaction(${i})">✏️</button>
                <button onclick="deleteTransaction(${i})">🗑️</button>
            </td>
        </tr>
        `;
    });

    function renderFiltered(list) {
    const table = document.getElementById("transactionTable");
    table.innerHTML = "";

    let income = 0, expenses = 0, carbonTotal = 0;

    list.forEach((t, i) => {
        if (t.type === "income") income += t.amount;
        else expenses += t.amount;

        carbonTotal += t.carbon;

        table.innerHTML += `
        <tr>
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td>${t.type}</td>
            <td>${t.description}</td>
            <td>E${t.amount}</td>
            <td>${t.carbon.toFixed(2)} kg</td>
            <td>
                <button onclick="editTransaction(${i})">✏️</button>
                <button onclick="deleteTransaction(${i})">🗑️</button>
            </td>
        </tr>
        `;
    });

    // Update dashboard numbers based on filtered list
    updateValue("income", income);
    updateValue("expenses", expenses);
    updateValue("profit", income - expenses);

    // Update carbon offset
    document.getElementById("carbonTotal").textContent = carbonTotal.toFixed(2) + " kg";
    document.getElementById("treesNeeded").textContent = Math.ceil(carbonTotal / 21);

    drawChart();
}


    // LIVE ACTIVITY
    const feed = document.getElementById("activityFeed");

    if (feed) {

        feed.innerHTML = "";

        transactions.slice(-5).reverse().forEach(t => {

            const symbol = t.type === "income" ? "💰" : "💸";

            feed.innerHTML += `
            <li>
            ${symbol} ${t.description} — E${t.amount}
            <small>(${new Date(t.date).toLocaleTimeString()})</small>
            </li>
            `;
        });

    }


    // DASHBOARD VALUES
    updateValue("income", income.toFixed(2));
    updateValue("expenses", expenses.toFixed(2));
    updateValue("profit", (income - expenses).toFixed(2));


    // CARBON TRACKING
    const carbonTotalEl = document.getElementById("carbonTotal");

    if (carbonTotalEl)
        carbonTotalEl.textContent = carbonTotal.toFixed(2) + " kg";


    const trees = Math.ceil(carbonTotal / 21);

    const treesEl = document.getElementById("treesNeeded");

    if (treesEl)
        treesEl.textContent = trees;


    let status = "";
    let advice = "";

    if (carbonTotal < 50) {
        status = "Excellent 🌱";
        advice = "Low emissions. Keep it up.";
    }
    else if (carbonTotal < 150) {
        status = "Moderate ⚠";
        advice = "Reduce transport or packaging.";
    }
    else {
        status = "High Impact 🚨";
        advice = "Consider carbon offset strategies.";
    }

    const statusEl = document.getElementById("carbonStatus");
    const adviceEl = document.getElementById("carbonAdvice");

    if (statusEl) statusEl.textContent = status;
    if (adviceEl) adviceEl.textContent = advice;


    drawChart();
}


// UPDATE NUMBERS
function updateValue(id, value) {

    const el = document.getElementById(id);

    if (el) el.textContent = "E" + value;

}


// EDIT
function editTransaction(i) {

    const t = transactions[i];

    document.getElementById("type").value = t.type;
    document.getElementById("description").value = t.description;
    document.getElementById("amount").value = t.amount;

    editIndex = i;
}


// DELETE
function deleteTransaction(i) {

    transactions.splice(i, 1);

    localStorage.setItem("manduloTransactions", JSON.stringify(transactions));

    render();
}


// CHARTS
let financeChart;
let profitChart;

function drawChart() {

    const weeklyExpenses = [0,0,0,0,0,0,0];
    const weeklyIncome = [0,0,0,0,0,0,0];
    const weeklyProfit = [0,0,0,0,0,0,0];

    transactions.forEach(t => {

        const day = new Date(t.date).getDay();

        if (t.type === "expense")
            weeklyExpenses[day] += t.amount;

        if (t.type === "income")
            weeklyIncome[day] += t.amount;

    });

    for (let i = 0; i < 7; i++) {
        weeklyProfit[i] = weeklyIncome[i] - weeklyExpenses[i];
    }

    if (financeChart) financeChart.destroy();
    if (profitChart) profitChart.destroy();


    const profitCanvas = document.getElementById("profitChart");
    const financeCanvas = document.getElementById("financeChart");


    if (profitCanvas) {

        profitChart = new Chart(profitCanvas, {

            type: "line",

            data: {

                labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],

                datasets: [

                    {
                        label: "Profit (E)",
                        data: weeklyProfit,
                        borderColor: "#00e5ff",
                        backgroundColor: "rgba(0,229,255,0.2)",
                        tension: 0.4,
                        fill: true
                    },

                    {
                        label: "Expenses (E)",
                        data: weeklyExpenses,
                        borderColor: "#ff9800",
                        backgroundColor: "rgba(214, 208, 16, 0.2)",
                        tension: 0.4,
                        fill: false
                    },

                    {   label: "Income (E)",
                        data: weeklyIncome,
                        borderColor: "#18ec7e",
                        backgroundColor:"hsla(146, 62%, 16%, 0.75)",
                        tension: 0.4,
                        fill: false

                    }

                ]

            }

        });

    }


    if (financeCanvas) {

        financeChart = new Chart(financeCanvas, {

            type: "bar",

            data: {

                labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],

                datasets: [

                    {
                        label: "Income (E)",
                        data: weeklyIncome,
                        backgroundColor: "#4CAF50"
                    },

                    {
                        label: "Expenses (E)",
                        data: weeklyExpenses,
                        backgroundColor: "#ff9800"
                    }

                ]

            }

        });

    }

}


// DOWNLOAD REPORT
function downloadReport() {

    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    // HEADER (each column)
    let csv = "Date;Type;Description;Amount (E);Carbon (kg)\n";

    transactions.forEach(t => {

        const date = new Date(t.date).toLocaleDateString();

        csv += `${date};${t.type};${t.description};${t.amount};${t.carbon.toFixed(2)}\n`;

    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "mandulo_peanuts_report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}

function applyFilters() {
    const desc = document.getElementById("searchDesc").value.toLowerCase();
    const type = document.getElementById("filterType").value;
    const date = document.getElementById("filterDate").value;

    const filtered = transactions.filter(t => {
        const matchesDesc = t.description.toLowerCase().includes(desc);
        const matchesType = type === "" || t.type === type;
        const matchesDate = date === "" || new Date(t.date).toLocaleDateString() === new Date(date).toLocaleDateString();
        return matchesDesc && matchesType && matchesDate;
    });

    renderFiltered(filtered);
}

function clearFilters() {
    document.getElementById("searchDesc").value = "";
    document.getElementById("filterType").value = "";
    document.getElementById("filterDate").value = "";
    render(); // Show all transactions again
}