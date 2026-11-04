---
doc_id: AC-08-02
verifies:
- FR-08
kind: Negative
operation: awardRfq
scenario: เลือกใบ 95 ขณะต่ำสุดคือ 90 ไม่ส่ง `reason`
expected: 422 `ERR-RFQ-004`
errors:
- ERR-RFQ-004
---

# เลือกไม่ใช่ราคาต่ำสุด ไม่มีเหตุผล
