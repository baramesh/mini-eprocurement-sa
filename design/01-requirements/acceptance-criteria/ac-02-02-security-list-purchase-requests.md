---
doc_id: AC-02-02
verifies:
- FR-02
kind: Security
operation: listPurchaseRequests
scenario: เรียกด้วย token หมดอายุ
expected: 401 `ERR-AUTH-001`
---

# token หมดอายุ
