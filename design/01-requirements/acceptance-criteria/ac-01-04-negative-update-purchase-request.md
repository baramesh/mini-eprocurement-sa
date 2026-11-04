---
doc_id: AC-01-04
verifies:
- FR-01
kind: Negative
operation: updatePurchaseRequest
scenario: ผู้ใช้ A และ B โหลดเวอร์ชันเดียวกัน A แก้แล้ว B แก้ด้วย `If-Match` เดิม
expected: B ได้ 409 `ERR-CONC-001`
---

# แก้ draft ด้วยเวอร์ชันล้าสมัย
