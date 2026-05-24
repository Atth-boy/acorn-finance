# Suggestions — Business Pool feature (commit 28db1e1)

รายการสิ่งที่ต้องแก้จาก /scrutinize เรียงตาม severity
สถานะ: ☐ ยังไม่แก้ · 🔧 กำลังแก้ · ✅ เสร็จ

---

## 🔴 BLOCKER 1 — Stale `businessData.members` → ลบข้อมูลของ partner คนอื่นโดยไม่ตั้งใจ

**สถานะ:** ✅ เสร็จ

**ปัญหา**
- `App.jsx` โหลด `getBusinessByCode` ครั้งเดียวตอน mount แล้วไม่ subscribe `businessDoc` (App.jsx:137-145 มีแค่ `subscribeTxns`)
- `SettingsScreen` คำนวณ `isBusinessLast = businessMemberCount <= 1` จาก state ที่ frozen ตั้งแต่ mount

**Scenario ที่พังจริง**
1. A สร้างคลัง → ส่งรหัสให้ B
2. B `joinBusiness`
3. A ยังเห็น state เดิม (`members=[A]`) → คิดว่าเป็นคนเดียว
4. A กดออก → `handleLeaveBusiness` (SettingsScreen.jsx:85-95) เรียก `deleteBusiness`
5. ลบทั้ง txns + doc ทั้งหมด **รวมถึงที่ B บันทึกไป** — silent, irreversible

**วิธีแก้ (แนะนำทั้งสอง)**
- [x] เพิ่ม `businessLib.subscribeBusiness` (live snapshot ของ doc) แล้ว wire ใน App.jsx + create/join/leave handlers — `businessData.members` sync ตลอด
- [x] `businessLib.deleteBusiness` re-fetch doc + guard `if others.length > 0 → return { ok:false, reason:'has_other_members' }` (server-side defense in depth)
- [x] SettingsScreen `handleLeaveBusiness` ถ้าโดน server refuse → fall back ไป `leaveBusiness` แทน (กัน user ติด)

**หมายเหตุ** family ก็มีปัญหาเดียวกัน — ยังไม่แก้ ค่อยทำพร้อม MAJOR 4/6 ทีหลัง

---

## 🔴 BLOCKER 2 — Receipt UI เป็น dead code

**สถานะ:** ✅ เสร็จ

**ปัญหา**
- `BusinessEntryScreen.jsx:84-88` `handleFileChange` ทำแค่ `URL.createObjectURL(file)` แล้วเก็บใน state
- `submit()` (line 90-109) ไม่อ่าน `receipt` เลย → ไม่มี `receiptImg`/`receiptPath` ใน payload, ไม่มี call ไปที่ `storage.uploadReceipt`
- เทียบกับ EntryScreen.jsx:119,139 (personal) ที่ใส่ `receiptImg` + App.jsx:162-164 upload ขึ้น Storage

**Impact**
- User แนบ invoice → เห็น preview → กด "บันทึกคลังธุรกิจ" → invoice หายเฉย ๆ
- สำหรับธุรกิจ (ต้องเก็บใบกำกับภาษีตามกฎหมาย) เลวร้ายกว่าฝั่งครอบครัว

**วิธีแก้ — ทำให้ใช้งานจริง**
- [x] `businessLib.uploadReceipt(code, dataUrl, txnId)` — upload ไปที่ `businesses/{code}/receipts/{txnId}`
- [x] `businessLib.deleteBusinessTxn(code, txnId, receiptPath)` — ลบไฟล์ Storage ก่อนลบ doc
- [x] `businessLib.deleteBusiness` — cleanup ทุก receipt ก่อน batch delete (best-effort)
- [x] `BusinessEntryScreen` — `compressImage` inline (canvas JPEG 60% max 800px), async file handler, `submitting` state กัน double-submit, ใส่ `receiptImg` ใน payload
- [x] `App.addBusinessTxn` — detect data URL → upload → swap เป็น download URL + เก็บ `receiptPath`
- [x] `App.deleteBusinessTxn` — ส่ง `txn.receiptPath` ไป lib
- [x] `WalletsScreen` page 3 detail sheet — render `selBizTxn.receiptImg`

**⚠️ ต้องเพิ่ม Firebase Storage Rules เอง** (path ใหม่: `businesses/{code}/receipts/{txnId}`)

