import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { calculateDepreciation } from '../utils/depreciation';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function Dashboard({ assets }) {
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

  // คำนวณค่าเสื่อมรวม
  const depreciationData = assets.map((a) =>
    calculateDepreciation(a.value, a.salvageValue || 0, a.usefulLifeYears || 5, a.purchaseDate)
  );
  const totalCurrentValue = depreciationData.reduce((sum, d) => sum + d.currentValue, 0);
  const totalDailyDepreciation = depreciationData.reduce((sum, d) => sum + d.dailyDepreciation, 0);
  const totalAccumulatedDep = depreciationData.reduce((sum, d) => sum + d.accumulatedDepreciation, 0);

  // ข้อมูลกราฟ: เปรียบเทียบมูลค่าเดิม vs ปัจจุบัน
  const valueComparisonData = assets.map((asset, index) => ({
    name: asset.name.length > 12 ? asset.name.substring(0, 12) + '...' : asset.name,
    มูลค่าเดิม: asset.value,
    มูลค่าปัจจุบัน: Math.round(depreciationData[index].currentValue),
  }));

  // ข้อมูลกราฟวงกลม: แยกตามหมวดหมู่ (มูลค่า)
  const categoryValueData = assets.reduce((acc, a) => {
    const existing = acc.find((item) => item.name === a.category);
    if (existing) {
      existing.value += a.value;
    } else {
      acc.push({ name: a.category, value: a.value });
    }
    return acc;
  }, []);

  // ข้อมูลกราฟวงกลม: สถานะ
  const statusData = assets.reduce((acc, a) => {
    const existing = acc.find((item) => item.name === a.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: a.status, value: 1 });
    }
    return acc;
  }, []);

  // ข้อมูลกราฟเส้น: ค่าเสื่อมสะสมรายเดือน (จำลอง 12 เดือนข้างหน้า)
  const monthlyDepData = [];
  for (let i = 0; i <= 12; i++) {
    const accumulated = Math.round(totalDailyDepreciation * 30 * i);
    const remaining = Math.max(0, Math.round(totalCurrentValue - totalDailyDepreciation * 30 * i));
    monthlyDepData.push({
      month: i === 0 ? 'ปัจจุบัน' : `เดือน ${i}`,
      ค่าเสื่อมสะสม: accumulated,
      มูลค่าคงเหลือ: remaining,
    });
  }

  // ข้อมูลกราฟ: % ค่าเสื่อมแต่ละรายการ
  const depPercentData = assets.map((asset, index) => ({
    name: asset.name.length > 12 ? asset.name.substring(0, 12) + '...' : asset.name,
    เปอร์เซ็นต์เสื่อม: depreciationData[index].percentDepreciated,
  }));

  return (
    <div className="dashboard">
      <h1>📊 Dashboard</h1>
      <p className="subtitle">ภาพรวมทรัพย์สินทั้งหมด</p>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{totalAssets}</h3>
            <p>ทรัพย์สินทั้งหมด</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{totalValue.toLocaleString()} ฿</h3>
            <p>มูลค่าตั้งต้นรวม</p>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <h3>{Math.round(totalCurrentValue).toLocaleString()} ฿</h3>
            <p>มูลค่าปัจจุบันรวม</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>-{Math.round(totalDailyDepreciation).toLocaleString()} ฿</h3>
            <p>ค่าเสื่อมรายวัน</p>
          </div>
        </div>
      </div>

      {/* กราฟ */}
      <div className="charts-grid">
        <div className="section-card chart-card">
          <h2>📊 เปรียบเทียบมูลค่าเดิม vs ปัจจุบัน</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={valueComparisonData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip formatter={(value) => value.toLocaleString() + ' ฿'} />
              <Legend />
              <Bar dataKey="มูลค่าเดิม" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="มูลค่าปัจจุบัน" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card chart-card">
          <h2>🥧 สัดส่วนมูลค่าตามหมวดหมู่</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryValueData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryValueData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString() + ' ฿'} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card chart-card">
          <h2>📈 คาดการณ์มูลค่าคงเหลือ (12 เดือน)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyDepData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip formatter={(value) => value.toLocaleString() + ' ฿'} />
              <Legend />
              <Line type="monotone" dataKey="มูลค่าคงเหลือ" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="ค่าเสื่อมสะสม" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card chart-card">
          <h2>🔄 สถานะทรัพย์สิน</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card chart-card full-width">
          <h2>📉 เปอร์เซ็นต์ค่าเสื่อมแต่ละรายการ</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={depPercentData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(value) => value + '%'} />
              <Bar dataKey="เปอร์เซ็นต์เสื่อม" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* สรุปค่าเสื่อม */}
      <div className="depreciation-summary">
        <div className="section-card dep-overview">
          <h2>📉 สรุปค่าเสื่อมราคา</h2>
          <div className="dep-summary-grid">
            <div className="dep-summary-item">
              <span className="dep-label">ค่าเสื่อมสะสมทั้งหมด</span>
              <span className="dep-value red">{Math.round(totalAccumulatedDep).toLocaleString()} ฿</span>
            </div>
            <div className="dep-summary-item">
              <span className="dep-label">ค่าเสื่อมรายวัน</span>
              <span className="dep-value red">-{Math.round(totalDailyDepreciation).toLocaleString()} ฿/วัน</span>
            </div>
            <div className="dep-summary-item">
              <span className="dep-label">ค่าเสื่อมรายเดือน (ประมาณ)</span>
              <span className="dep-value red">-{Math.round(totalDailyDepreciation * 30).toLocaleString()} ฿/เดือน</span>
            </div>
            <div className="dep-summary-item">
              <span className="dep-label">ค่าเสื่อมรายปี (ประมาณ)</span>
              <span className="dep-value red">-{Math.round(totalDailyDepreciation * 365).toLocaleString()} ฿/ปี</span>
            </div>
          </div>

          <h3 className="dep-detail-title">รายละเอียดค่าเสื่อมแต่ละรายการ</h3>
          <table className="dep-table">
            <thead>
              <tr>
                <th>ทรัพย์สิน</th>
                <th>ราคาทุน</th>
                <th>ค่าเสื่อม/วัน</th>
                <th>สะสม</th>
                <th>มูลค่าปัจจุบัน</th>
                <th>% เสื่อม</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => {
                const dep = depreciationData[index];
                return (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td>{asset.value.toLocaleString()}</td>
                    <td className="red">{dep.currentValue <= 1 ? '-' : `-${dep.dailyDepreciation.toLocaleString()}`}</td>
                    <td className="red">{dep.accumulatedDepreciation.toLocaleString()}</td>
                    <td className="green">{dep.currentValue.toLocaleString()}</td>
                    <td>
                      <div className="dep-progress-inline">
                        <div className="dep-bar-sm">
                          <div className="dep-bar-fill-sm" style={{ width: `${dep.percentDepreciated}%` }}></div>
                        </div>
                        <span>{dep.percentDepreciated}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <h2>🕐 เพิ่มล่าสุด</h2>
          <ul className="recent-list">
            {assets.slice(-5).reverse().map((asset) => (
              <li key={asset.id}>
                <span className="recent-name">{asset.name}</span>
                <span className="recent-date">{asset.purchaseDate}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
