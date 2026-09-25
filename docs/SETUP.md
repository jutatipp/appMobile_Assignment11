# ติดตั้ง ตั้งค่า และแก้ปัญหา

[← กลับ README](../README.md)

## ติดตั้งและรัน

ต้องมี Node.js **22.13 ขึ้นไป**, npm และ Expo Go ที่รองรับ SDK ของโปรเจกต์ หรือ Development Build ที่ตรงกัน ใน [package.json](../package.json) ระบุ **Expo ~57.0.0 / React Native 0.86.3**

```bash
git clone https://github.com/jutatipp/appNong-Khai-Trip_Assignment11.git "AppNong Khai Trip_Hybrid_Mobile"
cd "AppNong Khai Trip_Hybrid_Mobile"
npm ci
```

เปิดสอง Terminal ในโฟลเดอร์โปรเจกต์:

**Terminal 1 — API**

```bash
npm run server
```

**Terminal 2 — แอป**

```bash
npm start -- --lan
```

มือถือและคอมพิวเตอร์ต้องอยู่ Wi-Fi เดียวกัน เปิดแอปจาก QR ล่าสุด หาก Expo ต้องการบัญชี ให้ใช้ `npx expo login` และตรวจด้วย `npx expo whoami` บัญชี Expo แยกจากบัญชีที่ล็อกอินในแอป

| เข้าสู่ระบบในแอป | ค่า                 |
| ---------------- | ------------------- |
| อีเมล            | `jutatip@gmail.com` |
| รหัสผ่าน         | `123456`            |

เป็นบัญชีสาธิตหนึ่งบัญชี ผู้ดูแลสามารถเปลี่ยนรหัสด้วย `DEMO_PASSWORD` ความยาวอย่างน้อย 6 ตัวอักษร Remember Me เก็บ session ใน SecureStore; ถ้าไม่เลือกจะอยู่เฉพาะรอบเปิดแอป ยังไม่มีระบบสมัครสมาชิกหรือส่งอีเมลรีเซ็ตรหัสผ่าน

### ตั้งค่า API และแก้ปัญหาเชื่อมต่อ

แอปใช้ host ของ Expo เป็นที่อยู่ API อัตโนมัติ หากต้องกำหนดเอง คัดลอก [.env.example](../.env.example) เป็น `.env` แล้วใส่:

```dotenv
EXPO_PUBLIC_API_URL=http://<LAN-IP-คอมพิวเตอร์>:3001
```

หลังแก้ `.env` ให้หยุดและเปิด Expo ใหม่

| ใช้ที่ไหน                    | URL                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------ |
| ตรวจ API บนคอมพิวเตอร์       | [Health check](http://localhost:3001/health) ต้องได้ `{"ok":true}`             |
| ดูข้อมูลสถานที่บนคอมพิวเตอร์ | [Places API](http://localhost:3001/places)                                     |
| ตรวจ Metro บนคอมพิวเตอร์     | [Metro status](http://localhost:8081/status) ต้องได้ `packager-status:running` |
| iOS Simulator                | `http://localhost:3001`                                                        |
| Android Emulator             | `http://10.0.2.2:3001`                                                         |
| มือถือจริง                   | `http://<LAN-IP-คอมพิวเตอร์>:3001/health` แทนที่ LAN-IP ด้วย IP จริง           |

ลิงก์ localhost เปิดได้เมื่อรัน server บนเครื่องนั้นแล้ว ไม่ใช่เว็บแอปออนไลน์ บนมือถือ **localhost หมายถึงมือถือ** จึงต้องใช้ IP คอมพิวเตอร์

- ล็อกอินไม่ได้: ตรวจ Health check จากมือถือก่อน ตรวจบัญชี และดูว่า API ใช้โค้ดล่าสุดหรือไม่
- เปลี่ยนโค้ด server: หยุดแล้วรัน `npm run server` ใหม่
- API รีสตาร์ต: session เดิมถูกยกเลิก ต้องล็อกอินใหม่
- เปลี่ยน Wi-Fi: ตรวจ IP ใหม่แล้วสแกน QR ล่าสุด

## Development Build และตรวจงาน

```bash
npx expo run:android
# หรือบน macOS ที่ติดตั้ง Xcode และยอมรับ license แล้ว
npx expo run:ios
npm run dev-client
```

Android native map ต้องตั้ง `GOOGLE_MAPS_ANDROID_API_KEY` ตาม [app.config.ts](../app.config.ts) และจำกัด key ตาม package/signing certificate; iOS ใช้ Apple Maps เป็นค่าเริ่มต้น เปลี่ยน config plugin แล้วต้องสร้าง binary ใหม่

```bash
npm run typecheck
npm test
npm run format:check
npx expo-doctor
npx expo export --platform ios --platform android --output-dir /tmp/nongkhai-export
```

การ export ผ่านยืนยัน JavaScript/assets เท่านั้น ไม่แทนการทดสอบมือถือ ดูผลล่าสุดและรายการที่ยังรอใน [TESTING.md](TESTING.md)

ชื่อแอปและโฟลเดอร์หลักคือ `AppNong Khai Trip_Hybrid_Mobile` ส่วน npm package และ Expo slug ใช้ `appnong-khai-trip-hybrid-mobile` ชื่อแบรนด์ในหน้าจอคือ Nong Khai Trip
