---
doc_id: AC-06-01
verifies:
- FR-06
kind: Negative
operation: recordQuotation
scenario: '`vendorId` ไม่อยู่ใน RFQ'
expected: 422 `ERR-RFQ-002`
errors:
- ERR-RFQ-002
---

# บันทึกใบเสนอราคาจากผู้ขายที่ไม่ได้รับเชิญ
