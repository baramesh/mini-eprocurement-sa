---
doc_id: OPS-awardRfq
operation: awardRfq
checks: มีใบเสนอราคา ≥ 2 ราย (`ERR-RFQ-005`); ถ้าไม่ใช่ราคาต่ำสุดต้องมีเหตุผล ≥ 20 ตัวอักษร (`ERR-RFQ-004`); สร้างสายอนุมัติผลตาม BR-05; RFQ เป็น `AWARD_PENDING`
success: '`202`'
errors:
- ERR-RFQ-005
- ERR-RFQ-004
rules:
- BR-05
---

# awardRfq
