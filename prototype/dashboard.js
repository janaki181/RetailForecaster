// AUTH PROTECT
if (!localStorage.getItem("rf_auth")) {
  window.location.href = "index.html";
}

// LOGOUT
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("rf_auth");
  window.location.href = "index.html";
};

// MOCK DATA
let products = JSON.parse(localStorage.getItem("products")) || [
  { name: "Rice", category: "Grocery", stock: 120 },
  { name: "Milk", category: "Dairy", stock: 20 },
  { name: "Soap", category: "Personal Care", stock: 8 },
  { name: "Bread", category: "Bakery", stock: 15 },
  { name: "Oil", category: "Grocery", stock: 60 },
  { name: "Sugar", category: "Grocery", stock: 5 }
];

let revenue = Number(localStorage.getItem("revenue")) || 42000;
let showAll = false;

const table = document.getElementById("productTable");
const revenueEl = document.getElementById("revenueValue");
const toggleAddProductBtn = document.getElementById("toggleAddProduct");
const addProductPanel = document.getElementById("addProductPanel");
const addProductForm = document.getElementById("addProductForm");

function getStatus(stock) {
  if (stock > 30) return "status-ok";
  if (stock > 10) return "status-low";
  return "status-critical";
}

function renderProducts() {
  table.innerHTML = "";
  (showAll ? products : products.slice(0,5)).forEach(p => {
    table.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.category || 'Misc'}</td>
        <td>${p.stock}</td>
        <td class="${getStatus(p.stock)}">${getStatus(p.stock).split('-')[1]}</td>
      </tr>`;
  });
}

document.getElementById("toggleProducts").onclick = function () {
  showAll = !showAll;
  this.textContent = showAll ? "Show Less" : "View All";
  renderProducts();
};

revenueEl.textContent = `₹ ${revenue}`;

// SALES UPDATE
document.getElementById("salesForm").onsubmit = e => {
  e.preventDefault();
  const [nameInput, qtyInput] = e.target.elements;
  const qty = Number(qtyInput.value);

  revenue += qty * 50;
  localStorage.setItem("revenue", revenue);
  revenueEl.textContent = `₹ ${revenue}`;

  e.target.reset();
};

// SAVE PRODUCTS
localStorage.setItem("products", JSON.stringify(products));
renderProducts();

// CHARTS
const revenueChart = new Chart(document.getElementById("revenueChart"), {
  type: "line",
  data: {
    labels: ["Mon","Tue","Wed","Thu","Fri","Sat"],
    datasets: [{
      data: [10,20,15,30,28,40],
      borderColor: "#4f46e5",
      tension: 0.4
    }]
  },
  options: { plugins: { legend: { display: false } } }
});

const productChart = new Chart(document.getElementById("productChart"), {
  type: "bar",
  data: {
    labels: products.slice(0,5).map(p => p.name),
    datasets: [{
      data: products.slice(0,5).map(p => p.stock),
      backgroundColor: "#4f46e5"
    }]
  },
  options: { plugins: { legend: { display: false } } }
});

// Add Product: toggle panel
if (toggleAddProductBtn && addProductPanel) {
  toggleAddProductBtn.onclick = () => {
    const isOpen = addProductPanel.classList.toggle('open');
    toggleAddProductBtn.textContent = isOpen ? 'Hide' : 'Add an extra product';
  };
}

// Add Product: submit handler
if (addProductForm) {
  addProductForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('addName').value.trim();
    const stock = Number(document.getElementById('addStock').value);
    const cost = Number(document.getElementById('addCost').value);
    if (!name || isNaN(stock) || isNaN(cost)) return;

    const newProduct = { name, category: 'Misc', stock, cost };
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    renderProducts();

    // Update product chart with latest top 5 by order of list
    if (productChart) {
      productChart.data.labels = products.slice(0,5).map(p => p.name);
      productChart.data.datasets[0].data = products.slice(0,5).map(p => p.stock);
      productChart.update();
    }

    // Reset form and collapse panel
    addProductForm.reset();
    addProductPanel.classList.remove('open');
    toggleAddProductBtn.textContent = 'Add an extra product';
  };
}
