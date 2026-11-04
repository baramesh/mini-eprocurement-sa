---
doc_id: TC-31
type: Boundary
frs:
- FR-09
- FR-14
operation: createPurchaseOrder
steps: PR `APPROVED` วงเงิน 5,000.00 ระบุ `vendorId`
expected: 201 `poNo` ถูกรูปแบบ PR เป็น `ORDERED`
---

# ซื้อตรงวงเงิน 5,000.00
