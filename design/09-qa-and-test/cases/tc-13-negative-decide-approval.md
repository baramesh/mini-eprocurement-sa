---
doc_id: TC-13
type: Negative
frs:
- FR-04
operation: decideApproval
steps: '`decision` = REJECTED ไม่มี `comment`'
expected: 422 `ERR-VAL-001`
---

# ปฏิเสธโดยไม่ระบุเหตุผล
