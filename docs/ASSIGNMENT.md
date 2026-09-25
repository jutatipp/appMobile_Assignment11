# ประยุกต์ Assignment Week 1–11 เป็น Nong Khai Trip

ขอบเขตที่ผู้ใช้เลือก: แอปแพลนทริปเที่ยวหนองคาย ใช้ธีมล่าสุด เพิ่มสถานที่เข้าทริป และเก็บภาพความทรงจำในแต่ละทริป กล้องใช้โค้ด Photo_camera-_expo ของผู้ใช้

บทเรียนต้นฉบับใช้ Campus Events; ตารางนี้อธิบายการประยุกต์เป็น Trip ไม่ได้อ้างว่าโครงสร้างธุรกิจเหมือน Lab ตรงตัว หรือผู้สอนรับรองการเปลี่ยนแล้ว

| Week / เปิดบทเรียน                                       | หัวข้อ                            | นำมาใส่ในระบบตรงไหน                                                          | เปิดดูโค้ด                                                                                                |
| -------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [1](https://tanapattara.github.io/react_native/week-01)  | React Native, Expo, TypeScript    | ตั้งโปรเจกต์มือถือและหน้าโปรไฟล์                                             | [Profile](<../app/(tabs)/profile.tsx>)                                                                    |
| [2](https://tanapattara.github.io/react_native/week-02)  | Components, Props, State, Events  | การ์ดสถานที่ ปุ่มหัวใจ และ callback เปลี่ยนรายการโปรด                        | [PlaceCard](../src/components/PlaceCard.tsx)                                                              |
| [3](https://tanapattara.github.io/react_native/week-03)  | Styling และ Responsive UI         | ธีมกลาง รายการแบบ FlatList ปรับคอลัมน์ตามจอ และ Loading/Empty/Error          | [PlaceList](../src/components/PlaceList.tsx), [Theme](../src/theme/index.ts)                              |
| [4](https://tanapattara.github.io/react_native/week-04)  | Expo Router และ Navigation        | Tabs/Stack หน้ารายละเอียดตาม ID และกลับไปทริปหลังล็อกอิน                     | [Layout](../app/_layout.tsx), [รายละเอียด](../app/places/[id].tsx)                                        |
| [5](https://tanapattara.github.io/react_native/week-05)  | Forms และ State Management        | ฟอร์มชื่อ/วันไป–กลับ ตรวจช่วงเวลา แบ่งวันเที่ยว และกันบันทึกซ้ำ              | [ฟอร์มทริป](../app/trips/edit.tsx), [TripContext](../src/context/TripContext.tsx)                         |
| [6](https://tanapattara.github.io/react_native/week-06)  | REST API และ Networking           | โหลดสถานที่ สร้าง/แก้ไข/ลบทริป ส่งภาพ ตรวจข้อมูลและจัดการ error              | [API client](../src/services/api.ts), [Server](../server/index.mjs)                                       |
| [7](https://tanapattara.github.io/react_native/week-07)  | Local Storage และ Offline         | AsyncStorage เก็บรายการโปรด; SQLite เก็บ cache และคิวภาพรอส่ง                | [Storage](../src/services/storage.ts), [Trip storage](../src/services/tripStorage.ts)                     |
| [8](https://tanapattara.github.io/react_native/week-08)  | Authentication และ Security       | Login, Remember Me, SecureStore, session หมดอายุ และ API ตรวจเจ้าของทริป     | [AuthContext](../src/context/AuthContext.tsx), [Login](../app/login.tsx)                                  |
| [9](https://tanapattara.github.io/react_native/week-09)  | Camera, Image Picker, Permissions | ถ่าย/เลือกรูป ขอสิทธิ์ เลือกโทน preview บันทึกและส่งภาพของทริป               | [TripCamera](../src/components/TripCamera.tsx), [Memory photos](../src/services/memoryPhotos.ts)          |
| [10](https://tanapattara.github.io/react_native/week-10) | Location และ Maps                 | ตำแหน่งปัจจุบัน หมุดสถานที่ แผนที่ทริปเต็มจอ และฟอร์มเลือกหมุด               | [Map](<../app/(tabs)/map.tsx>), [TripMap](../src/components/TripMap.tsx), [Create](../app/create.tsx)     |
| [11](https://tanapattara.github.io/react_native/week-11) | Notifications และ Platform APIs   | เตือนเวลาเที่ยว ทดลองเตือน 10 วินาที ยกเลิก/ตั้งใหม่ และแตะแจ้งเตือนเปิดทริป | [Notifications](../src/services/notifications.ts), [Observer](../src/components/NotificationObserver.tsx) |

## สิ่งที่นำมาประยุกต์

- ฟอร์มลงทะเบียนกิจกรรม → ฟอร์มสร้างและจัดการทริป
- Event API → Place/Trip API พร้อมตรวจเจ้าของและบันทึกภาพ
- ภาพกิจกรรม → อัลบั้มความทรงจำภายในแต่ละทริป ไม่บังคับภาพปกก่อนสร้าง
- เตือนก่อนกิจกรรม → เตือนเมื่อถึงเวลาเที่ยวแต่ละสถานที่
- UI ภาพอ้างอิงใช้เป็นแนวทางภาพ/การ์ด/สี ไม่เพิ่มโรงแรม เที่ยวบิน ชำระเงิน หรือบริการจอง

## หลักฐานก่อนส่ง

- [ ] ชื่อและรหัสผู้จัดทำจริง
- [ ] Clone/install/run จาก commit ที่ส่งจริง
- [ ] ภาพสองขนาดจอและ font scale 150%
- [ ] วิดีโอเพิ่มสถานที่ → สร้าง/เลือกทริป → เรียงสถานที่ → ดูแผนที่
- [ ] วิดีโอ Login/Logout/restore/expiry และการป้องกันทริป
- [ ] วิดีโอ offline/restart และ Favorite/Trip/ภาพรอส่งยังอยู่
- [ ] วิดีโอกล้อง/คลังภาพ/เปลี่ยนโทน/บันทึก ทั้งอนุญาต ปฏิเสธ และยกเลิก
- [ ] วิดีโอแจ้งเตือน foreground/background/cold start และ ID ไม่ถูกต้อง
- [ ] เปิด Development Build ตาม Lab 8 บนอุปกรณ์จริง

มีโค้ดครอบคลุมหัวข้อไม่เท่ากับผ่านการทดสอบบนมือถือครบ ดูสถานะใน TESTING.md
