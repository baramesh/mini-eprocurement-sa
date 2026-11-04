---
doc_id: TC-50
type: Positive
frs:
- FR-02
operation: getPurchaseRequest
steps: เจ้าของ PR ที่ส่งแล้ว (วงเงิน 50,000) เรียกดู
expected: 200 มี `items` ครบและ `approvals` 2 ขั้นตามลำดับ
---

# ดูรายละเอียด PR พร้อมสายอนุมัติ
