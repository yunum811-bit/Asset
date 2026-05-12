import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'assets';

export function useFirestore(companyId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Realtime listener — ข้อมูลอัปเดตทันทีเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssets(data);
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  const addAsset = async (asset) => {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...asset,
        companyId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      throw error;
    }
  };

  const updateAsset = async (updatedAsset) => {
    try {
      const { id, ...data } = updatedAsset;
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  };

  const deleteAsset = async (id) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  };

  const importAssets = async (newAssets) => {
    try {
      const promises = newAssets.map((asset) =>
        addDoc(collection(db, COLLECTION_NAME), {
          ...asset,
          companyId,
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error importing assets:', error);
      throw error;
    }
  };

  return {
    assets,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    importAssets,
  };
}
