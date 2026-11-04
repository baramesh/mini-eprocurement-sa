---
doc_id: AC-09-01
verifies:
- FR-09
- FR-14
kind: Boundary
operation: createPurchaseOrder
scenario: PR `APPROVED` วงเงิน 5,000.00 ระบุ `vendorId`
expected: 201 `poNo` ถูกรูปแบบ PR เป็น `ORDERED`
---

# ซื้อตรงวงเงิน 5,000.00
