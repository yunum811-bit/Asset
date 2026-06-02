# ระบบทะเบียนทรัพย์สิน (Asset Registry)

ระบบจัดการทรัพย์สินขององค์กร พร้อมคำนวณค่าเสื่อมราคาอัตโนมัติ

## วิธีติดตั้งบน Server ภายใน Office

### สิ่งที่ต้องการ
- **Node.js** v18 ขึ้นไป ([ดาวน์โหลด](https://nodejs.org/))

### ขั้นตอน

1. คัดลอกโฟลเดอร์โปรเจกต์ไปยังเครื่อง server

2. ติดตั้ง dependencies:
```bash
npm install
```

3. Build frontend:
```bash
npm run build
```

4. เริ่ม server:
```bash
npm start
```

5. เปิดเบราว์เซอร์ไปที่:
   - บนเครื่อง server: `http://localhost:3000`
   - จากเครื่องอื่นใน office: `http://<IP-ของ-Server>:3000`

### ตรวจสอบ IP ของ Server
```bash
ipconfig
```
ดูที่ IPv4 Address เช่น `192.168.1.100` แล้วแจ้งให้คนในทีมเปิด `http://192.168.1.100:3000`

### ให้ Server รันตลอด (Windows)
ใช้ [PM2](https://pm2.keymetrics.io/) หรือสร้างเป็น Windows Service:
```bash
npm install -g pm2
pm2 start server/index.js --name asset-registry
pm2 save
pm2 startup
```

### ข้อมูลเก็บที่ไหน
ไฟล์ `server/assets.db` — เป็นไฟล์ SQLite สามารถสำรองข้อมูลได้โดยคัดลอกไฟล์นี้

## ฟีเจอร์
- เพิ่ม/แก้ไข/ลบ ทรัพย์สิน
- คำนวณค่าเสื่อมราคาแบบเส้นตรงอัตโนมัติ
- Dashboard แสดงกราฟภาพรวม
- นำเข้า/ส่งออกข้อมูล (Excel, CSV, JSON)
- รองรับหลายบริษัท
- ใช้งานผ่านเบราว์เซอร์ ไม่ต้องติดตั้งอะไรบนเครื่องลูกข่าย
