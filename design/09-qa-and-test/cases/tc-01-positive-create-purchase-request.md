---
doc_id: TC-01
type: Positive
frs:
- FR-01
- FR-14
operation: createPurchaseRequest
steps: ผู้ขอซื้อส่งหัวข้อ เหตุผล วันที่ในอนาคต 2 รายการ
expected: 201, `prNo` รูปแบบ `PR-YYYY-NNNNN`, status `DRAFT`, `totalEstimated` = ผลรวม
---

# สร้าง PR ถูกต้อง
