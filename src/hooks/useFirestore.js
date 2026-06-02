import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

const COLLECTION_NAME = 'assets';
const LOCAL_STORAGE_KEY = 'asset-registry-data';

// === LocalStorage helpers ===
function getLocalAssets(companyId) {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    return all.filter((a) => a.companyId === companyId);
  } catch {
    return [];
  }
}

function saveLocalAssets(allAssets) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allAssets));
  } catch (e) {
    console.error('localStorage save error:', e);
  }
}

function getAllLocalAssets() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function generateId() {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

// === Hook ===
export function useFirestore(companyId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // ถ้า Firebase ยังไม่ได้ตั้งค่า ใช้ localStorage แทน
    if (!isFirebaseConfigured || !db) {
      const localData = getLocalAssets(companyId);
      setAssets(localData);
      setLoading(false);
      return;
    }

    // Realtime listener
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setAssets(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กำลังใช้ข้อมูลในเครื่อง');
          const localData = getLocalAssets(companyId);
          setAssets(localData);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to setup Firestore listener:', err);
      const localData = getLocalAssets(companyId);
      setAssets(localData);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [companyId]);

  const addAsset = useCallback(async (asset) => {
    try {
      if (!isFirebaseConfigured || !db) {
        const all = getAllLocalAssets();
        const newAsset = {
          ...asset,
          id: generateId(),
          companyId,
          createdAt: new Date().toISOString(),
        };
        all.push(newAsset);
        saveLocalAssets(all);
        setAssets(getLocalAssets(companyId));
        return;
      }

      await addDoc(collection(db, COLLECTION_NAME), {
        ...asset,
        companyId,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('เกิดข้อผิดพลาดในการเพิ่มทรัพย์สิน');
      throw err;
    }
  }, [companyId]);

  const updateAsset = useCallback(async (updatedAsset) => {
    try {
      if (!isFirebaseConfigured || !db) {
        const all = getAllLocalAssets();
        const idx = all.findIndex((a) => a.id === updatedAsset.id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...updatedAsset, updatedAt: new Date().toISOString() };
          saveLocalAssets(all);
          setAssets(getLocalAssets(companyId));
        }
        return;
      }

      const { id, ...data } = updatedAsset;
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating asset:', err);
      setError('เกิดข้อผิดพลาดในการแก้ไขทรัพย์สิน');
      throw err;
    }
  }, [companyId]);

  const deleteAsset = useCallback(async (id) => {
    try {
      if (!isFirebaseConfigured || !db) {
        const all = getAllLocalAssets().filter((a) => a.id !== id);
        saveLocalAssets(all);
        setAssets(getLocalAssets(companyId));
        return;
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('เกิดข้อผิดพลาดในการลบทรัพย์สิน');
      throw err;
    }
  }, [companyId]);

  const importAssets = useCallback(async (newAssets) => {
    try {
      if (!isFirebaseConfigured || !db) {
        const all = getAllLocalAssets();
        const toAdd = newAssets.map((asset) => ({
          ...asset,
          id: generateId(),
          companyId,
          createdAt: new Date().toISOString(),
        }));
        all.push(...toAdd);
        saveLocalAssets(all);
        setAssets(getLocalAssets(companyId));
        return;
      }

      const promises = newAssets.map((asset) =>
        addDoc(collection(db, COLLECTION_NAME), {
          ...asset,
          companyId,
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error('Error importing assets:', err);
      setError('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      throw err;
    }
  }, [companyId]);

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
