const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // รองรับ base64 images

// === Database Setup ===
const dbPath = path.join(__dirname, 'assets.db');
const db = new Database(dbPath);

// สร้างตาราง
db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    companyId TEXT NOT NULL,
    assetCode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT,
    owner TEXT,
    purchaseDate TEXT,
    value REAL DEFAULT 0,
    usefulLifeYears REAL DEFAULT 5,
    salvageValue REAL DEFAULT 0,
    status TEXT DEFAULT 'ใช้งาน',
    images TEXT DEFAULT '[]',
    createdAt TEXT,
    updatedAt TEXT
  )
`);

// === API Routes ===

// GET /api/assets?companyId=xxx
app.get('/api/assets', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  const rows = db.prepare('SELECT * FROM assets WHERE companyId = ? ORDER BY id DESC').all(companyId);

  // แปลง images จาก JSON string กลับเป็น array
  const assets = rows.map((row) => ({
    ...row,
    images: JSON.parse(row.images || '[]'),
  }));

  res.json(assets);
});

// POST /api/assets
app.post('/api/assets', (req, res) => {
  const {
    companyId, assetCode, name, category, location, owner,
    purchaseDate, value, usefulLifeYears, salvageValue, status, images
  } = req.body;

  if (!companyId || !name) {
    return res.status(400).json({ error: 'companyId and name are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO assets (companyId, assetCode, name, category, location, owner, purchaseDate, value, usefulLifeYears, salvageValue, status, images, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    companyId,
    assetCode || '',
    name,
    category || '',
    location || '',
    owner || '',
    purchaseDate || '',
    value || 0,
    usefulLifeYears || 5,
    salvageValue || 0,
    status || 'ใช้งาน',
    JSON.stringify(images || []),
    new Date().toISOString()
  );

  res.json({ id: result.lastInsertRowid, message: 'Asset created' });
});

// PUT /api/assets/:id
app.put('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const {
    assetCode, name, category, location, owner,
    purchaseDate, value, usefulLifeYears, salvageValue, status, images
  } = req.body;

  const stmt = db.prepare(`
    UPDATE assets SET
      assetCode = ?, name = ?, category = ?, location = ?, owner = ?,
      purchaseDate = ?, value = ?, usefulLifeYears = ?, salvageValue = ?,
      status = ?, images = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(
    assetCode || '',
    name || '',
    category || '',
    location || '',
    owner || '',
    purchaseDate || '',
    value || 0,
    usefulLifeYears || 5,
    salvageValue || 0,
    status || 'ใช้งาน',
    JSON.stringify(images || []),
    new Date().toISOString(),
    id
  );

  res.json({ message: 'Asset updated' });
});

// DELETE /api/assets/:id
app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  res.json({ message: 'Asset deleted' });
});

// POST /api/assets/import
app.post('/api/assets/import', (req, res) => {
  const { companyId, assets: newAssets } = req.body;

  if (!companyId || !Array.isArray(newAssets)) {
    return res.status(400).json({ error: 'companyId and assets array are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO assets (companyId, assetCode, name, category, location, owner, purchaseDate, value, usefulLifeYears, salvageValue, status, images, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const asset of items) {
      stmt.run(
        companyId,
        asset.assetCode || '',
        asset.name || '',
        asset.category || '',
        asset.location || '',
        asset.owner || '',
        asset.purchaseDate || '',
        asset.value || 0,
        asset.usefulLifeYears || 5,
        asset.salvageValue || 0,
        asset.status || 'ใช้งาน',
        JSON.stringify(asset.images || []),
        new Date().toISOString()
      );
    }
  });

  insertMany(newAssets);
  res.json({ message: `Imported ${newAssets.length} assets` });
});

// === Serve Frontend (production) ===
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// === Start Server ===
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('===========================================');
  console.log('  ระบบทะเบียนทรัพย์สิน - Server Started');
  console.log('===========================================');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<YOUR_SERVER_IP>:${PORT}`);
  console.log('');
  console.log('  คนในออฟฟิศเข้าใช้งานผ่าน Network URL');
  console.log('  ข้อมูลเก็บที่: ' + dbPath);
  console.log('===========================================');
  console.log('');
});
