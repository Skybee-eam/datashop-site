const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./data/datashop.sqlite', (err) => {
  if (err) console.error('Database opening error: ', err);
});

// Setup Schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    password_hash TEXT,
    wallet_balance REAL DEFAULT 0,
    role TEXT DEFAULT 'user',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    network TEXT,
    bundle_size TEXT,
    recipient_phone TEXT,
    price REAL,
    status TEXT DEFAULT 'Delivered',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bundles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network TEXT,
    size TEXT,
    price REAL
  )`);
  
  // Seed bundles if empty
  db.get("SELECT COUNT(*) as count FROM bundles", (err, row) => {
    if (row.count === 0) {
      const seedBundles = [
        { net: 'MTN', size: '500MB', price: 200 },
        { net: 'MTN', size: '1GB', price: 350 },
        { net: 'MTN', size: '2GB', price: 600 },
        { net: 'MTN', size: '5GB', price: 1300 },
        { net: 'MTN', size: '10GB', price: 2400 },
        { net: 'AirtelTigo', size: '300MB', price: 150 },
        { net: 'AirtelTigo', size: '1GB', price: 380 },
        { net: 'AirtelTigo', size: '3GB', price: 950 },
        { net: 'AirtelTigo', size: '5GB', price: 1450 },
        { net: 'Telecel', size: '150MB', price: 100 },
        { net: 'Telecel', size: '1GB', price: 320 },
        { net: 'Telecel', size: '2.5GB', price: 700 },
        { net: 'Telecel', size: '5GB', price: 1300 },
        { net: 'Glo', size: '200MB', price: 100 },
        { net: 'Glo', size: '1GB', price: 300 },
        { net: 'Glo', size: '2GB', price: 550 },
        { net: 'Glo', size: '5GB', price: 1200 }
      ];
      const stmt = db.prepare("INSERT INTO bundles (network, size, price) VALUES (?, ?, ?)");
      seedBundles.forEach(b => stmt.run(b.net, b.size, b.price));
      stmt.finalize();
    }
  });

  // Seed an admin user if not exists
  db.get("SELECT * FROM users WHERE role = 'admin'", async (err, row) => {
    if (!row) {
      const hash = await bcrypt.hash('admin123', 10);
      db.run("INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)", ['Super Admin', '0000000000', hash, 'admin']);
    }
  });
});

// API Routes

// 1. Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)", [name, phone, hash], function(err) {
      if (err) return res.status(400).json({ error: 'Phone number already exists' });
      res.json({ success: true, user: { id: this.lastID, name, phone, wallet_balance: 0, role: 'user' } });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  db.get("SELECT * FROM users WHERE phone = ?", [phone], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    
    res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, wallet_balance: user.wallet_balance, role: user.role } });
  });
});

// 3. Wallet: Get Balance
app.get('/api/user/:id/wallet', (req, res) => {
  db.get("SELECT wallet_balance FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: row.wallet_balance });
  });
});

// 4. Wallet: Topup
app.post('/api/user/:id/topup', (req, res) => {
  const { amount } = req.body;
  db.run("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", [amount, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to topup' });
    db.get("SELECT wallet_balance FROM users WHERE id = ?", [req.params.id], (err, row) => {
      res.json({ success: true, balance: row.wallet_balance });
    });
  });
});

// 5. Get Bundles
app.get('/api/bundles', (req, res) => {
  db.all("SELECT * FROM bundles", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch bundles' });
    
    // Group by network
    const data = { MTN: [], AirtelTigo: [], Telecel: [], Glo: [] };
    rows.forEach(r => {
      if (data[r.network]) data[r.network].push({ size: r.size, price: r.price });
    });
    res.json(data);
  });
});

// 6. Buy Data (Transaction)
app.post('/api/transactions', (req, res) => {
  const { user_id, network, size, phone, price } = req.body;
  
  // Check balance
  db.get("SELECT wallet_balance FROM users WHERE id = ?", [user_id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    if (user.wallet_balance < price) return res.status(400).json({ error: 'Insufficient funds' });
    
    // Deduct and log transaction
    db.run("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", [price, user_id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to deduct funds' });
      
      db.run("INSERT INTO transactions (user_id, network, bundle_size, recipient_phone, price) VALUES (?, ?, ?, ?, ?)",
        [user_id, network, size, phone, price], function(err) {
          if (err) return res.status(500).json({ error: 'Transaction logged failed' });
          res.json({ success: true, new_balance: user.wallet_balance - price, transaction_id: this.lastID });
      });
    });
  });
});

// 7. Get User Transactions
app.get('/api/transactions/:user_id', (req, res) => {
  db.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", [req.params.user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// 8. Admin: Get all transactions
app.get('/api/admin/transactions', (req, res) => {
  db.all(`SELECT t.*, u.phone as user_phone 
          FROM transactions t JOIN users u ON t.user_id = u.id 
          ORDER BY t.created_at DESC LIMIT 50`, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// 9. Admin: Get all users
app.get('/api/admin/users', (req, res) => {
  db.all("SELECT id, name, phone, wallet_balance, role, joined_at FROM users ORDER BY joined_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// 10. Admin: Get Stats
app.get('/api/admin/stats', (req, res) => {
  const stats = { revenue: 0, resellers: 0, data_sold: '0 TB' };
  db.get("SELECT SUM(price) as rev FROM transactions", (err, r) => {
    if (r) stats.revenue = r.rev || 0;
    db.get("SELECT COUNT(*) as c FROM users WHERE role = 'user'", (err, r2) => {
      if (r2) stats.resellers = r2.c || 0;
      res.json(stats);
    });
  });
});

app.listen(PORT, () => {
  console.log('DataHub Backend API running on http://localhost:' + PORT);
});
