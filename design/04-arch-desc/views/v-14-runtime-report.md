---
doc_id: V-14
caption: ลำดับการสร้างรายงานสรุปการจัดซื้อและการอ่าน audit trail
containers:
- CTN-03
- CTN-04
usecases:
- UC-09
- UC-10
operations:
- getSpendSummary
- listAuditLogs
errors:
- ERR-VAL-001
nfr:
- NFR-02
tables:
- audit_log
- purchase_request
- purchase_order
- department
- vendor
see:
- V-06
---

# รายงานสรุปการจัดซื้อและ audit trail

```mermaid
sequenceDiagram
    participant W as Web SPA
    participant A as API service
    participant D as SQL Server
    W->>A: GET /reports/spend-summary?from=..&to=..&groupBy=..
    A->>A: ตรวจสิทธิ์ (V-06) และตรวจช่วงวันที่
    A->>D: รวม PR และ PO ที่เข้าเงื่อนไขตามกลุ่ม
    D-->>A: แถวสรุป
    A-->>W: 200 SpendSummary
```

<!-- table: สูตรและลำดับการทำงานของรายงานและ audit trail -->
| ลำดับ | operation | การทำงานภายใน | ผลลัพธ์หรือข้อผิดพลาด |
|---|---|---|---|
| 1 | `getSpendSummary` | `from` ต้องไม่เกิน `to` | ผิด `422` `ERR-VAL-001` |
| 2 | `getSpendSummary` | PR ที่นับ: `created_at` (แปลงเป็นปฏิทิน Asia/Bangkok) อยู่ในช่วง `from`–`to` รวมวันสุดท้าย สถานะไม่ใช่ `DRAFT` หรือ `CANCELLED` และมี PO ที่ไม่ใช่ `DRAFT` หรือ `CANCELLED` อย่างน้อยหนึ่งใบ | PR ที่ยังไม่มี PO ไม่อยู่ในรายงาน |
| 3 | `getSpendSummary` | กลุ่มตาม `groupBy` (ไม่ส่งใช้ `department`): `department` คือหน่วยงานของ PR `vendor` คือผู้ขายของ PO `month` คือเดือน `YYYY-MM` ของ `created_at` ของ PR | เรียงตามชื่อกลุ่ม |
| 4 | `getSpendSummary` | `prCount` = จำนวน PR ไม่ซ้ำในกลุ่ม; `poCount` = จำนวน PO; `estimatedTotal` = ผลรวมวงเงินประมาณการของ PR ไม่ซ้ำในกลุ่ม (นับ PR ละหนึ่งครั้ง); `orderedTotal` = ผลรวมมูลค่า PO; `savingVsEstimate` = `estimatedTotal` ลบ `orderedTotal` | ค่าติดลบได้เมื่อสั่งเกินประมาณการ |
| 5 | `listAuditLogs` | เฉพาะ `ADMIN` อ่าน `audit_log` ตาม `entity` และ `entityId` เรียงตามเวลาจากเก่าไปใหม่ ตารางนี้รับเฉพาะ INSERT (NFR-02) | ไม่มีเหตุการณ์ตอบรายการว่าง |
