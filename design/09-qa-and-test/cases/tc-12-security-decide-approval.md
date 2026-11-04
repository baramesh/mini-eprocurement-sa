---
doc_id: TC-12
type: Security
frs:
- FR-04
operation: decideApproval
steps: ผู้ใช้มีบทบาท `DEPT_APPROVER` และเป็นผู้ขอซื้อ
expected: 403 `ERR-SOD-001`
---

# ผู้ขอซื้ออนุมัติ PR ตนเอง
