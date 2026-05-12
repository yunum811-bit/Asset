import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: ใส่ค่า config จาก Firebase Console ของคุณ
// ไปที่ https://console.firebase.google.com → สร้างโปรเจกต์ → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
