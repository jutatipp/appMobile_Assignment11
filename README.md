# Nong Khai Explore 🌿

แอปสำรวจสถานที่และกิจกรรมในหนองคาย พัฒนาต่อยอดจาก Nong Khai POI โดยรวม Assignment Week 1–11 ไว้ในแอปเดียว

ค้นหากิจกรรม → ดูรายละเอียดและแผนที่ → บันทึกรายการโปรด → เข้าสู่ระบบ → ลงทะเบียน → ตั้งเตือน และสร้างกิจกรรมพร้อมรูปกับจุดนัดพบ

> ข้อมูลกิจกรรมและบัญชีเป็นข้อมูลจำลองสำหรับการศึกษา ไม่ใช่บริการรับจองจริง รูปจาก Unsplash เป็นภาพประกอบบรรยากาศ ไม่ใช่ภาพยืนยันสถานที่

## เริ่มใช้งาน

### 1. สิ่งที่ต้องมี

- Node.js 22.13 ขึ้นไป (แนะนำ Node.js 22 LTS) และ npm
- Git
- Android Emulator หรือมือถือจริง
- Expo Go ที่รองรับ **SDK 57** สำหรับเริ่มทดลอง หรือ Development Build ของโปรเจกต์
- iOS Simulator / local iOS build ต้องมี macOS, Xcode และยอมรับข้อตกลง Xcode ด้วยตนเอง

### 2. Clone และติดตั้ง

```bash
git clone https://github.com/jutatipp/appMobile_Assignment11.git
cd appMobile_Assignment11
npm ci
```

มี `package-lock.json` สำหรับติดตั้ง dependency รุ่นเดียวกันทุกเครื่อง ไม่ต้องติดตั้ง Expo CLI แบบ global

### 3. เปิด API จำลอง — Terminal ที่ 1

```bash
npm run server
```

API เปิดที่ port `3001` และแสดง **อีเมลกับรหัสผ่านสาธิต** ใน Terminal รหัสผ่านสุ่มใหม่ทุกครั้งที่เริ่ม server หากต้องการกำหนดเอง ใช้ environment variable `DEMO_PASSWORD` (อย่างน้อย 6 ตัวอักษร) ไม่ใส่รหัสจริงใน source code

- กิจกรรมเริ่มต้น 10 แห่งสร้างอัตโนมัติจาก `src/data/events.json`
- วันกิจกรรมอยู่ในอนาคตนับจากวันที่เปิด API ครั้งแรก
- ข้อมูลกิจกรรม/ลงทะเบียนเก็บใน `server/data/database.json` และไม่เข้า Git
- Session มีอายุ 1 ชั่วโมง อยู่ใน memory ของ server; เมื่อรีสตาร์ต server ให้ Login ใหม่
- API นี้ใช้ภายในเครือข่ายส่วนตัวสำหรับสาธิต ไม่เปิดเป็นบริการ production

### 4. เปิดแอป — Terminal ที่ 2

**Expo Go SDK 57 บน iPhone จริงต้อง Login บัญชี Expo เดียวกันทั้งมือถือและคอมพิวเตอร์** ก่อนเปิดโปรเจกต์:

```bash
npx expo login
npx expo whoami
```

กรอกบัญชี Expo ของตนเองใน Terminal แล้วเปิด Expo Go บน iPhone → ไอคอนบัญชี → Sign in ด้วยบัญชีเดียวกัน บัญชีนี้แยกจากบัญชีสาธิต `student@example.com` ที่ใช้ Login ภายในแอป หากยังไม่มีบัญชี สมัครที่ https://expo.dev/signup

เมื่อ Login ทั้งสองฝั่งแล้ว กด Try again บนมือถือได้เลย หากเปลี่ยนไปใช้บัญชีอื่นให้รีสตาร์ต Expo ด้วย ดู [คำอธิบายจาก Expo](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)

```bash
npm start
```

