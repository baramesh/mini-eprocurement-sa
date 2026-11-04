---
doc_id: AC-06-03
verifies:
- FR-06
kind: Positive
operation: recordQuotation
scenario: ผู้ขายรายเดิมบันทึก 2 ครั้ง ราคาต่างกัน
expected: ฉบับแรก `isActive` = false ฉบับหลัง true เหลือฉบับที่ใช้งาน 1 ฉบับ
---

# บันทึกใบเสนอราคาซ้ำ
