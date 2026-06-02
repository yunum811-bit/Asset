import { useState, useEffect, useCallback } from 'react';

// ถ้ารันผ่าน dev server (vite) จะ proxy ไปที่ backend
// ถ้ารันผ่าน production (express serve) จะเป็น same origin
const API_BASE = import.meta.env.VITE_API_URL || '';

// === Hook ===
export function useFirestore(companyId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/assets?companyId=${encodeURIComponent(companyId)}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('ไม่สามารถเชื่อมต่อ server ได้');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAsset = useCallback(async (asset) => {
    try {
      const res = await fetch(`${API_BASE}/api/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...asset, companyId }),
      });
      if (!res.ok) throw new Error('Failed to add asset');
      await fetchAssets();
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('เกิดข้อผิดพลาดในการเพิ่มทรัพย์สิน');
      throw err;
    }
  }, [companyId, fetchAssets]);

  const updateAsset = useCallback(async (updatedAsset) => {
    try {
      const { id, ...data } = updatedAsset;
      const res = await fetch(`${API_BASE}/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update asset');
      await fetchAssets();
    } catch (err) {
      console.error('Error updating asset:', err);
      setError('เกิดข้อผิดพลาดในการแก้ไขทรัพย์สิน');
      throw err;
    }
  }, [fetchAssets]);

  const deleteAsset = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/assets/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete asset');
      await fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('เกิดข้อผิดพลาดในการลบทรัพย์สิน');
      throw err;
    }
  }, [fetchAssets]);

  const importAssets = useCallback(async (newAssets) => {
    try {
      const res = await fetch(`${API_BASE}/api/assets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, assets: newAssets }),
      });
      if (!res.ok) throw new Error('Failed to import assets');
      await fetchAssets();
    } catch (err) {
      console.error('Error importing assets:', err);
      setError('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      throw err;
    }
  }, [companyId, fetchAssets]);

  const clearError = useCallback(() => setError(null), []);

  return {
    assets,
    loading,
    error,
    clearError,
    addAsset,
    updateAsset,
    deleteAsset,
    importAssets,
  };
}
