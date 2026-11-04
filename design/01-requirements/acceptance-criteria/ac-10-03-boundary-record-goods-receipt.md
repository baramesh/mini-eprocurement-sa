---
doc_id: AC-10-03
verifies:
- FR-10
kind: Boundary
operation: recordGoodsReceipt
scenario: สั่ง 10 รับสะสมแล้ว 4 รับเพิ่ม 7
expected: 422 `ERR-GR-001`
errors:
- ERR-GR-001
---

# รับของเกินจำนวนสั่ง
