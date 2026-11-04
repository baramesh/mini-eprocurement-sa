---
doc_id: AC-03-05
verifies:
- FR-03
- FR-13
kind: Idempotency
operation: submitPurchaseRequest
scenario: เรียก 2 ครั้งด้วยคีย์และ payload เดียวกัน
expected: ได้ผลเดิม สร้างอนุมัติและ audit ชุดเดียว
---

# ส่งซ้ำด้วย Idempotency-Key เดิม
