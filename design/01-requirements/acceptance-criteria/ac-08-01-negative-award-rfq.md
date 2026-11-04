---
doc_id: AC-08-01
verifies:
- FR-08
kind: Negative
operation: awardRfq
scenario: RFQ มีใบเสนอราคาที่ใช้งาน 1 ใบ
expected: 422 `ERR-RFQ-005`
errors:
- ERR-RFQ-005
---

# เสนอผลโดยมีใบเสนอราคารายเดียว
