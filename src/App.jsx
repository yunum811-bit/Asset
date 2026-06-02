import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import ImportExport from './pages/ImportExport';
import CategoryManager from './pages/CategoryManager';
import { useFirestore } from './hooks/useFirestore';
import './App.css';

const COMPANIES = [
  { id: 'company-a', name: 'บริษัท ซีเรียลแฟคตอริ่ง (ประเทศไทย) จำกัด' },
  { id: 'company-b', name: 'บริษัท ซีเรียล คอนซัลติ้ง จำกัด' },
];

const COMPANY_KEY = 'asset-registry-company';

function App() {
  const [selectedCompany, setSelectedCompany] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPANY_KEY);
      if (saved && COMPANIES.find((c) => c.id === saved)) return saved;
    } catch {}
    return COMPANIES[0].id;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { assets, loading, error, clearError, addAsset, updateAsset, deleteAsset, importAssets } =
    useFirestore(selectedCompany);

  const currentCompanyName =
    COMPANIES.find((c) => c.id === selectedCompany)?.name || '';

  useEffect(() => {
    try {
      localStorage.setItem(COMPANY_KEY, selectedCompany);
    } catch {}
  }, [selectedCompany]);

  const handleAddAsset = async (asset) => {
    await addAsset(asset);
  };

  const handleUpdateAsset = async (updatedAsset) => {
    await updateAsset(updatedAsset);
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('ต้องการลบทรัพย์สินนี้หรือไม่?')) {
      await deleteAsset(id);
    }
  };

  const handleImportAssets = async (newAssets) => {
    await importAssets(newAssets);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <HashRouter>
      <div className="app">
        {/* Mobile hamburger */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="เปิดเมนู"
        >
          ☰
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

        <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2>📋 ทะเบียนทรัพย์สิน</h2>
          </div>

          <div className="company-selector">
            <label htmlFor="company-select">🏢 เลือกบริษัท</label>
            <select
              id="company-select"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              {COMPANIES.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <ul className="nav-links">
            <li>
              <NavLink to="/" end onClick={closeSidebar}>
                📊 Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/assets" onClick={closeSidebar}>
                📦 รายการทรัพย์สิน
              </NavLink>
            </li>
            <li>
              <NavLink to="/assets/new" onClick={closeSidebar}>
                ➕ เพิ่มทรัพย์สิน
              </NavLink>
            </li>
            <li>
              <NavLink to="/import-export" onClick={closeSidebar}>
                📁 นำเข้า/ส่งออก
              </NavLink>
            </li>
            <li>
              <NavLink to="/categories" onClick={closeSidebar}>
                🏷️ จัดการหมวดหมู่
              </NavLink>
            </li>
          </ul>

          {/* แสดงสถานะการเชื่อมต่อ */}
          <div className="connection-status">
            <span className="status-online">🟢 เชื่อมต่อ Server</span>
          </div>
        </nav>

        <main className="main-content">
          <div className="company-badge">🏢 {currentCompanyName}</div>

          {/* Error banner */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={clearError} aria-label="ปิด">✕</button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard assets={assets} />} />
              <Route
                path="/assets"
                element={<AssetList assets={assets} onDelete={handleDeleteAsset} />}
              />
              <Route
                path="/assets/new"
                element={<AssetForm onSubmit={handleAddAsset} />}
              />
              <Route
                path="/assets/edit/:id"
                element={<AssetForm assets={assets} onSubmit={handleUpdateAsset} isEdit />}
              />
              <Route
                path="/import-export"
                element={
                  <ImportExport
                    assets={assets}
                    onImport={handleImportAssets}
                    companyName={currentCompanyName}
                  />
                }
              />
              <Route path="/categories" element={<CategoryManager />} />
              {/* 404 catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
