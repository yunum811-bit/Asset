import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import ImportExport from './pages/ImportExport';
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

  const { assets, loading, addAsset, updateAsset, deleteAsset, importAssets } =
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

  return (
    <HashRouter>
      <div className="app">
        <nav className="sidebar">
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
              <NavLink to="/" end>
                📊 Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/assets">📦 รายการทรัพย์สิน</NavLink>
            </li>
            <li>
              <NavLink to="/assets/new">➕ เพิ่มทรัพย์สิน</NavLink>
            </li>
            <li>
              <NavLink to="/import-export">📁 นำเข้า/ส่งออก</NavLink>
            </li>
          </ul>
        </nav>
        <main className="main-content">
          <div className="company-badge">🏢 {currentCompanyName}</div>

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
            </Routes>
          )}
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