ไปที่ Firebase Console → **Storage** → tab "Rules" (คนละที่กับ Firestore Rules) แล้วเพิ่ม block business เข้าไป:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ของเดิม — personal receipts
    match /users/{uid}/receipts/{txnId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // ของใหม่ — business receipts (partner ทุกคน read/write ได้)
    match /businesses/{code}/receipts/{txnId} {
      allow read, write: if request.auth != null;
    }

  }
}
```

หมายเหตุ: อันนี้คือ **Storage Rules** (wrapper `service firebase.storage`) — ไม่ใช่ Firestore Rules (wrapper `match /databases/{database}/documents`) อยู่คนละ tab

**หมายเหตุ** FamilyEntryScreen ก็เป็นแบบนี้ — fix family ด้วยพร้อมกัน (ยังไม่ทำ)

---

## 🟠 MAJOR 3 — `mode: 'schedule'` / `'monthly'` เป็น dead UI สำหรับ business

**สถานะ:** ✅ เสร็จ (เลือกแนวลบปุ่ม MODES)

**ปัญหา**
- `BusinessEntryScreen.jsx:37-41` มี modes 3 อัน (รายวัน/ตั้งเวลา/ทุกเดือน)
- `submit` ใส่ `mode`+`scheduleDate` ลง payload
- แต่ App.jsx มี fixed-expense processor เฉพาะ **personal** เท่านั้น (App.jsx:88-122 ใช้ `storage.upsertFixed` ของ user.uid)
- ไม่มี business fixed expense collection / processor

**Impact**
- User ตั้ง "ทุกเดือน" ค่าเช่า ฿10,000 — คาดว่า recur ทุกเดือน
- จริง ๆ บันทึกครั้งเดียว, เดือนถัดไปไม่มาเอง
- ค่าเช่า/เงินเดือนเป็น use case หลักของหน้าธุรกิจ — บอกผิดความหมาย

**วิธีแก้ — เลือกแนวลบ MODES (เร็ว)**
- [x] เช็คก่อนว่าไม่มีโค้ดไหนอ่าน `mode`/`scheduleDate` ของ business txn → ปลอดภัย
- [x] ลบ state `mode`/`showCalendar`/`scheduleDate`/`calYear`/`calMonth`, `handleModeSelect`, calendar helpers, `scheduleDateLabel`
- [x] ลบ section "ประเภทการจ่าย" (mode pills) + calendar modal ทั้งบล็อก
- [x] ลบ const `MODES`, `MONTH_NAMES` ที่ไม่ใช้แล้ว
- [x] submit hardcode `mode: 'daily'` (คงไว้เพื่อ shape เดียวกับ txn อื่น)

**หมายเหตุ** ถ้าอยากได้ recurring จริงทีหลัง → ทำ `businessFixed` collection + processor loop ใน App.jsx (feature ใหม่ แยก task)

---

## 🟠 MAJOR 4 — `isMe` flag ถูกเก็บเป็น stored value (ควรเป็น computed)

**สถานะ:** ✅ เสร็จ

**ปัญหา**
- `business.js:28` (creator) ใส่ `isMe: true` ตอนสร้าง
- `business.js:46-49` (joiner) **ไม่ใส่**
- `WalletsScreen.jsx:1154` render `{m.isMe && <div>(ฉัน)</div>}` ตามค่าใน array

**Impact**
- ทุก partner ที่เปิดดูคลังจะเห็น **ผู้สร้าง** ติด tag "(ฉัน)" ตลอด
- ตัวเองไม่ถูก tag → wrong identity attribution

**วิธีแก้**
- [x] WalletsScreen destructure `user` prop (App ส่งมาให้อยู่แล้ว) — render เปลี่ยนเป็น `m.uid === user?.uid` ทั้ง business + family
- [x] ลบ `isMe: true` ออกจาก `createBusiness` (business.js) และ `createFamily` (family.js)

**หมายเหตุ**
- แก้ family พร้อมแล้ว (WalletsScreen.jsx members render ทั้งสอง)
- `FAMILY_MOCK_MEMBERS` (mock revenue breakdown) ยังมี `isMe` แต่เป็น mock data คนละ code path — ไม่กระทบ
- ข้อมูลเก่าที่ stored `isMe: true` ไว้แล้วไม่ต้อง migrate — โค้ดเลิกอ่าน field นั้น, ใช้ uid แทน

---

## 🟠 MAJOR 5 — `createBusiness`/`joinBusiness` ไม่ guard ถ้า user มี business อื่นอยู่

**สถานะ:** ✅ เสร็จ

**ปัญหา**
- `business.js:37,51` write `profileDoc(user.uid).businessCode = newCode` ทันที
- ไม่ลบ user ออกจาก members[] ของ business เดิม

**Impact**
- User เคยอยู่คลัง X → ลืม → สร้าง/เข้าใหม่คลัง Y
- X ยังมี user เป็น member (ghost member ที่ไม่มีทางออก ยกเว้น admin manual cleanup)
- คลัง X ลด memberCount ไม่ลง → ถ้าคนสุดท้ายออก ไม่ trigger delete (ยังเหลือ ghost)

**วิธีแก้**
- [x] เพิ่ม helper `releaseCurrentBusiness(uid, exceptCode)` ใน business.js — เช็ค `userProfiles.businessCode`, ถ้ามี + ไม่ใช่ code ที่กำลังจะเข้า → ถอน user ออกจาก members ของคลังเดิม
- [x] เรียกที่ต้นของ `createBusiness` และ `joinBusiness` ก่อน setDoc/arrayUnion
- [x] Idempotent: ถ้า user join คลังที่ตัวเองอยู่แล้ว (cur === code) จะ skip — ไม่ก่อ side effect

**หมายเหตุ**
- family บั๊กเดียวกัน — ยังไม่แก้
- ของ business เลือก leave (ไม่ delete) ตอน auto-cleanup — ถ้า user เป็นสมาชิกคนเดียวของคลังเดิม จะเหลือ orphan doc ที่มี `members: []`. แก้ทีหลังถ้าจำเป็น (เพิ่มจริงๆ ก็แค่เปลี่ยน leave เป็น delete กรณี sole-member)

---

## 🟡 MINOR 6 — `leaveBusiness` read-modify-write race

**สถานะ:** ✅ เสร็จ

**ปัญหา**
- `business.js:74-80` อ่าน members → filter → writeback
- partners 2 คนกด "ออก" พร้อมกัน → write หลังจะ overwrite write แรก → user ที่ออกก่อนกลับมาอยู่ในรายชื่อ

**วิธีแก้**
- [x] อ่าน member object ของ uid ตัวเองออกมาก่อน (`mine`) แล้ว `arrayRemove(...mine)` — atomic write กัน race + ล้าง duplicate ในตัว
- [x] แก้ทั้ง `leaveBusiness` + `releaseCurrentBusiness` (business.js) และ `leaveFamily` (family.js)
- [x] import `arrayRemove` ทั้ง 2 ไฟล์

**หมายเหตุ** ทำไมไม่ใช้ `arrayRemove(memberObj)` ตรงๆ: members เป็น object, arrayRemove จับ deep-equality — ต้องส่ง object ที่ตรงเป๊ะกับที่ stored ไว้ จึงต้องอ่านมาก่อน

---

## 🟡 MINOR 7 — BIZ_INCOME_CATS / BIZ_EXPENSE_CATS declare ซ้ำ 3 ที่ + shape ไม่ตรงกัน

**สถานะ:** ✅ เสร็จ

**ตำแหน่ง**
- `BusinessEntryScreen.jsx:11-33` (แยก base + EXTRA)
- `WalletsScreen.jsx:38-56` (รวมเป็น list เดียว, มี `color`)
- `ReportsScreen.jsx` (รวมเป็น list, ไม่มี color)

**ปัญหา**
- label ภาษาไทยต้องตรง 100% ทั้งสามที่ ICONS map ใน ReportsScreen ถึงทำงาน
- ครั้งหน้าเพิ่มหมวด จะลืมแน่

**วิธีแก้**
- [x] สร้าง `src/lib/businessCats.js` — export `BIZ_INCOME_CATS` (มี color), `BIZ_EXPENSE_BASE`, `BIZ_EXPENSE_EXTRA`, `BIZ_EXPENSE_CATS` (base+extra รวม)
- [x] WalletsScreen / ReportsScreen import `BIZ_INCOME_CATS` + `BIZ_EXPENSE_CATS`
- [x] BusinessEntryScreen import 4 ตัว — display grid ใช้ `BIZ_EXPENSE_BASE`, submit lookup ใช้ `BIZ_EXPENSE_CATS` (รวม)
- [x] ReportsScreen `COLORS` map (label→สี สำหรับ donut) ไม่แตะ — คนละ concern

---

## 🟡 MINOR 8 — `CCB` palette duplicated

**สถานะ:** ✅ เสร็จ

**ตำแหน่ง**
- `BusinessEntryScreen.jsx:5-9` (5 colors)
- `WalletsScreen.jsx:20-29` (8 colors)
- ตัวเลขเดียวกัน

**วิธีแก้**
- [x] เพิ่ม `export const CCB` ใน `src/tokens.js` คู่กับ `CC`
- [x] WalletsScreen ลบ local CCB → `import { CCB } from '../tokens'`
- [x] BusinessEntryScreen ลบ hex literals → `BZ`/`BZ_DEEP`/... ชี้ไป `CCB.slate`/`CCB.slateDeep`/... (เก็บชื่อ alias ที่อ่านง่ายไว้ ลด churn)

---

## 📌 ภาพรวม / Simpler Alternative (out of scope, จดไว้ก่อน)

- Business pool ≈ Family pool 90% — copy ของ `family.js` แทบทั้ง file
- ทางที่เล็กกว่าในอนาคต: `poolLib(collectionName, profileKey)` factory + `<PoolEntryScreen type="business"/>`
- ลด ~700 LOC duplication, ป้องกัน drift
- ถ้าจะเพิ่ม pool ที่สี่ (โปรเจกต์/ชมรม) ควรรีแฟกเตอร์ก่อน

---

## ลำดับแนะนำในการแก้

1. BLOCKER 1 (stale members) — ป้องกัน data loss ก่อนทุกอย่าง
2. BLOCKER 2 (receipt UI) — ตัดสินใจก่อนว่าจะทำจริงหรือลบ
3. MAJOR 5 (guard create/join) — ป้องกัน ghost member
4. MAJOR 4 (isMe computed) — fix ทีเดียวกับ family ใน WalletsScreen
5. MAJOR 3 (dead modes) — เร็ว ลบปุ่มไปก่อน
6. MINOR 6 (arrayRemove) — เล็ก แก้พร้อม leaveBusiness/leaveFamily
7. MINOR 7-8 (refactor cats/palette) — cleanup สุดท้าย
