const API_URL = '/api';
let user = JSON.parse(localStorage.getItem('datashop_user') || 'null');

if (!user || user.role !== 'admin') {
  alert('Unauthorized. Admin access required.');
  window.location.href = 'login.html';
}

const sidebar = document.getElementById('dashSidebar');
const mobileToggle = document.getElementById('dashMobileToggle');

// Toggle sidebar on mobile
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// Render Functions
async function loadAdminData() {
  try {
    // 1. Load Stats
    const statsRes = await fetch(`${API_URL}/admin/stats`);
    const statsData = await statsRes.json();
    
    const metricCards = document.querySelectorAll('.metric-value');
    if (metricCards.length >= 3) {
      metricCards[0].textContent = `GH₵ ${statsData.revenue.toLocaleString()}`;
      metricCards[1].textContent = statsData.resellers.toLocaleString();
      metricCards[2].textContent = statsData.data_sold || '0 TB';
    }

    // 2. Load Transactions
    const txRes = await fetch(`${API_URL}/admin/transactions`);
    const transactions = await txRes.json();
    
    const txnBody = document.getElementById('txnBody');
    if (txnBody) {
      txnBody.innerHTML = '';
      transactions.forEach(txn => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${txn.id}</strong></td>
          <td>${txn.user_phone}</td>
          <td>${txn.network}</td>
          <td>${txn.bundle_size}</td>
          <td>GH₵${txn.price}</td>
          <td><span class="status-badge status-${txn.status.toLowerCase()}">${txn.status}</span></td>
          <td>${new Date(txn.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</td>
        `;
        txnBody.appendChild(tr);
      });
    }

    // 3. Load Users
    const usersRes = await fetch(`${API_URL}/admin/users`);
    const users = await usersRes.json();
    
    const usersBody = document.getElementById('usersBody');
    if (usersBody) {
      usersBody.innerHTML = '';
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${u.name}</strong> ${u.role === 'admin' ? '<span style="font-size:0.7em; color:var(--cyan);">(Admin)</span>' : ''}</td>
          <td>${u.phone}</td>
          <td>GH₵${u.wallet_balance.toFixed(2)}</td>
          <td>${new Date(u.joined_at).toLocaleDateString('en-GH')}</td>
          <td>
            <button class="btn-action" onclick="alert('Editing user ${u.name}')">Edit</button>
          </td>
        `;
        usersBody.appendChild(tr);
      });
    }

  } catch (err) {
    console.error('Failed to load admin data', err);
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadAdminData();
});
