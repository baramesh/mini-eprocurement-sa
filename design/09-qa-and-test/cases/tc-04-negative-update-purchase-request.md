---
doc_id: TC-04
type: Negative
frs:
- FR-01
operation: updatePurchaseRequest
steps: ผู้ใช้ A และ B โหลดเวอร์ชันเดียวกัน A แก้แล้ว B แก้ด้วย `If-Match` เดิม
expected: B ได้ 409 `ERR-CONC-001`
---

# แก้ draft ด้วยเวอร์ชันล้าสมัย
