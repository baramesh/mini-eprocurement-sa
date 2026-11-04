---
doc_id: AC-03-04
verifies:
- FR-03
- FR-04
kind: Boundary
operation: submitPurchaseRequest
scenario: '`totalEstimated` = 200,000.01'
expected: อนุมัติ 3 ขั้น (เพิ่ม `COMMITTEE`)
---

# ส่ง PR เกิน 200,000
