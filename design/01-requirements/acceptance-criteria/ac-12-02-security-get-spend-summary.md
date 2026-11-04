---
doc_id: AC-12-02
verifies:
- FR-12
kind: Security
operation: getSpendSummary
scenario: token บทบาท `REQUESTER`
expected: 403 `ERR-AUTH-002`
errors:
- ERR-AUTH-002
---

# ผู้ขอซื้อเรียกรายงาน
