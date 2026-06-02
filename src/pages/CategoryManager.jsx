import React, { useState, useEffect } from 'react';
import { getCategories, saveCategories } from '../utils/categories';
import './CategoryManager.css';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrefix, setEditPrefix] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setCategories(getCategories());
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPrefix.trim()) {
      showMessage('❌ กรุณากรอกชื่อหมวดหมู่และรหัส prefix');
      return;
    }

    const prefix = newPrefix.trim().toUpperCase();
    if (categories.find((c) => c.prefix === prefix)) {
      showMessage('❌ รหัส prefix นี้มีอยู่แล้ว');
      return;
    }

    const updated = [...categories, { id: prefix, name: newName.trim(), prefix }];
    setCategories(updated);
    saveCategories(updated);
    setNewName('');
    setNewPrefix('');
    showMessage('✅ เพิ่มหมวดหมู่เรียบร้อยแล้ว');
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditPrefix(cat.prefix);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrefix('');
  };

  const saveEdit = (oldId) => {
    if (!editName.trim() || !editPrefix.trim()) {
      showMessage('❌ กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const prefix = editPrefix.trim().toUpperCase();
    // ตรวจ prefix ซ้ำ (ยกเว้นตัวเอง)
    if (categories.find((c) => c.prefix === prefix && c.id !== oldId)) {
      showMessage('❌ รหัส prefix นี้มีอยู่แล้ว');
      return;
    }

    const updated = categories.map((c) =>
      c.id === oldId ? { id: prefix, name: editName.trim(), prefix } : c
    );
    setCategories(updated);
    saveCategories(updated);
    setEditingId(null);
    showMessage('✅ แก้ไขหมวดหมู่เรียบร้อยแล้ว');
  };

  const handleDelete = (id) => {
    if (!window.confirm('ต้องการลบหมวดหมู่นี้หรือไม่?')) return;
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    saveCategories(updated);
    showMessage('✅ ลบหมวดหมู่เรียบร้อยแล้ว');
  };

  return (
    <div className="category-manager-page">
      <h1>🏷️ จัดการหมวดหมู่ทรัพย์สิน</h1>
      <p className="subtitle">เพิ่ม แก้ไข หรือลบหมวดหมู่และรหัส prefix สำหรับสร้างรหัสทรัพย์สินอัตโนมัติ</p>

      {message && <div className="cat-message">{message}</div>}

      {/* ตารางหมวดหมู่ */}
      <div className="cat-table-wrapper">
        <table className="cat-table">
          <thead>
            <tr>
              <th>รหัส Prefix</th>
              <th>ชื่อหมวดหมู่</th>
              <th>ตัวอย่างรหัสทรัพย์สิน</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                {editingId === cat.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editPrefix}
                        onChange={(e) => setEditPrefix(e.target.value.toUpperCase())}
                        className="cat-input-sm"
                        maxLength={5}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="cat-input-sm"
                      />
                    </td>
                    <td className="cat-example">{editPrefix.toUpperCase()}-001</td>
                    <td>
                      <button className="btn-save-cat" onClick={() => saveEdit(cat.id)}>💾</button>
                      <button className="btn-cancel-cat" onClick={cancelEdit}>✕</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td><span className="prefix-badge">{cat.prefix}</span></td>
                    <td>{cat.name}</td>
                    <td className="cat-example">{cat.prefix}-001</td>
                    <td>
                      <button className="btn-edit-cat" onClick={() => startEdit(cat)}>✏️</button>
                      <button className="btn-delete-cat" onClick={() => handleDelete(cat.id)}>🗑️</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มเพิ่มหมวดหมู่ */}
      <form className="add-category-form" onSubmit={handleAdd}>
        <h3>➕ เพิ่มหมวดหมู่ใหม่</h3>
        <div className="add-cat-row">
          <input
            type="text"
            placeholder="รหัส prefix เช่น VH"
            value={newPrefix}
            onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
            maxLength={5}
            className="cat-input"
          />
          <input
            type="text"
            placeholder="ชื่อหมวดหมู่ เช่น ยานพาหนะ"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="cat-input wide"
          />
          <button type="submit" className="btn-add-cat">เพิ่ม</button>
        </div>
        {newPrefix && (
          <p className="add-cat-preview">ตัวอย่างรหัส: <strong>{newPrefix.toUpperCase()}-001</strong></p>
        )}
      </form>
    </div>
  );
}

export default CategoryManager;
