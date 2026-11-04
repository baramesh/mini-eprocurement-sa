---
doc_id: AC-09-06
verifies:
- FR-10
kind: Positive
operation: getPurchaseOrder
scenario: 'PO สั่ง 6 รับสะสม 4 (ปฏิเสธ 1)'
expected: '200 `qtyReceived` 4 และ `qtyRemaining` 2 (จำนวนที่ปฏิเสธไม่นับเป็นรับ)'
rules:
- BR-10
---

# ดู PO พร้อมยอดคงเหลือ
