# พจนานุกรมข้อมูล (สร้างอัตโนมัติจาก sql/schema.sql)

## 1. department

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `department_id` | INT | ไม่ | PK | รหัสหน่วยงาน |
| `code` | VARCHAR(10) | ไม่ |  | รหัสย่อหน่วยงาน |
| `name_th` | NVARCHAR(100) | ไม่ |  | ชื่อหน่วยงาน |
| `is_active` | BIT | ไม่ |  | สถานะใช้งาน |

## 2. app_user

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `user_id` | INT | ไม่ | PK | รหัสผู้ใช้ |
| `department_id` | INT | ไม่ | FK | หน่วยงานสังกัด |
| `full_name` | NVARCHAR(150) | ไม่ |  | ชื่อ-นามสกุล |
| `email` | VARCHAR(150) | ไม่ |  | อีเมลที่ตรงกับ SSO |
| `role_code` | VARCHAR(20) | ไม่ |  | บทบาท |
| `is_active` | BIT | ไม่ |  | สถานะใช้งาน |

## 3. vendor

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `vendor_id` | INT | ไม่ | PK | รหัสผู้ขาย |
| `vendor_code` | VARCHAR(15) | ไม่ |  | รหัสผู้ขายที่ระบบออก |
| `name_th` | NVARCHAR(200) | ไม่ |  | ชื่อผู้ขาย |
| `tax_id` | CHAR(13) | ไม่ |  | เลขประจำตัวผู้เสียภาษี 13 หลัก |
| `email` | VARCHAR(150) | ได้ |  | อีเมลติดต่อ |
| `status` | VARCHAR(10) | ไม่ |  | สถานะ (SUSPENDED เชิญหรือออก PO ไม่ได้) |
| `created_at` | DATETIME2(0) | ไม่ |  | เวลาสร้าง (UTC) |

## 4. doc_sequence

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `doc_type` | VARCHAR(3) | ไม่ |  | ชนิดเอกสาร PR RFQ PO GR |
| `doc_year` | SMALLINT | ไม่ |  | ปี ค.ศ. |
| `last_no` | INT | ไม่ |  | เลขลำดับล่าสุดที่ออก |

## 5. purchase_request

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `pr_id` | BIGINT | ไม่ | PK | รหัสใบขอซื้อ |
| `pr_no` | VARCHAR(20) | ไม่ |  | เลขที่ PR รูปแบบ PR-YYYY-NNNNN |
| `requester_id` | INT | ไม่ | FK | ผู้ขอซื้อ |
| `department_id` | INT | ไม่ | FK | หน่วยงานผู้ขอ |
| `title` | NVARCHAR(200) | ไม่ |  | หัวข้อ |
| `justification` | NVARCHAR(1000) | ไม่ |  | เหตุผลความจำเป็น |
| `needed_by_date` | DATE | ไม่ |  | วันที่ต้องการใช้ |
| `total_estimated` | DECIMAL(14,2) | ไม่ |  | วงเงินรวมประมาณการ (บาท) |
| `status` | VARCHAR(15) | ไม่ |  | สถานะ |
| `row_version` | ROWVERSION | ไม่ |  | ตัวตรวจการแก้ไขซ้อน (optimistic lock) |
| `created_at` | DATETIME2(0) | ไม่ |  | เวลาสร้าง (UTC) |
| `submitted_at` | DATETIME2(0) | ได้ |  | เวลาส่งอนุมัติ (UTC) |

## 6. pr_item

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `pr_item_id` | BIGINT | ไม่ | PK | รหัสรายการ |
| `pr_id` | BIGINT | ไม่ | FK | ใบขอซื้อ |
| `line_no` | SMALLINT | ไม่ |  | ลำดับบรรทัด |
| `description` | NVARCHAR(300) | ไม่ |  | รายการสินค้าหรือบริการ |
| `quantity` | DECIMAL(12,3) | ไม่ |  | จำนวน |
| `unit` | NVARCHAR(30) | ไม่ |  | หน่วยนับ |
| `est_unit_price` | DECIMAL(14,2) | ไม่ |  | ราคาต่อหน่วยประมาณการ |

## 7. approval

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `approval_id` | BIGINT | ไม่ | PK | รหัสงานอนุมัติ |
| `doc_type` | VARCHAR(5) | ไม่ |  | ชนิดงาน (PR หรือผลเลือกผู้ชนะ) |
| `doc_id` | BIGINT | ไม่ |  | รหัสเอกสาร (pr_id หรือ rfq_id ตามชนิด) |
| `step_no` | TINYINT | ไม่ |  | ขั้นอนุมัติ เริ่มที่ 1 |
| `required_role` | VARCHAR(20) | ไม่ |  | บทบาทที่ต้องอนุมัติในขั้นนี้ |
| `approver_id` | INT | ได้ | FK | ผู้ตัดสินจริง |
| `decision` | VARCHAR(10) | ไม่ |  | ผลการตัดสิน |
| `comment` | NVARCHAR(500) | ได้ |  | ความเห็นหรือเหตุผลปฏิเสธ |
| `decided_at` | DATETIME2(0) | ได้ |  | เวลาตัดสิน (UTC) |

## 8. rfq

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `rfq_id` | BIGINT | ไม่ | PK | รหัส RFQ |
| `rfq_no` | VARCHAR(20) | ไม่ |  | เลขที่ RFQ รูปแบบ RFQ-YYYY-NNNNN |
| `pr_id` | BIGINT | ไม่ | FK | ใบขอซื้อต้นทาง |
| `status` | VARCHAR(15) | ไม่ |  | สถานะ |
| `due_at` | DATETIME2(0) | ไม่ |  | เวลาปิดรับใบเสนอราคา (UTC) |
| `created_by` | INT | ไม่ | FK | ผู้สร้าง |
| `created_at` | DATETIME2(0) | ไม่ |  | เวลาสร้าง (UTC) |

