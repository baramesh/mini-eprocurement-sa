---
doc_id: AC-03-07
verifies:
- FR-03
kind: Resilience
operation: submitPurchaseRequest
scenario: ส่ง PR สำเร็จแล้ว (SUBMITTED) จากนั้นแคช Idempotency ถูกล้าง แล้วส่งซ้ำด้วยคีย์เดิม
expected: 409 `ERR-STATE-001` ไม่สร้างแถวอนุมัติและ audit ซ้ำ (กฎสถานะของเอกสารเป็นด่านที่สอง ตาม ADR-04)
errors:
- ERR-STATE-001
decisions:
- ADR-04
---

# ส่งซ้ำหลังแคช Idempotency หาย
