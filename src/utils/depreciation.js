/**
 * คำนวณค่าเสื่อมราคาแบบเส้นตรง (Straight-line depreciation) รายวัน
 * คิดค่าเสื่อมจนมูลค่าคงเหลือเท่ากับ 1 บาท (ไม่ใช้มูลค่าซาก)
 *
 * สูตร: ค่าเสื่อมรายวัน = (ราคาทุน - 1) / (อายุการใช้งาน x 365)
 *
 * @param {number} cost - ราคาทุน (มูลค่าเมื่อซื้อ)
 * @param {number} salvageValue - ไม่ใช้ (เก็บไว้เพื่อ backward compatibility)
 * @param {number} usefulLifeYears - อายุการใช้งาน (ปี)
 * @param {string} purchaseDate - วันที่ซื้อ (YYYY-MM-DD)
 * @returns {object} ข้อมูลค่าเสื่อมราคา
 */
export function calculateDepreciation(cost, salvageValue, usefulLifeYears, purchaseDate) {
  if (!cost || !usefulLifeYears || !purchaseDate) {
    return {
      dailyDepreciation: 0,
      totalDepreciation: 0,
      accumulatedDepreciation: 0,
      currentValue: cost || 0,
      daysUsed: 0,
      percentDepreciated: 0,
    };
  }

  // คิดค่าเสื่อมจนเหลือ 1 บาท
  const residualValue = 1;
  const totalDays = usefulLifeYears * 365;
  const depreciableAmount = cost - residualValue;
  const dailyDepreciation = depreciableAmount / totalDays;

  const start = new Date(purchaseDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const daysUsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // ค่าเสื่อมสะสมไม่เกินมูลค่าที่เสื่อมได้ (ราคาทุน - 1)
  const accumulatedDepreciation = Math.min(daysUsed * dailyDepreciation, depreciableAmount);
  const currentValue = Math.max(cost - accumulatedDepreciation, residualValue);
  const percentDepreciated = (accumulatedDepreciation / depreciableAmount) * 100;

  return {
    dailyDepreciation: Math.round(dailyDepreciation * 100) / 100,
    totalDepreciation: Math.round(depreciableAmount * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
    daysUsed,
    percentDepreciated: Math.min(Math.round(percentDepreciated * 100) / 100, 100),
  };
}
