---
doc_id: AC-03-02
verifies:
- FR-03
- FR-04
kind: Boundary
operation: submitPurchaseRequest
scenario: '`totalEstimated` = 20,000.01'
expected: สร้างอนุมัติ 2 ขั้น (`DEPT_APPROVER`, `PROCUREMENT_HEAD`)
---

# ส่ง PR เกิน 20,000 หนึ่งสตางค์
