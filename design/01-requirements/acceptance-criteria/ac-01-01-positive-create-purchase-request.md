---
doc_id: AC-01-01
verifies:
- FR-01
- FR-14
kind: Positive
operation: createPurchaseRequest
scenario: ผู้ขอซื้อส่งหัวข้อ เหตุผล วันที่ในอนาคต 2 รายการ
expected: 201, `prNo` รูปแบบ `PR-YYYY-NNNNN`, status `DRAFT`, `totalEstimated` = ผลรวม
---

# สร้าง PR ถูกต้อง
