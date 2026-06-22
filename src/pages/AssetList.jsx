import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateDepreciation } from '../utils/depreciation';
import './AssetList.css';

function AssetList({ assets, onDelete }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [...new Set(assets.map((a) => a.category))];

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.assetCode && a.assetCode.toLowerCase().includes(search.toLowerCase())) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      (a.owner && a.owner.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !filterCategory || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // เรียงตามวันที่ซื้อ (เก่าสุดอยู่บน → ใหม่สุดอยู่ล่าง)
  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.purchaseDate || '';
    const dateB = b.purchaseDate || '';
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="asset-list-page">
      <h1>📦 รายการทรัพย์สิน</h1>
      <p className="subtitle">ทรัพย์สินทั้งหมด {assets.length} รายการ</p>

      <div className="filters">
        <input
          type="text"
          placeholder="🔍 ค้นหาทรัพย์สิน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="asset-table-wrapper">
        <table className="asset-table">
          <thead>
            <tr>
              <th>รูปภาพ</th>
              <th>รหัส</th>
              <th>ชื่อทรัพย์สิน</th>
              <th>S/N</th>
              <th>หมวดหมู่</th>
              <th>ผู้ครอบครอง</th>
              <th>มูลค่าเดิม (฿)</th>
              <th>ค่าเสื่อม/วัน</th>
              <th>มูลค่าปัจจุบัน</th>
              <th>% เสื่อม</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-row">
                  ไม่พบข้อมูลทรัพย์สิน
                </td>
              </tr>
            ) : (
              sorted.map((asset) => {
                const dep = calculateDepreciation(
                  asset.value,
                  asset.salvageValue || 0,
                  asset.usefulLifeYears || 5,
                  asset.purchaseDate
                );
                return (
                  <tr key={asset.id}>
                    <td>
                      {asset.images && asset.images.length > 0 ? (
                        <img
                          src={asset.images[0]}
                          alt={asset.name}
                          className="asset-thumb"
                        />
                      ) : (
                        <div className="no-image">📷</div>
                      )}
                    </td>
                    <td className="asset-code">{asset.assetCode || '-'}</td>
                    <td className="asset-name">{asset.name}</td>
                    <td className="sn-cell">{asset.serialNumber || '-'}</td>
                    <td>{asset.category}</td>
                    <td className="owner-cell">{asset.owner || '-'}</td>
                    <td>{asset.value.toLocaleString()}</td>
                    <td className="depreciation-cell">
                      <span className="dep-daily">{dep.currentValue <= 1 ? '-' : `-${dep.dailyDepreciation.toLocaleString()}`}</span>
                    </td>
                    <td className="current-value-cell">
                      {dep.currentValue.toLocaleString()}
                    </td>
                    <td>
                      <div className="dep-progress">
                        <div className="dep-bar">
                          <div
                            className="dep-bar-fill"
                            style={{ width: `${dep.percentDepreciated}%` }}
                          ></div>
                        </div>
                        <span className="dep-percent">{dep.percentDepreciated}%</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-tag ${
                          asset.status === 'ใช้งาน' ? 'active' : 'maintenance'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/assets/edit/${asset.id}`)}
                        aria-label={`แก้ไข ${asset.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => onDelete(asset.id)}
                        aria-label={`ลบ ${asset.name}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssetList;
