---
doc_id: AC-05-08
verifies:
- FR-05
kind: Positive
operation: getRfq
scenario: RFQ ที่เสนอผลเลือกผู้ชนะ (ไม่ใช่ราคาต่ำสุด) พร้อมเหตุผลแล้ว
expected: 200 มี `awardedQuotationId` เป็นใบเสนอราคาที่เสนอ และ `awardReason` เป็นเหตุผลนั้น; RFQ ที่ยังไม่เสนอผลได้ค่าว่างทั้งสองฟิลด์
---

# ผู้อนุมัติเห็นผลที่เสนอ
