const API_URL = 'http://localhost:3000/api';

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fullname').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const btn = signupForm.querySelector('button[type="submit"]');
    btn.textContent = 'Processing...';
    btn.disabled = true;
    
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('datashop_user', JSON.stringify(data.user));
        
        // Handle pending bundle if exists
        const pending = localStorage.getItem('pendingBundle');
        if (pending) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      } else {
        alert(data.error || 'Signup failed');
        btn.textContent = 'Create Account \u2192';
        btn.disabled = false;
      }
    } catch (err) {
      alert('Network error');
      btn.textContent = 'Create Account \u2192';
      btn.disabled = false;
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.textContent = 'Processing...';
    btn.disabled = true;
    
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('datashop_user', JSON.stringify(data.user));
        
        // Handle pending bundle if exists
        const pending = localStorage.getItem('pendingBundle');
        if (pending && data.user.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return;
        }

        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      } else {
        alert(data.error || 'Login failed');
        btn.textContent = 'Sign In \u2192';
        btn.disabled = false;
      }
    } catch (err) {
      alert('Network error');
      btn.textContent = 'Sign In \u2192';
      btn.disabled = false;
    }
  });
}
