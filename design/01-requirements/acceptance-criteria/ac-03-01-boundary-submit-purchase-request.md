---
doc_id: AC-03-01
verifies:
- FR-03
- FR-04
kind: Boundary
operation: submitPurchaseRequest
scenario: '`totalEstimated` = 20,000.00'
expected: สร้างอนุมัติ 1 ขั้น (`DEPT_APPROVER`)
---

# ส่ง PR ไม่เกิน 20,000
