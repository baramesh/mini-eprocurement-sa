---
doc_id: TC-10
type: Idempotency
frs:
- FR-03
- FR-13
operation: submitPurchaseRequest
steps: เรียก 2 ครั้งด้วยคีย์และ payload เดียวกัน
expected: ได้ผลเดิม สร้างอนุมัติและ audit ชุดเดียว
---

# ส่งซ้ำด้วย Idempotency-Key เดิม
