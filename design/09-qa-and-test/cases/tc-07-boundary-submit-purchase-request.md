---
doc_id: TC-07
type: Boundary
frs:
- FR-03
- FR-04
operation: submitPurchaseRequest
steps: '`totalEstimated` = 20,000.01'
expected: สร้างอนุมัติ 2 ขั้น (`DEPT_APPROVER`, `PROCUREMENT_HEAD`)
---

# ส่ง PR เกิน 20,000 หนึ่งสตางค์
