---
doc_id: AC-04-02
verifies:
- FR-04
kind: Negative
operation: decideApproval
scenario: '`decision` = REJECTED ไม่มี `comment`'
expected: 422 `ERR-VAL-001`
errors:
- ERR-VAL-001
---

# ปฏิเสธโดยไม่ระบุเหตุผล