มือถือกับคอมพิวเตอร์ใช้ Wi-Fi เดียวกัน แอปหา IP เครื่องที่เปิด Expo ให้อัตโนมัติ แล้วเรียก API port `3001`

หากต่อ API ไม่ได้ ให้คัดลอก `.env.example` เป็น `.env` และกำหนด:

```dotenv
# มือถือจริง: ใช้ LAN IP ของคอมพิวเตอร์ เช่น
EXPO_PUBLIC_API_URL=http://192.168.1.20:3001
```

| อุปกรณ์          | ตัวอย่าง API URL                   |
| ---------------- | ---------------------------------- |
| Android Emulator | `http://10.0.2.2:3001`             |
| iOS Simulator    | `http://localhost:3001`            |
| มือถือจริง       | `http://<LAN-IP-คอมพิวเตอร์>:3001` |

เปลี่ยน `.env` แล้วรีสตาร์ต Expo (`npm start -- --clear`) และตรวจว่า firewall อนุญาต port 3001 ภายใน LAN เปิด `http://<IP>:3001/health` ใน browser ของมือถือเพื่อเช็กการเชื่อมต่อได้

**Expo tunnel ส่งต่อเฉพาะ Metro ไม่ได้ส่งต่อ API port 3001** หากมือถืออยู่นอก LAN ต้องมี API URL ที่อุปกรณ์เข้าถึงได้เอง

แอปนี้รองรับ Android/iOS ไม่ได้ทำ web build เพราะใช้ native maps, SQLite และ SecureStore

## Development Build

Expo Go เหมาะสำหรับทดลองเบื้องต้น แต่การส่งงานควรทดสอบ Development Build โดยเฉพาะ permissions, deep links และการเปิดแอปจาก notification

### สร้างในเครื่อง

```bash
# ต้องมี Android Studio, SDK และ JDK ที่พร้อมใช้งาน
npx expo run:android

# macOS พร้อม Xcode และ CocoaPods
npx expo run:ios
```

หลังติดตั้งแอปบนอุปกรณ์:

```bash
npm run server
# อีก Terminal
npm run dev-client
```

### สร้างผ่าน EAS (ต้องใช้บัญชี Expo ของผู้ส่งงาน)

มี `eas.json` เตรียม development/preview profiles ไว้แล้ว ต้องเชื่อมโปรเจกต์กับบัญชีของตนก่อน:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile development --platform android
```

Android native build ต้องตั้ง `GOOGLE_MAPS_ANDROID_API_KEY` สำหรับ Maps SDK for Android และจำกัด key ตาม package `com.student.nongkhaiexplore` กับ SHA-1 ของ signing certificate ใน Google Cloud ส่วน iOS ใช้ Apple Maps ตามค่าเริ่มต้น

การเปลี่ยน native config, permission หรือ Maps key ต้อง build ใหม่ ไม่ใช่แค่ reload JavaScript หากส่ง APK แบบ preview ให้ตั้ง `EXPO_PUBLIC_API_URL` เป็น HTTPS URL ที่เข้าถึงได้ในเวลาตรวจงาน; URL แบบ LAN ในตัวอย่างเหมาะกับ Expo Go / development บนเครือข่ายทดสอบ

## ฟังก์ชัน

- สำรวจกิจกรรม ค้นหาชื่อ/อำเภอ กรองหมวดหมู่ และ pull-to-refresh
- รายละเอียดกิจกรรมพร้อมจุดนัดพบบนแผนที่
- รายการโปรดที่ยังอยู่หลังปิดแอป
- SQLite cache พร้อมเวลาอัปเดตและสถานะ Offline (ต้องโหลดสำเร็จอย่างน้อยหนึ่งครั้ง)
- Login, restore session, logout และหน้าที่ต้องเข้าสู่ระบบ
- ลงทะเบียนพร้อม validation และป้องกันข้อมูลซ้ำจากการกด/ส่งซ้ำ
- สร้างกิจกรรม เลือกรูปหรือถ่ายรูป Preview/Remove และเลือกพิกัดจากแผนที่
- ใช้ตำแหน่งปัจจุบันเมื่อผู้ใช้กดขอ พร้อมทางเลือกเมื่อไม่ให้สิทธิ์
- ตั้ง/ยกเลิก Local Notification ก่อนกิจกรรม 30 นาที และปุ่มทดลองใน 10 วินาที
- แตะ notification เปิดรายละเอียด ทั้งจาก background และ cold start
- Loading, Empty, Error, Retry และกรณี ID ไม่ถูกต้อง

## โครงสร้างโค้ด — อยากแก้อะไรเปิดตรงไหน

```text
app/                         หน้าจอและเส้นทาง Expo Router
  (tabs)/                    สำรวจ แผนที่ รายการโปรด โปรไฟล์
  events/[id].tsx             รายละเอียดกิจกรรม
  login.tsx                  ฟอร์มเข้าสู่ระบบ
  register.tsx               ฟอร์มลงทะเบียน
  create.tsx                 ฟอร์มสร้างกิจกรรม
