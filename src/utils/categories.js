// หมวดหมู่เริ่มต้น พร้อม prefix สำหรับสร้างรหัสทรัพย์สิน
const DEFAULT_CATEGORIES = [
  { id: 'IT', name: 'คอมพิวเตอร์', prefix: 'IT' },
  { id: 'FU', name: 'เฟอร์นิเจอร์', prefix: 'FU' },
  { id: 'OE', name: 'อุปกรณ์สำนักงาน', prefix: 'OE' },
  { id: 'EQ', name: 'เครื่องมือ', prefix: 'EQ' },
  { id: 'OA', name: 'ทรัพย์สินอื่นๆ', prefix: 'OA' },
];

const CATEGORIES_KEY = 'asset-registry-categories';

export function getCategories() {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getCategoryPrefix(categoryName) {
  const categories = getCategories();
  const found = categories.find((c) => c.name === categoryName);
  return found ? found.prefix : 'XX';
}

/**
 * สร้างรหัสทรัพย์สินถัดไปจาก prefix
 * เช่น ถ้ามี COM-001, COM-002 อยู่แล้ว จะได้ COM-003
 */
export function generateNextAssetCode(prefix, existingAssets) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let maxNum = 0;

  existingAssets.forEach((asset) => {
    if (asset.assetCode) {
      const match = asset.assetCode.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}-${nextNum}`;
}
