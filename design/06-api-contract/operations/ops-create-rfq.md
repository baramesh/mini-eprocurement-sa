---
doc_id: OPS-createRfq
operation: createRfq
checks: PR สถานะ `APPROVED` (`ERR-STATE-002`); วงเงินเกิน 5,000 (`ERR-RFQ-006`); `vendorIds` ≥ 3 (`ERR-RFQ-001`); ผู้ขายทุกรายสถานะ `ACTIVE` (`ERR-VND-002`); ออกเลข RFQ; PR เป็น `IN_SOURCING`
success: '`201`'
errors:
- ERR-STATE-002
- ERR-RFQ-006
- ERR-RFQ-001
- ERR-VND-002
---

# createRfq
