---
doc_id: AC-02-03
verifies:
- FR-02
kind: Positive
operation: getPurchaseRequest
scenario: เจ้าของ PR ที่ส่งแล้ว (วงเงิน 50,000) เรียกดู
expected: 200 มี `items` ครบและ `approvals` 2 ขั้นตามลำดับ
---

# ดูรายละเอียด PR พร้อมสายอนุมัติ
