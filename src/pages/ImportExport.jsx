import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './ImportExport.css';

function ImportExport({ assets, onImport, companyName }) {
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef(null);

  // === EXPORT ===
  const exportAsCSV = () => {
    if (assets.length === 0) {
      alert('ไม่มีข้อมูลทรัพย์สินให้ส่งออก');
      return;
    }

    const headers = [
      'รหัสทรัพย์สิน',
      'ชื่อทรัพย์สิน',
      'หมวดหมู่',
      'สถานที่',
      'ผู้ครอบครอง',
      'วันที่ซื้อ',
      'มูลค่า',
      'อายุการใช้งาน(ปี)',
      'มูลค่าซาก',
      'สถานะ',
    ];

    const rows = assets.map((a) => [
      a.assetCode || '',
      a.name || '',
      a.category || '',
      a.location || '',
      a.owner || '',
      a.purchaseDate || '',
      a.value || 0,
      a.usefulLifeYears || 5,
      a.salvageValue || 0,
      a.status || '',
    ]);

    // BOM for Thai characters in Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    downloadFile(csvContent, `ทรัพย์สิน_${companyName}_${getDateStr()}.csv`, 'text/csv;charset=utf-8');
  };

  const exportAsExcel = () => {
    if (assets.length === 0) {
      alert('ไม่มีข้อมูลทรัพย์สินให้ส่งออก');
      return;
    }

    const data = assets.map((a) => ({
      'รหัสทรัพย์สิน': a.assetCode || '',
      'ชื่อทรัพย์สิน': a.name || '',
      'หมวดหมู่': a.category || '',
      'สถานที่': a.location || '',
      'ผู้ครอบครอง': a.owner || '',
      'วันที่ซื้อ': a.purchaseDate || '',
      'มูลค่า': a.value || 0,
      'อายุการใช้งาน(ปี)': a.usefulLifeYears || 5,
      'มูลค่าซาก': a.salvageValue || 0,
      'สถานะ': a.status || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ทรัพย์สิน');
    XLSX.writeFile(wb, `ทรัพย์สิน_${companyName}_${getDateStr()}.xlsx`);
  };

  const exportAsJSON = () => {
    if (assets.length === 0) {
      alert('ไม่มีข้อมูลทรัพย์สินให้ส่งออก');
      return;
    }

    const exportData = assets.map(({ id, images, ...rest }) => rest);
    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `ทรัพย์สิน_${companyName}_${getDateStr()}.json`, 'application/json');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  // === IMPORT ===
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');
    setImportPreview(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseExcel(event.target.result);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;

        if (file.name.endsWith('.json')) {
          parseJSON(content);
        } else if (file.name.endsWith('.csv')) {
          parseCSV(content);
        } else {
          setImportError('รองรับเฉพาะไฟล์ .xlsx, .xls, .csv และ .json เท่านั้น');
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const parseExcel = (buffer) => {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        setImportError('ไม่พบข้อมูลในไฟล์ Excel');
        return;
      }

      const parsed = rows.map((row, i) => ({
        id: Date.now() + Math.random() + i,
        assetCode: row['รหัสทรัพย์สิน'] || row['assetCode'] || row['Asset Code'] || '',
        name: row['ชื่อทรัพย์สิน'] || row['name'] || row['Name'] || '',
        category: row['หมวดหมู่'] || row['category'] || row['Category'] || '',
        location: row['สถานที่'] || row['location'] || row['Location'] || '',
        owner: row['ผู้ครอบครอง'] || row['owner'] || row['Owner'] || '',
        purchaseDate: row['วันที่ซื้อ'] || row['purchaseDate'] || row['Purchase Date'] || '',
        value: Number(row['มูลค่า'] || row['value'] || row['Value']) || 0,
        usefulLifeYears: Number(row['อายุการใช้งาน(ปี)'] || row['usefulLifeYears'] || row['Useful Life']) || 5,
        salvageValue: Number(row['มูลค่าซาก'] || row['salvageValue'] || row['Salvage Value']) || 0,
        status: row['สถานะ'] || row['status'] || row['Status'] || 'ใช้งาน',
        images: [],
      }));

      setImportPreview(parsed);
    } catch {
      setImportError('ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };

  const parseJSON = (content) => {
    try {
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      const parsed = items.map((item) => ({
        id: Date.now() + Math.random(),
        assetCode: item.assetCode || item['รหัสทรัพย์สิน'] || '',
        name: item.name || item['ชื่อทรัพย์สิน'] || '',
        category: item.category || item['หมวดหมู่'] || '',
        location: item.location || item['สถานที่'] || '',
        owner: item.owner || item['ผู้ครอบครอง'] || '',
        purchaseDate: item.purchaseDate || item['วันที่ซื้อ'] || '',
        value: Number(item.value || item['มูลค่า']) || 0,
        usefulLifeYears: Number(item.usefulLifeYears || item['อายุการใช้งาน(ปี)']) || 5,
        salvageValue: Number(item.salvageValue || item['มูลค่าซาก']) || 0,
        status: item.status || item['สถานะ'] || 'ใช้งาน',
        images: [],
      }));
      setImportPreview(parsed);
    } catch {
      setImportError('ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };

  const parseCSV = (content) => {
    try {
      // Remove BOM if present
      const cleaned = content.replace(/^\uFEFF/, '');
      const lines = cleaned.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        setImportError('ไฟล์ CSV ต้องมีอย่างน้อย 1 แถวข้อมูล (ไม่รวมหัวตาราง)');
        return;
      }

      const parseCsvLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCsvLine(lines[0]);
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < 2) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        parsed.push({
          id: Date.now() + Math.random() + i,
          assetCode: row['รหัสทรัพย์สิน'] || row['assetCode'] || '',
          name: row['ชื่อทรัพย์สิน'] || row['name'] || '',
          category: row['หมวดหมู่'] || row['category'] || '',
          location: row['สถานที่'] || row['location'] || '',
          owner: row['ผู้ครอบครอง'] || row['owner'] || '',
          purchaseDate: row['วันที่ซื้อ'] || row['purchaseDate'] || '',
          value: Number(row['มูลค่า'] || row['value']) || 0,
          usefulLifeYears: Number(row['อายุการใช้งาน(ปี)'] || row['usefulLifeYears']) || 5,
          salvageValue: Number(row['มูลค่าซาก'] || row['salvageValue']) || 0,
          status: row['สถานะ'] || row['status'] || 'ใช้งาน',
          images: [],
        });
      }

      if (parsed.length === 0) {
        setImportError('ไม่พบข้อมูลที่สามารถนำเข้าได้');
        return;
      }

      setImportPreview(parsed);
    } catch {
      setImportError('ไม่สามารถอ่านไฟล์ CSV ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };

  const confirmImport = () => {
    if (importPreview && importPreview.length > 0) {
      onImport(importPreview);
      setImportSuccess(`นำเข้าข้อมูลสำเร็จ ${importPreview.length} รายการ`);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelImport = () => {
    setImportPreview(null);
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="import-export-page">
      <h1>📁 นำเข้า / ส่งออกข้อมูล</h1>
      <p className="subtitle">จัดการข้อมูลทรัพย์สินของ {companyName}</p>

      <div className="ie-grid">
        {/* Export Section */}
        <div className="ie-card">
          <h2>📤 ส่งออกข้อมูล (Export)</h2>
          <p className="ie-desc">ส่งออกข้อมูลทรัพย์สินทั้งหมด ({assets.length} รายการ)</p>
          <div className="ie-actions">
            <button className="btn-export excel" onClick={exportAsExcel}>
              📗 ส่งออก Excel
            </button>
            <button className="btn-export csv" onClick={exportAsCSV}>
              📊 ส่งออก CSV
            </button>
            <button className="btn-export json" onClick={exportAsJSON}>
              📋 ส่งออก JSON
            </button>
          </div>
          <p className="ie-hint">CSV เปิดได้ใน Excel / Google Sheets, JSON สำหรับระบบอื่น</p>
        </div>

        {/* Import Section */}
        <div className="ie-card">
          <h2>📥 นำเข้าข้อมูล (Import)</h2>
          <p className="ie-desc">นำเข้าข้อมูลจากไฟล์ CSV หรือ JSON</p>
          <div
            className="import-drop-area"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <div className="import-icon">📂</div>
            <p>คลิกเพื่อเลือกไฟล์</p>
            <p className="import-formats">รองรับ .xlsx, .xls, .csv, .json</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <p className="ie-hint">
            หัวคอลัมน์ CSV: รหัสทรัพย์สิน, ชื่อทรัพย์สิน, หมวดหมู่, สถานที่, ผู้ครอบครอง, วันที่ซื้อ, มูลค่า, อายุการใช้งาน(ปี), มูลค่าซาก, สถานะ
          </p>
        </div>
      </div>

      {/* Import Error */}
      {importError && (
        <div className="ie-message error">❌ {importError}</div>
      )}

      {/* Import Success */}
      {importSuccess && (
        <div className="ie-message success">✅ {importSuccess}</div>
      )}

      {/* Import Preview */}
      {importPreview && (
        <div className="import-preview">
          <h3>👀 ตัวอย่างข้อมูลที่จะนำเข้า ({importPreview.length} รายการ)</h3>
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัส</th>
                  <th>ชื่อทรัพย์สิน</th>
                  <th>หมวดหมู่</th>
                  <th>ผู้ครอบครอง</th>
                  <th>มูลค่า</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.slice(0, 10).map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.assetCode}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.owner}</td>
                    <td>{item.value.toLocaleString()}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {importPreview.length > 10 && (
              <p className="preview-more">...และอีก {importPreview.length - 10} รายการ</p>
            )}
          </div>
          <div className="preview-actions">
            <button className="btn-confirm" onClick={confirmImport}>
              ✅ ยืนยันนำเข้า
            </button>
            <button className="btn-cancel-import" onClick={cancelImport}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportExport;
