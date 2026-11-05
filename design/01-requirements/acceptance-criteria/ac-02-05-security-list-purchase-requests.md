---
doc_id: AC-02-05
verifies:
- FR-02
kind: Security
operation: listPurchaseRequests
scenario: ผู้รับของเรียกรายการ ขณะมี PR ที่ยังไม่มี PO ออกแล้ว และ PR ที่มี PO ออกแล้วอยู่ในระบบ
expected: ผลมีเฉพาะ PR ที่มี PO สถานะ `ISSUED`, `PARTIALLY_RECEIVED` หรือ `RECEIVED`
---

# ผู้รับของหา PO ที่ต้องรับ
