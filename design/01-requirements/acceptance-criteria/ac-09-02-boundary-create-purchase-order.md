---
doc_id: AC-09-02
verifies:
- FR-09
kind: Boundary
operation: createPurchaseOrder
scenario: PR วงเงิน 5,000.01 ไม่มี `rfqId`
expected: 422 `ERR-PO-001`
errors:
- ERR-PO-001
---

# ซื้อตรงวงเงิน 5,000.01
