import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AssetForm.css';

function AssetForm({ onSubmit, assets, isEdit }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    assetCode: '',
    name: '',
    category: '',
    location: '',
    owner: '',
    purchaseDate: '',
    value: '',
    usefulLifeYears: '',
    salvageValue: '',
    status: 'ใช้งาน',
  });
  const [images, setImages] = useState([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // โหลดข้อมูลเดิมเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    if (isEdit && id && assets) {
      const asset = assets.find((a) => a.id === id || a.id === Number(id));
      if (asset) {
        setFormData({
          assetCode: asset.assetCode || '',
          name: asset.name || '',
          category: asset.category || '',
          location: asset.location || '',
          owner: asset.owner || '',
          purchaseDate: asset.purchaseDate || '',
          value: asset.value || '',
          usefulLifeYears: asset.usefulLifeYears || '',
          salvageValue: asset.salvageValue || '',
          status: asset.status || 'ใช้งาน',
        });
        setImages(asset.images || []);
      }
    }
  }, [isEdit, id, assets]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // จัดรูปแบบตัวเลขใส่ลูกน้ำ
  const formatNumber = (value) => {
    const num = String(value).replace(/[^0-9]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString();
  };

  const handleMoneyChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, [e.target.name]: raw });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 2;
    const remaining = maxImages - images.length;

    if (remaining <= 0) {
      alert('สามารถอัปโหลดรูปภาพได้สูงสุด 2 รูป');
      return;
    }

    const filesToAdd = files.slice(0, remaining);

    filesToAdd.forEach((file) => {
      // จำกัดขนาดไฟล์ 500KB เพื่อไม่ให้ Firestore document เกิน limit
      if (file.size > 500 * 1024) {
        alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 500KB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // ป้องกัน double-submit

    if (!formData.assetCode || !formData.name || !formData.category || !formData.value) {
      setErrorMsg('กรุณากรอกข้อมูลที่จำเป็น (รหัสทรัพย์สิน, ชื่อ, หมวดหมู่, มูลค่า)');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const assetData = {
      ...formData,
      value: Number(formData.value),
      usefulLifeYears: Number(formData.usefulLifeYears) || 5,
      salvageValue: Number(formData.salvageValue) || 0,
      images: images,
    };

    try {
      if (isEdit) {
        await onSubmit({ ...assetData, id: id });
      } else {
        await onSubmit(assetData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/assets');
      }, 1500);
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
      setSubmitting(false);
    }
  };

  return (
    <div className="asset-form-page">
      <h1>{isEdit ? '✏️ แก้ไขทรัพย์สิน' : '➕ เพิ่มทรัพย์สินใหม่'}</h1>
      <p className="subtitle">
        {isEdit ? 'แก้ไขข้อมูลทรัพย์สินที่เลือก' : 'กรอกข้อมูลทรัพย์สินที่ต้องการลงทะเบียน'}
      </p>

      {errorMsg && (
        <div className="error-message">❌ {errorMsg}</div>
      )}

      <form className="asset-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-section-title">ข้อมูลทั่วไป</div>

          <div className="form-group">
            <label htmlFor="assetCode">รหัสทรัพย์สิน <span className="required">*</span></label>
            <input
              id="assetCode"
              name="assetCode"
              type="text"
              value={formData.assetCode}
              onChange={handleChange}
              placeholder="เช่น IT-001"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">ชื่อทรัพย์สิน <span className="required">*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="เช่น คอมพิวเตอร์ตั้งโต๊ะ"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">หมวดหมู่ <span className="required">*</span></label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              <option value="อุปกรณ์ IT">อุปกรณ์ IT</option>
              <option value="เฟอร์นิเจอร์">เฟอร์นิเจอร์</option>
              <option value="ยานพาหนะ">ยานพาหนะ</option>
              <option value="เครื่องใช้สำนักงาน">เครื่องใช้สำนักงาน</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">สถานะ</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="ใช้งาน">ใช้งาน</option>
              <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
              <option value="ปลดระวาง">ปลดระวาง</option>
            </select>
          </div>

          <div className="form-section-title">สถานที่ & ผู้ครอบครอง</div>

          <div className="form-group">
            <label htmlFor="location">สถานที่</label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="เช่น ห้อง 101"
            />
          </div>

          <div className="form-group">
            <label htmlFor="owner">ผู้ครอบครอง</label>
            <input
              id="owner"
              name="owner"
              type="text"
              value={formData.owner}
              onChange={handleChange}
              placeholder="เช่น สมชาย ใจดี"
            />
          </div>

          <div className="form-section-title">มูลค่า & ค่าเสื่อม</div>

          <div className="form-group">
            <label htmlFor="purchaseDate">วันที่ซื้อ</label>
            <input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="value">มูลค่า (บาท) <span className="required">*</span></label>
            <input
              id="value"
              name="value"
              type="text"
              inputMode="numeric"
              value={formatNumber(formData.value)}
              onChange={handleMoneyChange}
              placeholder="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="usefulLifeYears">อายุการใช้งาน (ปี)</label>
            <input
              id="usefulLifeYears"
              name="usefulLifeYears"
              type="number"
              value={formData.usefulLifeYears}
              onChange={handleChange}
              placeholder="เช่น 5"
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="salvageValue">มูลค่าซาก (บาท)</label>
            <input
              id="salvageValue"
              name="salvageValue"
              type="text"
              inputMode="numeric"
              value={formatNumber(formData.salvageValue)}
              onChange={handleMoneyChange}
              placeholder="0"
            />
          </div>

          <div className="form-section-title">รูปภาพ</div>

          <div className="form-group full-width">
            <label>แนบรูปภาพ (สูงสุด 2 รูป, ไม่เกิน 500KB/รูป)</label>
            <div
              className="image-upload-area"
              onClick={() => document.getElementById('imageInput').click()}
              role="button"
              tabIndex={0}
              aria-label="อัปโหลดรูปภาพ"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  document.getElementById('imageInput').click();
                }
              }}
            >
              <div className="upload-icon">📁</div>
              <p>คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
              <p>รองรับ JPG, PNG (สูงสุด 2 รูป, ไม่เกิน 500KB/รูป)</p>
            </div>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {images.length > 0 && (
              <div className="image-previews">
                {images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      aria-label={`ลบรูปที่ ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? '⏳ กำลังบันทึก...' : isEdit ? '💾 บันทึกการแก้ไข' : '💾 บันทึกทรัพย์สิน'}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate('/assets')}>
            ยกเลิก
          </button>
        </div>

        {success && (
          <div className="success-message">
            ✅ {isEdit ? 'แก้ไขทรัพย์สินเรียบร้อยแล้ว!' : 'บันทึกทรัพย์สินเรียบร้อยแล้ว!'} กำลังไปหน้ารายการ...
          </div>
        )}
      </form>
    </div>
  );
}

export default AssetForm;
