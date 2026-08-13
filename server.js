const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers for password hashing using Node's built-in crypto module
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'datashop_salt_2026', 1000, 64, 'sha512').toString('hex');
}

function comparePassword(password, hash) {
  return hashPassword(password) === hash;
}

// Simple JSON Database with disk persistence (zero native binary dependencies for Vercel compatibility)
const isVercel = process.env.VERCEL || process.env.AWS_REGION;
const dbDir = isVercel ? '/tmp' : path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbFile = path.join(dbDir, 'datashop.json');

const initialSeedBundles = [
  { id: 1, network: 'MTN', size: '500MB', price: 200 },
  { id: 2, network: 'MTN', size: '1GB', price: 350 },
  { id: 3, network: 'MTN', size: '2GB', price: 600 },
  { id: 4, network: 'MTN', size: '5GB', price: 1300 },
  { id: 5, network: 'MTN', size: '10GB', price: 2400 },
  { id: 6, network: 'AirtelTigo', size: '300MB', price: 150 },
  { id: 7, network: 'AirtelTigo', size: '1GB', price: 380 },
  { id: 8, network: 'AirtelTigo', size: '3GB', price: 950 },
  { id: 9, network: 'AirtelTigo', size: '5GB', price: 1450 },
  { id: 10, network: 'Telecel', size: '150MB', price: 100 },
  { id: 11, network: 'Telecel', size: '1GB', price: 320 },
  { id: 12, network: 'Telecel', size: '2.5GB', price: 700 },
  { id: 13, network: 'Telecel', size: '5GB', price: 1300 },
  { id: 14, network: 'Glo', size: '200MB', price: 100 },
  { id: 15, network: 'Glo', size: '1GB', price: 300 },
  { id: 16, network: 'Glo', size: '2GB', price: 550 },
  { id: 17, network: 'Glo', size: '5GB', price: 1200 }
];

function loadDB() {
  let dbData = { users: [], transactions: [], bundles: initialSeedBundles };
  try {
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf8');
      dbData = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading DB file, resetting to initial state:', err);
  }

  // Ensure Admin user exists
  const hasAdmin = dbData.users.some(u => u.role === 'admin');
  if (!hasAdmin) {
    dbData.users.push({
      id: 1,
      name: 'Super Admin',
      phone: '0000000000',
      password_hash: hashPassword('admin123'),
      wallet_balance: 1000,
      role: 'admin',
      joined_at: new Date().toISOString()
    });
  }

  // Ensure initial bundles exist
  if (!dbData.bundles || dbData.bundles.length === 0) {
    dbData.bundles = initialSeedBundles;
  }

  return dbData;
}

function saveDB(dbData) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// API Routes

// 1. Auth: Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'Missing fields' });

  const db = loadDB();
  const exists = db.users.some(u => u.phone === phone);
  if (exists) return res.status(400).json({ error: 'Phone number already exists' });

  const newUser = {
    id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    name,
    phone,
    password_hash: hashPassword(password),
    wallet_balance: 0,
    role: 'user',
    joined_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  res.json({
    success: true,
    user: { id: newUser.id, name: newUser.name, phone: newUser.phone, wallet_balance: 0, role: 'user' }
  });
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.phone === phone);

  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  res.json({
    success: true,
    user: { id: user.id, name: user.name, phone: user.phone, wallet_balance: user.wallet_balance, role: user.role }
  });
});

// 3. Wallet: Get Balance
app.get('/api/user/:id/wallet', (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ balance: user.wallet_balance });
});

// 4. Wallet: Topup
app.post('/api/user/:id/topup', (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const db = loadDB();
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.wallet_balance += Number(amount);
  saveDB(db);

  res.json({ success: true, balance: user.wallet_balance });
});

// 5. Get Bundles
app.get('/api/bundles', (req, res) => {
  const db = loadDB();
  const data = { MTN: [], AirtelTigo: [], Telecel: [], Glo: [] };
  db.bundles.forEach(r => {
    if (data[r.network]) data[r.network].push({ size: r.size, price: r.price });
  });
  res.json(data);
});

// 6. Buy Data (Transaction)
app.post('/api/transactions', (req, res) => {
  const { user_id, network, size, phone, price } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.id === Number(user_id));

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.wallet_balance < price) return res.status(400).json({ error: 'Insufficient funds' });

  user.wallet_balance -= Number(price);

  const newTxn = {
    id: db.transactions.length ? Math.max(...db.transactions.map(t => t.id)) + 1 : 1,
    user_id: user.id,
    network,
    bundle_size: size,
    recipient_phone: phone,
    price: Number(price),
    status: 'Delivered',
    created_at: new Date().toISOString()
  };

  db.transactions.push(newTxn);
  saveDB(db);

  res.json({ success: true, new_balance: user.wallet_balance, transaction_id: newTxn.id });
});

// 7. Get User Transactions
app.get('/api/transactions/:user_id', (req, res) => {
  const db = loadDB();
  const txns = db.transactions
    .filter(t => t.user_id === Number(req.params.user_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  res.json(txns);
});

// 8. Admin: Get all transactions
app.get('/api/admin/transactions', (req, res) => {
  const db = loadDB();
  const txns = db.transactions
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(t => {
      const user = db.users.find(u => u.id === t.user_id);
      return { ...t, user_phone: user ? user.phone : 'Unknown' };
    });

  res.json(txns);
});

// 9. Admin: Get all users
app.get('/api/admin/users', (req, res) => {
  const db = loadDB();
  const users = db.users
    .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
    .map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      wallet_balance: u.wallet_balance,
      role: u.role,
      joined_at: u.joined_at
    }));

  res.json(users);
});

// 10. Admin: Get Stats
app.get('/api/admin/stats', (req, res) => {
  const db = loadDB();
  const revenue = db.transactions.reduce((sum, t) => sum + (t.price || 0), 0);
  const resellers = db.users.filter(u => u.role === 'user').length;

  res.json({ revenue, resellers, data_sold: '0 TB' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('DataHub Backend API running on http://localhost:' + PORT);
  });
}

module.exports = app;
