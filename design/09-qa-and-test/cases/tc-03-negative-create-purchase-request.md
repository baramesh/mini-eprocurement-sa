---
doc_id: TC-03
type: Negative
frs:
- FR-01
operation: createPurchaseRequest
steps: '`quantity` = 0'
expected: 422 `ERR-VAL-001` ที่ `items[0].quantity`
---

# จำนวนเป็นศูนย์
