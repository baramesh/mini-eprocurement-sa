---
doc_id: TC-24
type: Positive
frs:
- FR-06
operation: recordQuotation
steps: ผู้ขายรายเดิมบันทึก 2 ครั้ง ราคาต่างกัน
expected: ฉบับแรก `isActive` = false ฉบับหลัง true เหลือฉบับที่ใช้งาน 1 ฉบับ
---

# บันทึกใบเสนอราคาซ้ำ