## 9. rfq_vendor

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `rfq_id` | BIGINT | ไม่ | FK | RFQ |
| `vendor_id` | INT | ไม่ | FK | ผู้ขายที่ได้รับเชิญ |
| `invited_at` | DATETIME2(0) | ไม่ |  | เวลาเชิญ (UTC) |

## 10. quotation

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `quotation_id` | BIGINT | ไม่ | PK | รหัสใบเสนอราคา |
| `rfq_id` | BIGINT | ไม่ |  | RFQ |
| `vendor_id` | INT | ไม่ |  | ผู้ขาย |
| `total_amount` | DECIMAL(14,2) | ไม่ |  | ราคารวม (บาท) |
| `lead_time_days` | SMALLINT | ไม่ |  | ระยะเวลาส่งมอบ (วัน) |
| `is_active` | BIT | ไม่ |  | ฉบับที่ใช้งาน (ฉบับเก่าถูกแทนที่เป็น 0) |
| `submitted_at` | DATETIME2(0) | ไม่ |  | เวลาบันทึก (UTC) |

## 11. quotation_item

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `quotation_item_id` | BIGINT | ไม่ | PK | รหัสรายการเสนอราคา |
| `quotation_id` | BIGINT | ไม่ | FK | ใบเสนอราคา |
| `pr_item_id` | BIGINT | ไม่ | FK | รายการ PR ที่เสนอ |
| `unit_price` | DECIMAL(14,2) | ไม่ |  | ราคาต่อหน่วยที่เสนอ |

## 12. award

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `rfq_id` | BIGINT | ไม่ | PK | RFQ ที่เลือกผู้ชนะ |
| `quotation_id` | BIGINT | ไม่ | FK | ใบเสนอราคาที่ชนะ |
| `reason` | NVARCHAR(500) | ได้ |  | เหตุผล (บังคับเมื่อไม่ใช่ราคาต่ำสุด) |
| `awarded_by` | INT | ไม่ | FK | ผู้เสนอผล |
| `awarded_at` | DATETIME2(0) | ไม่ |  | เวลาเสนอผล (UTC) |

## 13. purchase_order

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `po_id` | BIGINT | ไม่ | PK | รหัสใบสั่งซื้อ |
| `po_no` | VARCHAR(20) | ไม่ |  | เลขที่ PO รูปแบบ PO-YYYY-NNNNN |
| `pr_id` | BIGINT | ไม่ | FK | ใบขอซื้อต้นทาง |
| `rfq_id` | BIGINT | ได้ | FK | RFQ (ว่างเมื่อซื้อตรง) |
| `vendor_id` | INT | ไม่ | FK | ผู้ขาย |
| `total_amount` | DECIMAL(14,2) | ไม่ |  | มูลค่ารวม (บาท) |
| `status` | VARCHAR(18) | ไม่ |  | สถานะ |
| `issued_at` | DATETIME2(0) | ได้ |  | เวลาออก PO (UTC) |
| `created_by` | INT | ไม่ | FK | ผู้สร้าง |

## 14. po_item

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `po_item_id` | BIGINT | ไม่ | PK | รหัสรายการสั่งซื้อ |
| `po_id` | BIGINT | ไม่ | FK | ใบสั่งซื้อ |
| `pr_item_id` | BIGINT | ไม่ | FK | รายการ PR ต้นทาง |
| `quantity` | DECIMAL(12,3) | ไม่ |  | จำนวนที่สั่ง |
| `unit_price` | DECIMAL(14,2) | ไม่ |  | ราคาต่อหน่วย |

## 15. goods_receipt

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `gr_id` | BIGINT | ไม่ | PK | รหัสใบรับของ |
| `gr_no` | VARCHAR(20) | ไม่ |  | เลขที่ GR รูปแบบ GR-YYYY-NNNNN |
| `po_id` | BIGINT | ไม่ | FK | ใบสั่งซื้อ |
| `received_by` | INT | ไม่ | FK | ผู้รับของ |
| `received_at` | DATETIME2(0) | ไม่ |  | เวลารับของ (UTC) |
| `note` | NVARCHAR(500) | ได้ |  | หมายเหตุ |

## 16. gr_item

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `gr_item_id` | BIGINT | ไม่ | PK | รหัสรายการรับของ |
| `gr_id` | BIGINT | ไม่ | FK | ใบรับของ |
| `po_item_id` | BIGINT | ไม่ | FK | รายการสั่งซื้อ |
| `qty_received` | DECIMAL(12,3) | ไม่ |  | จำนวนรับ |
| `qty_rejected` | DECIMAL(12,3) | ไม่ |  | จำนวนปฏิเสธ (ไม่นับเป็นรับ) |

## 17. audit_log

| คอลัมน์ | ชนิด | Null | คีย์ | คำอธิบาย |
|---|---|---|---|---|
| `audit_id` | BIGINT | ไม่ | PK | รหัสบันทึก |
| `entity` | VARCHAR(30) | ไม่ |  | ชนิดเอกสาร เช่น PR RFQ PO |
| `entity_id` | BIGINT | ไม่ |  | รหัสเอกสาร |
| `action` | VARCHAR(30) | ไม่ |  | การกระทำ เช่น SUBMIT APPROVE REJECT |
| `actor_id` | INT | ไม่ | FK | ผู้กระทำ |
| `detail` | NVARCHAR(1000) | ได้ |  | รายละเอียดก่อน-หลัง |
| `created_at` | DATETIME2(0) | ไม่ |  | เวลา (UTC) |
