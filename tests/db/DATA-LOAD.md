# ผลการโหลดข้อมูลตั้งต้นและข้อมูลตัวอย่าง

สร้างอัตโนมัติ ห้ามแก้ด้วยมือ

- SQL Server 16.0.4305.5 (Linux container) ฐานข้อมูลว่างที่สร้าง schema ใหม่
- โหลดด้วยสคริปต์ที่ส่งมอบจริง ( แล้ว ) ซึ่งสร้างจาก CSV ตามลำดับตารางที่พึ่งกัน ทุก foreign key และ constraint ของ schema ทำงานระหว่างโหลด
- ผลรวมแถวหลังโหลด (ตารางหลัก): department|3 app_user|9 vendor|5 purchase_request|6 rfq|2 quotation|7 purchase_order|3 goods_receipt|3 

## ผลตรวจความสอดคล้อง (`sql/data-checks.sql`)

```text
PASS DATA-01 PR total equals the sum of its items
PASS DATA-02 quotation total equals unit prices x quantities
PASS DATA-03 PO total equals the sum of its items
PASS DATA-04 BR-01 and BR-02 hold in the sample
PASS DATA-05 BR-03 chain length matches the amount
PASS DATA-06 BR-04 no self approval
PASS DATA-07 approvers hold the required role
PASS DATA-08 BR-06 reason present for non-lowest winners
PASS DATA-09 awarded RFQs have at least 3 active quotations
PASS DATA-10 suspended vendors are not used
PASS DATA-11 received quantity within ordered quantity
PASS DATA-12 RECEIVED POs are fully received
PASS DATA-13 document counters match issued documents
```

ผลรวม: ผ่านทุกข้อ
