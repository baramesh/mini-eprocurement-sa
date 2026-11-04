---
doc_id: TC-27
type: Negative
frs:
- FR-08
operation: awardRfq
steps: เลือกใบ 95 ขณะต่ำสุดคือ 90 ไม่ส่ง `reason`
expected: 422 `ERR-RFQ-004`
---

# เลือกไม่ใช่ราคาต่ำสุด ไม่มีเหตุผล
