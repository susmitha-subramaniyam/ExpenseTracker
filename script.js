
let transactions = [];

const STORAGE_KEY = "pennywiseTransactions";

let chart = null;

const form = document.getElementById("transactionForm");
const historyList = document.getElementById("history");

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

document.getElementById("today").innerText =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

document.getElementById("date").value =
    today.toISOString().slice(0, 10);


function money(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// Save transactions
function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
    );
}


// Load saved transactions
function loadData() {
    try {
        let savedData = localStorage.getItem(STORAGE_KEY);
        transactions = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(transactions)) {
            transactions = [];
        }
    } catch (error) {
        transactions = [];
    }
}


// Calculate totals
function calculateTotals() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function(transaction) {
        if (transaction.type === "income") {
            totalIncome += Number(transaction.amount);
        } else {
            totalExpense += Number(transaction.amount);
        }
    });

    document.getElementById("income").innerText =
        money(totalIncome);

    document.getElementById("expense").innerText =
        money(totalExpense);

    document.getElementById("balance").innerText =
        money(totalIncome - totalExpense);
}


// Add transaction
form.addEventListener("submit", function(event) {
    event.preventDefault();

    let title = document.getElementById("title").value.trim();
    let amount = Number(document.getElementById("amount").value);
    let type = document.getElementById("type").value;
    let category = document.getElementById("category").value;
    let date = document.getElementById("date").value;
    let note = document.getElementById("note").value.trim();

    if (title === "" || !Number.isFinite(amount) ||
        amount <= 0 || date === "") {
        document.getElementById("message").innerText =
            "Please enter valid transaction details.";
        return;
    }

    let transaction = {
        id: Date.now() + Math.random(),
        title: title,
        amount: amount,
        type: type,
        category: category,
        date: date,
        note: note
    };

    transactions.push(transaction);

    saveData();
    renderAll();

    document.getElementById("message").innerText =
        "Transaction added successfully!";

    form.reset();

    document.getElementById("date").value =
        today.toISOString().slice(0, 10);
});


// Display transactions
function showTransactions(){
    historyList.innerHTML = "";

    let search = document.getElementById("search")
        .value.trim().toLowerCase();

    let typeFilter = document.getElementById("typeFilter").value;
    let categoryFilter = document.getElementById("categoryFilter").value;

    let filteredTransactions = transactions.filter(function(transaction) {
        let matchesSearch =
            transaction.title.toLowerCase().includes(search) ||
            (transaction.note || "").toLowerCase().includes(search);

        let matchesType =
            typeFilter === "all" || transaction.type === typeFilter;

        let matchesCategory =
            categoryFilter === "all" ||
            transaction.category === categoryFilter;

        return matchesSearch && matchesType && matchesCategory;
    });

    filteredTransactions.sort(function(a, b) {
        return b.date.localeCompare(a.date);
    });

    document.getElementById("count").innerText =
        transactions.length + " transactions";

    document.getElementById("emptyState").style.display =
        filteredTransactions.length === 0 ? "block" : "none";

    filteredTransactions.forEach(function(transaction) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = transaction.title;

        if (transaction.note) {
            let note = document.createElement("small");
            note.innerText = transaction.note;
            note.style.display = "block";
            note.style.color = "#89958c";
            note.style.marginTop = "5px";
            nameCell.appendChild(note);
        }

        let categoryCell = document.createElement("td");
        categoryCell.innerText = transaction.category || "Other";

        let dateCell = document.createElement("td");
        dateCell.innerText = transaction.date;

        let typeCell = document.createElement("td");
        let typeLabel = document.createElement("span");
        typeLabel.className = transaction.type === "income"
            ? "type-label type-income"
            : "type-label type-expense";
        typeLabel.innerText = transaction.type;
        typeCell.appendChild(typeLabel);

        let amountCell = document.createElement("td");
        amountCell.className = transaction.type === "income"
            ? "amount-income"
            : "amount-expense";

        amountCell.innerText =
            (transaction.type === "income" ? "+ " : "- ") +
            money(transaction.amount);

        let actionCell = document.createElement("td");
        let deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.innerText = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);

        row.append(
            nameCell,
            categoryCell,
            dateCell,
            typeCell,
            amountCell,
            actionCell
        );

        historyList.appendChild(row);
    });
}
// Delete transaction
function deleteTransaction(id) {
    let confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }

    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    saveData();
    renderAll();
}


// Monthly expense chart
function showChart() {
    let monthlyExpenses = {};

    transactions.forEach(function(transaction) {
        if (transaction.type === "expense") {
            let category = transaction.category || "Other";

            if (!monthlyExpenses[category]) {
                monthlyExpenses[category] = 0;
            }

            monthlyExpenses[category] += Number(transaction.amount);
        }
    });

    let categories = Object.keys(monthlyExpenses);
    let amounts = Object.values(monthlyExpenses);

    document.getElementById("chartMessage").innerText =
        categories.length === 0
            ? "Add an expense to see your chart."
            : "";

    if (typeof Chart === "undefined") {
        return;
    }

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(document.getElementById("expenseChart"), {
        type: "doughnut",

        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    "#246b4a",
                    "#81b995",
                    "#f0c76e",
                    "#cc6259",
                    "#7899a5",
                    "#b8a0ca",
                    "#e4a66b",
                    "#9ca99f",
                    "#c2c9c2"
                ],
                borderWidth: 3,
                borderColor: "#ffffff"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// Update the whole dashboard
function renderAll() {
    calculateTotals();
    showTransactions();
    showChart();
}


// Search
document.getElementById("search").addEventListener("input", function() {
    showTransactions();
});


// Filters
document.getElementById("typeFilter").addEventListener("change", function() {
    showTransactions();
});

document.getElementById("categoryFilter").addEventListener("change", function() {
    showTransactions();
});


// Clear filters
document.getElementById("clearFilters").addEventListener("click", function() {
    document.getElementById("search").value = "";
    document.getElementById("typeFilter").value = "all";
    document.getElementById("categoryFilter").value = "all";

    showTransactions();
});


// Export transactions to CSV
document.getElementById("exportBtn").addEventListener("click", function() {
    if (transactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    let headers = ["Name", "Amount", "Type", "Category", "Date", "Note"];

    let rows = transactions.map(function(transaction) {
        return [
            transaction.title,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.date,
            transaction.note || ""
        ];
    });

    function escapeCSV(value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
    }

    let csv = [headers, ...rows]
        .map(function(row) {
            return row.map(escapeCSV).join(",");
        })
        .join("\r\n");

    let blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");

    link.href = url;
    link.download = "expense-tracker.csv";
    link.click();

    URL.revokeObjectURL(url);
});


// Start application
loadData();
renderAll();
