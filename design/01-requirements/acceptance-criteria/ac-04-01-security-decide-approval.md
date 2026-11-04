---
doc_id: AC-04-01
verifies:
- FR-04
kind: Security
operation: decideApproval
scenario: ผู้ใช้มีบทบาท `DEPT_APPROVER` และเป็นผู้ขอซื้อ
expected: 403 `ERR-SOD-001`
errors:
- ERR-SOD-001
---

# ผู้ขอซื้ออนุมัติ PR ตนเอง
