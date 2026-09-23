# การตรวจงานและสาธิต Final

## ผลตรวจที่ทำได้ในสภาพแวดล้อมพัฒนา

- TypeScript: ผ่าน
- API integration tests: ผ่าน 3 ชุด ครอบคลุม list/detail, invalid ID, login, protected endpoint, validation, registration retry, logout, creation, persistence, capacity และ expired token
- Metro export Android/iOS: ผ่านจากสำเนาที่ติดตั้งใหม่ (JavaScript/assets ไม่ใช่ native install)
- Clean install: คัดลอกเฉพาะ source/config/assets ไปโฟลเดอร์ใหม่ ไม่มี node_modules/.env แล้ว npm ci ผ่าน; ไม่ได้ใช้ git clone เพราะ Git บนเครื่องติด Xcode license
- Expo Doctor: ผ่าน 21/21 checks บน SDK 57
- Prettier format check: ผ่าน
- Date validation: วันไม่มีจริง, เวลาเกินช่วง และ timezone ไทย ผ่าน
- **ยังไม่ได้ยืนยันด้วยการใช้งานบนมือถือหรือ Simulator**: เครื่องที่ใช้แก้โค้ดติด Xcode license และไม่มี Android SDK ที่ตำแหน่งมาตรฐาน
- **ยังไม่ได้ตรวจภาพหน้าจอที่ render จริง**: ต้องเปิดบนอุปกรณ์แล้วตรวจ layout ตามตารางด้านล่าง

ห้ามทำเครื่องหมายว่าผ่านจนกว่าจะทดสอบจริงและแนบหลักฐาน

## แบบบันทึกอุปกรณ์

| รายการ                         | ข้อมูลที่ผู้ส่งงานกรอก |
| ------------------------------ | ---------------------- |
| ผู้ทดสอบ / วันที่              |                        |
| Android รุ่น / OS / Emulator   |                        |
| iPhone รุ่น / iOS              |                        |
| Expo Go หรือ Development Build |                        |
| Commit ที่ทดสอบ                |                        |
| API URL (ห้ามใส่ secret)       |                        |

## Mobile checklist

| กรณี                                     | ผลที่คาดหวัง                                | ผลจริง / หลักฐาน |
| ---------------------------------------- | ------------------------------------------- | ---------------- |
| Clone → npm ci → server → npm start      | เปิดรายการ 10 กิจกรรมได้                    | รอทดสอบ          |
| ค้นหา/หมวดหมู่                           | กรองชื่อและอำเภอได้ ไม่มีข้อมูลแสดง Empty   | รอทดสอบ          |
| Favorite ในหลายหน้า                      | หัวใจและหน้า Favorites ตรงกัน               | รอทดสอบ          |
| ปิด/เปิดแอปใหม่                          | Favorite และ cache ยังอยู่                  | รอทดสอบ          |
| ปิดเครือข่ายหลังโหลดข้อมูล               | แสดง cache และเวลาอัปเดตล่าสุด              | รอทดสอบ          |
| offline ครั้งแรก ไม่มี cache             | ไม่ crash มีข้อความ/Retry                   | รอทดสอบ          |
| API หยุด/เปิดใหม่ + refresh              | มี error และโหลดกลับมาได้                   | รอทดสอบ          |
| รูปโหลดไม่ได้                            | แสดง placeholder ไม่ทำให้การ์ดหาย           | รอทดสอบ          |
| Android Back / header Back               | กลับหน้าก่อนหน้าได้ตามลำดับ                 | รอทดสอบ          |
| `nongkhai://events/bridge`               | เปิด Detail จากภายนอก                       | รอทดสอบ          |
| `nongkhai://events/missing`              | แสดง Not found                              | รอทดสอบ          |
| `/unknown-route`                         | หน้า fallback พร้อมกลับสำรวจ                | รอทดสอบ          |
| Login ผิด/ถูก                            | error ชัดเจน / กลับ intent เดิม             | รอทดสอบ          |
| เข้า register/create ก่อน Login          | พาไป Login โดยไม่เห็น protected form        | รอทดสอบ          |
| รีสตาร์ตแอป API ยังเปิด                  | Restore session ก่อนแสดง protected screen   | รอทดสอบ          |
| Logout / expired token                   | ล้าง session และขอ Login ใหม่               | รอทดสอบ          |
| ฟอร์มผิด/ส่งซ้ำ/ส่งขณะ offline           | error ใกล้ field; ไม่ส่งซ้ำ; ค่ากรอกยังอยู่ | รอทดสอบ          |
| สร้างกิจกรรมแล้ว refresh/restart         | กิจกรรมใหม่อยู่ใน API/SQLite                | รอทดสอบ          |
| Camera granted / denied / canceled       | ถ่ายรูปได้ หรือกลับฟอร์มโดยไม่เสียข้อมูล    | รอทดสอบ          |
| คลังภาพ: เลือก/ยกเลิก/เปลี่ยน/ลบ         | Preview ถูกต้อง ข้อมูลฟอร์มไม่หาย           | รอทดสอบ          |
| รูปเกินขนาด/ไฟล์ไม่รองรับ                | แสดง error ไม่ upload                       | รอทดสอบ          |
| Location granted / denied / GPS ไม่พร้อม | ดึงพิกัดหรือมี fallback เลือกหมุดเอง        | รอทดสอบ          |
| Venue map ขณะปฏิเสธ Location             | หมุดสถานที่ยังแสดงได้                       | รอทดสอบ          |
| แตะแผนที่/ลากหมุด                        | พิกัดในฟอร์มเปลี่ยนและส่งไป API             | รอทดสอบ          |
| Notification permission denied           | แจ้งสาเหตุ เปิด Settings ได้                | รอทดสอบ          |
| ตั้งเตือน / ยกเลิก                       | ID ใน OS เพิ่ม/ถูกลบตามที่เลือก             | รอทดสอบ          |
| ทดสอบแจ้งเตือน foreground                | ได้ banner และแตะเปิด Detail                | รอทดสอบ          |
| ทดสอบแจ้งเตือน background                | แตะกลับมาหน้า Detail                        | รอทดสอบ          |
| ทดสอบแจ้งเตือน cold start                | ปิดแอปหลังตั้งเตือน แล้วแตะเปิดได้          | รอทดสอบ          |
| notification ID ไม่ถูกต้อง/กิจกรรมหาย    | ไม่ crash หรือแสดง not found                | รอทดสอบ          |

