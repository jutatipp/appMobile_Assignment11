# ตารางเชื่อมโยง Assignment Week 1–11

แนวคิด: จากแผนที่สถานที่หนองคายเดิม พัฒนาเป็น “Nong Khai Explore” ที่แนะนำกิจกรรมตามสถานที่ ผู้ใช้เก็บรายการที่สนใจ ลงทะเบียน และตั้งเตือนได้ในแอปเดียว

ตารางนี้อธิบายสิ่งที่ implement แล้ว ไม่ใช่การรับรองผลทดสอบมือถือทั้งหมด ดูสถานะการตรวจจริงใน TESTING.md

| Week | นำมาใช้ในแอป                                                         | ไฟล์สำคัญ                                                                      | หลักฐานที่ควรบันทึก                                 |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1    | Expo SDK 57, TypeScript, โปรไฟล์, assets, README                     | `app/(tabs)/profile.tsx`, `package.json`                                       | เปิดแอปบน emulator/มือถือและหน้าโปรไฟล์             |
| 2    | การ์ดรับ typed props, callback และ Favorite state                    | `src/components/EventCard.tsx`, `src/types/event.ts`                           | กดเปิดรายละเอียดและเปลี่ยน Favorite                 |
| 3    | FlatList, 1/2 คอลัมน์ตามขนาดจอ, SafeArea, Loading/Empty/Error        | `src/components/EventList.tsx`, `src/components/ui.tsx`                        | หน้าจอสองขนาด ตัวอักษร 150% และสถานะต่าง ๆ          |
| 4    | Tabs, Stack, dynamic ID, deep link, not found                        | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/events/[id].tsx`             | Tabs → Detail → Back และ valid/invalid deep link    |
| 5    | ค้นหาแบบ derived value, Context, validation, keyboard handling       | `src/context/AppContext.tsx`, `app/register.tsx`, `app/create.tsx`             | ฟอร์มผิด/ถูก กดซ้ำ และส่งไม่สำเร็จแล้วข้อมูลยังอยู่ |
| 6    | GET list/detail, POST registration, แยก service, abort/timeout/Retry | `src/services/api.ts`, `server/index.mjs`                                      | Online, offline, error, slow, invalid response      |
| 7    | AsyncStorage สำหรับ Favorite, SQLite สำหรับ cache จริง               | `src/services/storage.ts`                                                      | ปิดเน็ต รีสตาร์ต แล้วเปิดข้อมูลเก่า/Favorite        |
| 8    | Login API, SecureStore, restore, protected screens, logout, expiry   | `src/context/AuthContext.tsx`, `app/login.tsx`, `server/index.mjs`             | Login → Register → Restart → Restore → Logout       |
| 9    | ถ่ายภาพ/เลือกจากคลัง Preview/Replace/Remove และ upload จำลอง         | `src/components/CameraCapture.tsx`, `src/services/device.ts`, `app/create.tsx` | Granted, Denied, Canceled โดยฟอร์มยังอยู่           |
| 10   | แผนที่ venue ไม่ขึ้นกับสิทธิ์ตำแหน่ง, current location, manual pin   | `src/components/VenueMap.tsx`, `app/(tabs)/map.tsx`, `app/create.tsx`          | venue map, current location, manual selection       |
| 11   | Local reminder 30 นาที, cancel ID, Android channel, cold start       | `src/services/notifications.ts`, `src/components/NotificationObserver.tsx`     | schedule → receive → open detail และ invalid ID     |

## ขอบเขตกับโจทย์ตัวอย่าง

บทเรียนใช้ Campus Events; โปรเจกต์นี้ประยุกต์เป็นกิจกรรมท่องเที่ยวชุมชน ฟอร์มลงทะเบียนและสร้างกิจกรรมอยู่ในเรื่องราวเดียวกับแผนที่เดิม

- SQLite ใช้เป็น cache จริง มากกว่า proof-of-concept อย่างเดียว
- กล้องเริ่มจาก action ที่ผู้ใช้เลือก ไม่ขอ permissions ตั้งแต่เปิดแอป
- API upload จำลองรับ data URL และเก็บภาพในข้อมูลกิจกรรมเพื่อความง่าย ไม่ได้ใช้บริการ object storage
- Local notification ไม่ต้องมี push token; Remote Push และ biometrics เป็นงานต่อยอด ไม่ได้ implement
- Development Build มี dependency/config และคู่มือ แต่ต้อง build/ติดตั้งจริงด้วยเครื่องหรือบัญชี Expo ของผู้ส่งงาน
- ขั้นตอนส่ง repository จริงและหลักฐานมือถือยังต้องให้ผู้ส่งงานเติมข้อมูลของตนเอง

## รายการก่อนส่ง

- [ ] ระบุชื่อและรหัสนักศึกษาใน README/หน้าโปรไฟล์
- [ ] Push repository พร้อม source code และ lockfile
- [ ] ระบุ URL repository จริง และตั้งสิทธิ์ให้อาจารย์เข้าถึง
- [ ] ทดลอง clone ใหม่ ติดตั้ง เปิด API และเปิดแอป
- [ ] บันทึกภาพสองขนาดหน้าจอ และวิดีโอเส้นทางหลัก
- [ ] บันทึกผลทดสอบสิทธิ์อุปกรณ์, offline และ notification
- [ ] เปิด Development Build ด้วย `npm run dev-client` ให้ดูได้
- [ ] อธิบาย flow, state ownership, storage และ permission diagrams ได้
