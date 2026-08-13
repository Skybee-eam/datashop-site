const API_URL = '/api';
let user = JSON.parse(localStorage.getItem('datashop_user') || 'null');

if (!user) {
  window.location.href = 'login.html';
}

// Set up UI with user info
document.addEventListener('DOMContentLoaded', () => {
  const dashSidebar = document.getElementById('dashSidebar');
  const dashMobileToggle = document.getElementById('dashMobileToggle');

  if (dashMobileToggle && dashSidebar) {
    dashMobileToggle.addEventListener('click', () => {
      dashSidebar.classList.toggle('open');
    });
  }
  
  // Display name if element exists (optional)
  const profileName = document.querySelector('.user-header span:last-child');
  if (profileName) {
      // profileName.textContent = user.name;
  }
});

let bundles = {};
let userWallet = user.wallet_balance || 0;

// DOM Elements
const networkSelect = document.getElementById('dashNetwork');
const bundleSelect = document.getElementById('dashBundle');
const priceDisplay = document.getElementById('dashPrice');
const walletBalanceElem = document.getElementById('walletBalance');

// Fetch Initial Data
async function initDashboard() {
  await fetchWallet();
  await fetchBundles();
  await fetchTransactions();
  
  // Check if pending bundle exists from earlier buy attempt
  const pending = localStorage.getItem('pendingBundle');
  if (pending) {
    try {
      const b = JSON.parse(pending);
      if (b.network && networkSelect) {
        networkSelect.value = b.network;
        updateBundleSelect();
      }
      localStorage.removeItem('pendingBundle');
    } catch(err) {}
  }
}

async function fetchWallet() {
  try {
    const res = await fetch(`${API_URL}/user/${user.id}/wallet`);
    const data = await res.json();
    if (data.balance !== undefined) {
      userWallet = data.balance;
      if (walletBalanceElem) walletBalanceElem.textContent = `GH₵${userWallet.toFixed(2)}`;
    }
  } catch(e) { console.error('Failed to fetch wallet', e); }
}

async function fetchBundles() {
  try {
    const res = await fetch(`${API_URL}/bundles`);
    bundles = await res.json();
    updateBundleSelect();
  } catch(e) { console.error('Failed to fetch bundles', e); }
}

function updateBundleSelect() {
  const net = networkSelect.value;
  const list = bundles[net] || [];
  
  bundleSelect.innerHTML = '';
  list.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.price;
    opt.dataset.size = b.size;
    opt.textContent = `${b.size} — GH₵${b.price}`;
    bundleSelect.appendChild(opt);
  });
  
  updatePrice();
}

function updatePrice() {
  const price = bundleSelect.value || 0;
  if (priceDisplay) {
    priceDisplay.textContent = `GH₵${price}`;
  }
}

if (networkSelect) networkSelect.addEventListener('change', updateBundleSelect);
if (bundleSelect) bundleSelect.addEventListener('change', updatePrice);

// Transaction History
async function fetchTransactions() {
  try {
    const res = await fetch(`${API_URL}/transactions/${user.id}`);
    const data = await res.json();
    const tbody = document.getElementById('userTxnBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    data.forEach(txn => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${txn.network} ${txn.bundle_size}</td>
        <td>${txn.recipient_phone}</td>
        <td>GH₵${txn.price}</td>
        <td><span class="status-badge status-success">${txn.status}</span></td>
        <td>${new Date(txn.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) { console.error('Failed to load transactions', e); }
}

// Quick Buy Submit
async function processQuickBuy(e) {
  e.preventDefault();
  const phone = document.getElementById('dashPhone').value;
  const net = networkSelect.value;
  const selectedOpt = bundleSelect.options[bundleSelect.selectedIndex];
  const size = selectedOpt ? selectedOpt.dataset.size : '';
  const price = Number(bundleSelect.value);

  if (userWallet < price) {
    alert('Insufficient wallet balance! Please top up your wallet first.');
    openFundModal();
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, network: net, size: size, phone: phone, price: price })
    });
    const data = await res.json();
    
    if (data.success) {
      alert(`Success! ${size} ${net} Data sent to ${phone}.`);
      await fetchWallet();
      await fetchTransactions();
    } else {
      alert(data.error || 'Transaction failed');
    }
  } catch (err) {
    alert('Network error during purchase');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Instant Purchase';
  }
}

// Modal Logic
function openFundModal() {
  document.getElementById('fundModal').classList.add('active');
}

function closeFundModal() {
  document.getElementById('fundModal').classList.remove('active');
}

async function processTopup(e) {
  e.preventDefault();
  const amount = Number(document.getElementById('topupAmount').value);
  if (amount <= 0) return;
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const res = await fetch(`${API_URL}/user/${user.id}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Wallet successfully funded with GH₵${amount}!`);
      await fetchWallet();
      closeFundModal();
      document.getElementById('topupAmount').value = '';
    } else {
      alert(data.error || 'Failed to topup');
    }
  } catch(err) {
    alert('Network error during topup');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Proceed to Payment';
  }
}

// Init
initDashboard();
