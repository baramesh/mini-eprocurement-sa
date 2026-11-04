---
doc_id: AC-09-04
verifies:
- FR-09
- FR-13
kind: Positive
operation: issuePurchaseOrder
scenario: PO `DRAFT`
expected: 200 `ISSUED` มี audit
---

# ออก PO จาก DRAFT เป็น ISSUED
