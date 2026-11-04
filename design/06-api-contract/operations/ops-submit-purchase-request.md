---
doc_id: OPS-submitPurchaseRequest
operation: submitPurchaseRequest
checks: สถานะต้องเป็น `DRAFT` (`ERR-STATE-001`); มีรายการอย่างน้อย 1; คำนวณ `totalEstimated`; สร้างแถว `approval` ตาม BR-03; บันทึก `row_version`; audit `SUBMIT`
success: '`SUBMITTED` พร้อมสายอนุมัติ'
errors:
- ERR-STATE-001
rules:
- BR-03
---

# submitPurchaseRequest
