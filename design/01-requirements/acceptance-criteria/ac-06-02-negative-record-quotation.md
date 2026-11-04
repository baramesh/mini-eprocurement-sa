---
doc_id: AC-06-02
verifies:
- FR-06
kind: Negative
operation: recordQuotation
scenario: เวลาปัจจุบันเลย `dueAt`
expected: 409 `ERR-RFQ-003`
errors:
- ERR-RFQ-003
---

# บันทึกใบเสนอราคาหลังปิดรับ
