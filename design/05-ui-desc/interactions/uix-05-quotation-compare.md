---
doc_id: UIX-05
screen: SCR-05
navigates_to:
- SCR-06
operations:
- getRfq
- recordQuotation
- getQuotationComparison
- awardRfq
rules:
- BR-02
- BR-06
- BR-07
- BR-08
errors:
- ERR-AUTH-001
- ERR-NF-001
- ERR-RFQ-002
- ERR-RFQ-003
- ERR-RFQ-004
- ERR-RFQ-005
- ERR-STATE-001
- ERR-VAL-001
ia:
- IAR-04
- IAR-05
uir:
- UIR-01
- UIR-02
- UIR-06
bindings:
- event: เปิดหน้า
  operation: getRfq
  sends: ["rfqId"]
  reads: ["rfqNo", "prNo", "prTitle", "status", "dueAt", "items[].prItemId", "items[].description", "items[].quantity", "items[].unit", "vendors[].vendorId", "vendors[].vendorName"]
  ui: หัวหน้าจอ (RFQ, PR ต้นทาง, วันปิดรับ) แถวของตารางเทียบราคา และรายชื่อผู้ขายที่บันทึกใบเสนอราคาได้
- event: เปิดหน้า หรือหลังบันทึกใบเสนอราคา
  operation: getQuotationComparison
  sends: ["rfqId"]
  reads: ["quotations[].quotationId", "quotations[].vendorId", "quotations[].vendorName", "quotations[].totalAmount", "quotations[].leadTimeDays", "quotations[].itemPrices[].prItemId", "quotations[].itemPrices[].unitPrice", "lowestQuotationId"]
  ui: เซลล์ราคาต่อหน่วย แถวสรุปราคารวมกับระยะเวลาส่งมอบ ไฮไลต์ราคารวมต่ำสุด และตัวเลือกผู้ชนะ
- event: กดบันทึกใบเสนอราคาของผู้ขาย
  operation: recordQuotation
  sends: ["rfqId", "vendorId", "leadTimeDays", "items[].prItemId", "items[].unitPrice"]
  reads: ["quotationId", "totalAmount", "isActive"]
  ui: ข้อความสำเร็จ แล้วโหลดตารางเทียบราคาใหม่ (ฉบับเก่าของผู้ขายรายเดิมถูกแทนที่)
- event: กดเสนอผล
  operation: awardRfq
  sends: ["rfqId", "Idempotency-Key", "quotationId", "reason"]
  reads: ["status"]
  ui: แจ้งว่าส่งอนุมัติแล้ว และเปลี่ยนป้ายสถานะ RFQ เป็นรออนุมัติผล
---

# พฤติกรรมหน้า SCR-05 บันทึกและเปรียบเทียบใบเสนอราคา

**เส้นทาง:** `/rfqs/{rfqId}` เข้าได้เฉพาะ `PROCUREMENT` (บันทึกและเสนอผล) `PROCUREMENT_HEAD` และ `COMMITTEE` (ดูตารางและผลที่รออนุมัติ) ปุ่มบันทึกและเสนอผลซ่อนเมื่อ RFQ ไม่ใช่ `OPEN`

<!-- table: เหตุการณ์ในหน้า SCR-05 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้า | มี `rfqId` ใน path | แสดงหัวหน้าจอและตารางเทียบราคา | `getRfq` และ `getQuotationComparison` |
| กดบันทึกใบเสนอราคา | RFQ เป็น `OPEN` ผู้ขายอยู่ใน `vendors[]` (BR-07) | เปิดแบบกรอกราคาต่อหน่วยทุกรายการของผู้ขายนั้น กดยืนยันแล้วบันทึก | `recordQuotation` แล้ว `getQuotationComparison` |
| บันทึกซ้ำผู้ขายเดิม | มีใบเสนอราคาอยู่แล้ว | ฉบับใหม่แทนที่ฉบับเก่า ตารางแสดงเฉพาะฉบับใช้งาน (BR-08) | `recordQuotation` |
| เลือกผู้ชนะ | เลือกได้ 1 ราย | ถ้าไม่ใช่รายราคารวมต่ำสุด (`lowestQuotationId`) แสดงช่องเหตุผลบังคับพร้อมตัวนับ อย่างน้อย 20 ตัวอักษร (BR-06) | ไม่เรียก |
| ปุ่มเสนอผลใช้ได้ | มีใบเสนอราคาใช้งานอย่างน้อย 2 ราย (BR-02) และเหตุผลครบถ้วนเมื่อจำเป็น | ปุ่มเปิด ไม่งั้นปิดพร้อมข้อความ | ไม่เรียก |
| กดเสนอผล | ปุ่มเปิด | ปิดปุ่มระหว่างรอ สำเร็จแล้วแสดงสถานะรออนุมัติผล | `awardRfq` |
| กดไปออก PO | RFQ เป็น `AWARDED` และผู้ใช้เป็น `PROCUREMENT` | ไป SCR-06 พร้อม `rfqId` | ไม่เรียก |

{{bind:UIX-05}}

<!-- table: สถานะของหน้า SCR-05 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ response | โครงตาราง |
| ยังไม่มีใบเสนอราคา | `quotations` ว่าง | "ยังไม่มีใบเสนอราคา" และปุ่มบันทึกของแต่ละผู้ขาย |
| ผู้ขายไม่ได้รับเชิญ | `422` `ERR-RFQ-002` | ข้อความจาก response ไม่ปิดแบบกรอก |
| RFQ ปิดรับแล้ว | `409` `ERR-RFQ-003` | แจ้งว่าเลยเวลาปิดรับ ปิดปุ่มบันทึก |
| ใบเสนอราคาไม่ถึง 2 ราย | `422` `ERR-RFQ-005` | แจ้งที่ปุ่มเสนอผล |
| ขาดเหตุผล | `422` `ERR-RFQ-004` หรือ `ERR-VAL-001` | ข้อความที่ช่องเหตุผล |
| สถานะเปลี่ยนไปแล้ว | `409` `ERR-STATE-001` | โหลดสถานะ RFQ ใหม่และปิดปุ่มที่ใช้ไม่ได้ |
| ไม่พบ RFQ | `404` `ERR-NF-001` | หน้าแจ้งไม่พบเอกสาร |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับหน้านี้ |