Cold start: ใช้ swipe ปิดแอปตามปกติ การ Force stop ผ่าน Android Settings อาจระงับการแจ้งเตือนของแอป ไม่ควรนำมาเทียบกับ cold start ปกติ การส่งเตือนอาจคลาดเคลื่อนตาม OS/battery policy ไม่ใช่นาฬิกาปลุกที่รับประกันตรงวินาที

## Accessibility / UX checklist

- [ ] จอแคบ 320–390 dp: ข้อความและปุ่มไม่ล้น
- [ ] Tablet 700 dp ขึ้นไป: รายการเปลี่ยนเป็น 2 คอลัมน์
- [ ] Font scale 150%: หัวข้อ การ์ด ฟอร์ม และแถบล่างยังอ่านได้
- [ ] Safe Area: ไม่ทับ notch, status bar และ home indicator
- [ ] Keyboard: กรอกทุกช่องและเลื่อนถึงปุ่ม submit ได้
- [ ] TalkBack/VoiceOver: ชื่อปุ่มหัวใจ ชื่อกิจกรรม และ field อ่านเข้าใจได้
- [ ] Loading/Empty/Error ใช้ข้อความและ action ไม่สื่อด้วยสีอย่างเดียว
- [ ] ปุ่มหลัก/หัวใจมีพื้นที่แตะอย่างน้อย 44 dp
- [ ] ปฏิเสธ permission แล้วมีทางออก ไม่ติดอยู่ในหน้าขอสิทธิ์
- [ ] ตรวจความต่างสีจริงบนอุปกรณ์ทั้งหน้าจอสว่าง/มืด

## Network fault tests

เปิด API ในโหมดทดสอบ:

```bash
ENABLE_TEST_FAULTS=1 npm run server
```

ทดสอบ endpoint โดยไม่แก้ข้อมูลจริง:

```bash
curl -i -H 'x-test-fault: 500' http://localhost:3001/events
curl -i -H 'x-test-fault: invalid-json' http://localhost:3001/events
curl -i -H 'x-test-fault: invalid-shape' http://localhost:3001/events
curl -i -H 'x-test-fault: slow' http://localhost:3001/events
curl -i http://localhost:3001/events/does-not-exist
```

สำหรับดู error UI ให้ตั้ง `EXPO_PUBLIC_TEST_FAULT=500` (หรือ `invalid-json`, `invalid-shape`, `slow`) ใน `.env` แล้วรีสตาร์ต Expo จากนั้นกลับสำรวจแล้ว refresh ตัวแปรนี้ส่ง header เฉพาะ development เท่านั้น ลบตัวแปรออกเมื่อทดสอบเสร็จ

Missing configuration: export แอปโดยไม่ตั้ง `EXPO_PUBLIC_API_URL` และไม่มี Expo host URI แล้วตรวจข้อความ config; malformed response จะถูกปฏิเสธก่อนเขียน cache

## สคริปต์สาธิตประมาณ 5–8 นาที

1. เปิดหน้าสำรวจ อธิบายแนวคิดแอปเดียวจากงานเดิม
2. ค้นหาและกรองกิจกรรม เปิดรายละเอียด แล้วกลับด้วย Back
3. กดหัวใจ ดู Favorites และหน้าแผนที่
4. กดลงทะเบียนขณะยังไม่ Login → Login → กลับฟอร์มเดิม
5. ลองกรอกผิดแล้วแก้ให้ถูก ส่งลงทะเบียน
6. สร้างกิจกรรม ถ่าย/เลือกรูป และเลือกจุดนัดพบเอง
7. ตั้งเตือนทดลอง 10 วินาที ออกจากแอปแล้วแตะแจ้งเตือนกลับ
8. ปิดเครือข่าย เปิดรายการเก่ากับ Favorite และดู timestamp
9. อธิบายโครงสร้างไฟล์และตาราง Week 1–11

## หลักฐานที่ต้องแนบ

ภาพ Ready/Empty/Error, ภาพสองขนาดจอ, วิดีโอ happy path, permission denied/canceled, offline restart และ notification ทั้งสาม app states พร้อมผลทดสอบจริงในตาราง ห้ามใช้ผล Metro export แทนหลักฐานมือถือ

## การอัปเกรดเป็น SDK 57

ปรับ Expo, React Native, Router และ native modules ให้ตรงกับ Expo Go SDK 57 บน iPhone แล้ว ตรวจ TypeScript และ export Android/iOS ผ่าน เปลี่ยน splash screen ไปใช้ config plugin และรองรับ notification payload ที่ไม่มี data การติดตั้งครั้งล่าสุดรายงาน 14 moderate advisories และไม่มี high/critical โดยยังไม่ได้ใช้ audit fix --force

ผล clean install ด้านบนเป็นผลก่อนอัปเกรด SDK 54; หลังอัปเกรดตรวจติดตั้ง dependencies, Expo Doctor และ export ใหม่แล้ว แต่ยังต้องทดสอบหน้าจอและฮาร์ดแวร์บน iPhone จริง
