---
doc_id: AC-01-03
verifies:
- FR-01
kind: Negative
operation: createPurchaseRequest
scenario: '`quantity` = 0'
expected: 422 `ERR-VAL-001` ที่ `items[0].quantity`
---

# จำนวนเป็นศูนย์
