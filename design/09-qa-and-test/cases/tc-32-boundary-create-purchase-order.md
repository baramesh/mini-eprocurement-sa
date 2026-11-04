---
doc_id: TC-32
type: Boundary
frs:
- FR-09
operation: createPurchaseOrder
steps: PR วงเงิน 5,000.01 ไม่มี `rfqId`
expected: 422 `ERR-PO-001`
---

# ซื้อตรงวงเงิน 5,000.01
