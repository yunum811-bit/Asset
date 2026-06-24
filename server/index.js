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
    serialNumber TEXT DEFAULT '',
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

// เพิ่มคอลัมน์ serialNumber ถ้ายังไม่มี (สำหรับ DB เดิม)
try {
  db.exec(`ALTER TABLE assets ADD COLUMN serialNumber TEXT DEFAULT ''`);
} catch (e) {
  // คอลัมน์มีอยู่แล้ว
}

// === Categories (prefix mapping) ===
// อ่าน categories จากไฟล์ หรือใช้ default
const DEFAULT_CATEGORIES = [
  { name: 'คอมพิวเตอร์', prefix: 'IT' },
  { name: 'เฟอร์นิเจอร์', prefix: 'FU' },
  { name: 'อุปกรณ์สำนักงาน', prefix: 'OE' },
  { name: 'เครื่องมือ', prefix: 'EQ' },
  { name: 'ทรัพย์สินอื่นๆ', prefix: 'OA' },
];

function getCategoryPrefix(categoryName) {
  const found = DEFAULT_CATEGORIES.find((c) => c.name === categoryName);
  return found ? found.prefix : 'XX';
}

/**
 * Re-number รหัสทรัพย์สินทั้งหมดในหมวดหมู่เดียวกัน ตามลำดับวันที่ซื้อ
 * เช่น ถ้ามี 3 รายการในหมวด COM เรียงตามวันที่ → COM-001, COM-002, COM-003
 */
function renumberAssetCodes(companyId, category) {
  const prefix = getCategoryPrefix(category);

  // ดึงทรัพย์สินในหมวดเดียวกัน เรียงตามวันที่ซื้อ แล้วตาม id
  const rows = db.prepare(
    `SELECT id, purchaseDate FROM assets 
     WHERE companyId = ? AND category = ? 
     ORDER BY purchaseDate ASC, id ASC`
  ).all(companyId, category);

  const updateStmt = db.prepare('UPDATE assets SET assetCode = ? WHERE id = ?');

  const renumber = db.transaction(() => {
    rows.forEach((row, index) => {
      const newCode = `${prefix}-${String(index + 1).padStart(3, '0')}`;
      updateStmt.run(newCode, row.id);
    });
  });

  renumber();
}

/**
 * Re-number ทุกหมวดหมู่ของบริษัทนั้น
 */
function renumberAllCategories(companyId) {
  const categories = db.prepare(
    "SELECT DISTINCT category FROM assets WHERE companyId = ? AND category IS NOT NULL AND category != ''"
  ).all(companyId);

  categories.forEach(({ category }) => {
    renumberAssetCodes(companyId, category);
  });
}

// === API Routes ===

// GET /api/assets?companyId=xxx
app.get('/api/assets', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  const rows = db.prepare('SELECT * FROM assets WHERE companyId = ? ORDER BY purchaseDate ASC, id ASC').all(companyId);

  const assets = rows.map((row) => ({
    ...row,
    images: JSON.parse(row.images || '[]'),
  }));

  res.json(assets);
});

// POST /api/assets
app.post('/api/assets', (req, res) => {
  const {
    companyId, name, serialNumber, category, location, owner,
    purchaseDate, value, usefulLifeYears, salvageValue, status, images
  } = req.body;

  if (!companyId || !name) {
    return res.status(400).json({ error: 'companyId and name are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO assets (companyId, assetCode, name, serialNumber, category, location, owner, purchaseDate, value, usefulLifeYears, salvageValue, status, images, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    companyId,
    '', // assetCode จะถูก re-number หลัง insert
    name,
    serialNumber || '',
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

  // Re-number รหัสในหมวดหมู่นี้ตามลำดับวันที่
  if (category) {
    renumberAssetCodes(companyId, category);
  }

  res.json({ id: result.lastInsertRowid, message: 'Asset created' });
});

// PUT /api/assets/:id
app.put('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const {
    companyId, name, serialNumber, category, location, owner,
    purchaseDate, value, usefulLifeYears, salvageValue, status, images
  } = req.body;

  // ดึงข้อมูลเดิมเพื่อเช็คว่า category หรือ companyId เปลี่ยนไหม
  const existing = db.prepare('SELECT companyId, category FROM assets WHERE id = ?').get(id);

  const stmt = db.prepare(`
    UPDATE assets SET
      name = ?, serialNumber = ?, category = ?, location = ?, owner = ?,
      purchaseDate = ?, value = ?, usefulLifeYears = ?, salvageValue = ?,
      status = ?, images = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(
    name || '',
    serialNumber || '',
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

  // Re-number หมวดหมู่ที่เกี่ยวข้อง
  const cid = companyId || (existing && existing.companyId);
  if (cid) {
    // Re-number หมวดเดิม (กรณีย้ายหมวด)
    if (existing && existing.category && existing.category !== category) {
      renumberAssetCodes(cid, existing.category);
    }
    // Re-number หมวดปัจจุบัน
    if (category) {
      renumberAssetCodes(cid, category);
    }
  }

  res.json({ message: 'Asset updated' });
});

// DELETE /api/assets/:id
app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;

  // ดึงข้อมูลก่อนลบ เพื่อ re-number
  const existing = db.prepare('SELECT companyId, category FROM assets WHERE id = ?').get(id);

  db.prepare('DELETE FROM assets WHERE id = ?').run(id);

  // Re-number หมวดหมู่ที่ลบออกไป
  if (existing && existing.companyId && existing.category) {
    renumberAssetCodes(existing.companyId, existing.category);
  }

  res.json({ message: 'Asset deleted' });
});

// POST /api/assets/import
app.post('/api/assets/import', (req, res) => {
  const { companyId, assets: newAssets } = req.body;

  if (!companyId || !Array.isArray(newAssets)) {
    return res.status(400).json({ error: 'companyId and assets array are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO assets (companyId, assetCode, name, serialNumber, category, location, owner, purchaseDate, value, usefulLifeYears, salvageValue, status, images, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const asset of items) {
      stmt.run(
        companyId,
        '', // จะ re-number ทีหลัง
        asset.name || '',
        asset.serialNumber || '',
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

  // Re-number ทุกหมวดหมู่
  renumberAllCategories(companyId);

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
  // Re-number รหัสทรัพย์สินทั้งหมดตอน start เพื่อให้ตรงกับ prefix ล่าสุด
  const companies = db.prepare('SELECT DISTINCT companyId FROM assets').all();
  companies.forEach(({ companyId }) => {
    renumberAllCategories(companyId);
  });
  console.log('');
  console.log('===========================================');
  console.log('  ระบบทะเบียนทรัพย์สิน - Server Started');
  console.log('===========================================');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<YOUR_SERVER_IP>:${PORT}`);
  console.log('');
  console.log('  คนในออฟฟิศเข้าใช้งานผ่าน Network URL');
  console.log('  ข้อมูลเก็บที่: ' + dbPath);
  console.log('  รหัสทรัพย์สินถูก re-number ตาม prefix ล่าสุดแล้ว');
  console.log('===========================================');
  console.log('');
});