src/
  components/                ปุ่ม ช่องกรอก การ์ด รายการ แผนที่ที่ใช้ซ้ำ
  context/                   state ร่วม: กิจกรรม Favorite และ session
  data/events.json            ข้อมูลตั้งต้น 10 สถานที่
  services/api.ts             HTTP requests และตรวจข้อมูลตอบกลับ
  services/storage.ts         AsyncStorage และ SQLite
  services/device.ts          คลังภาพ/ตำแหน่งและ permissions
  services/notifications.ts   ตั้งและยกเลิกเตือน
  theme/index.ts              สี ขนาดข้อความ และ style กลาง
  types/event.ts              รูปแบบข้อมูล TypeScript
  utils/                     จัดรูปแบบวันเวลาและตรวจข้อมูลฟอร์ม
server/                      API จำลอง Node.js ใช้เฉพาะ built-in modules
docs/                        ตาราง Week, แผนภาพ และคู่มือทดสอบก่อนส่ง
```

ไอคอนแอปแก้จาก `assets/brand.svg` แล้วรัน `npm run icons` ส่วนกล้องอยู่ใน `src/components/CameraCapture.tsx`

ใช้ function component, `useState`, Context และ service functions ตรงไปตรงมา ไม่ใช้ Redux หรือโครงสร้างหลายชั้นเกินจำเป็น หน้าจอไม่เรียก `fetch` หรือฐานข้อมูลโดยตรง

## คำสั่งตรวจงาน

```bash
npm run typecheck
npm test
npm run format:check
npx expo-doctor
npx expo export --platform android --platform ios
```

จัดรูปแบบโค้ดหลังแก้ไข:

```bash
npm run format
```

ผล export หมายถึงรวม JavaScript/assets ผ่าน **ยังไม่ใช่หลักฐานว่า native features ผ่านบนมือถือ** ดูรายการที่ต้องทดสอบจริงใน [คู่มือทดสอบ](docs/TESTING.md)

## เอกสารส่งงาน

- [Week 1–11 → ฟังก์ชัน → ไฟล์](docs/ASSIGNMENT.md)
- [โครงสร้าง เส้นทาง state และ API contract](docs/ARCHITECTURE.md)
- [กรณีทดสอบและสคริปต์สาธิต Final](docs/TESTING.md)

ก่อนส่งให้ใส่ชื่อ/รหัสนักศึกษาและ URL repository จริง เพิ่มภาพ/วิดีโอผลทดสอบจากอุปกรณ์ และตรวจจาก clone ใหม่อีกรอบ ห้ามส่ง `.env`, `node_modules` หรือ `server/data`

## อ้างอิง

- [บทเรียน React Native Week 1–11](https://tanapattara.github.io/react_native/week-11)
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Expo Location SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [Expo SQLite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
