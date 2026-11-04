---
doc_id: DEV-02
components:
- CMP-01
- CMP-02
- CMP-03
- CMP-04
- CMP-05
- CMP-06
- CMP-07
- CMP-08
containers:
- CTN-03
- CTN-04
tables:
- app_user
- approval
- audit_log
- award
- department
- doc_sequence
- goods_receipt
- gr_item
- po_item
- pr_item
- purchase_order
- purchase_request
- quotation
- quotation_item
- rfq
- rfq_vendor
- vendor
---

# โมดูลกับตารางและ operation

<!-- table: โมดูลของ API service กับตารางที่เป็นเจ้าของ -->
| โมดูล | ตารางที่เป็นเจ้าของ | เรียกโมดูลอื่น |
|---|---|---|
| CMP-01 ใบขอซื้อ | `purchase_request`, `pr_item` | CMP-08 (เลขเอกสาร audit) |
| CMP-02 อนุมัติ | `approval` | CMP-01 และ CMP-03 (เปลี่ยนสถานะเอกสารเมื่ออนุมัติครบ) CMP-08 |
| CMP-03 จัดหา | `rfq`, `rfq_vendor`, `quotation`, `quotation_item`, `award` | CMP-01 (สถานะ PR) CMP-02 (สร้างสายอนุมัติผล) CMP-05 (ตรวจผู้ขาย) CMP-08 |
| CMP-04 สั่งซื้อและรับของ | `purchase_order`, `po_item`, `goods_receipt`, `gr_item` | CMP-01 CMP-03 CMP-05 CMP-08 |
| CMP-05 ผู้ขาย | `vendor` | CMP-08 |
| CMP-06 รายงาน | ไม่มี (อ่านอย่างเดียว) | อ่านตารางของโมดูลอื่นด้วยคำสั่งรายงานเฉพาะ |
| CMP-07 audit | `audit_log` | ถูกเรียกผ่าน CMP-08 |
| CMP-08 แพลตฟอร์ม | `app_user`, `department`, `doc_sequence` | ไม่เรียกโมดูลธุรกิจ |
