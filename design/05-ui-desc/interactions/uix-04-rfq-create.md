---
doc_id: UIX-04
screen: SCR-04
navigates_to:
- SCR-01
- SCR-05
- SCR-06
operations:
- getPurchaseRequest
- listVendors
- createRfq
rules:
- BR-01
- BR-02
- BR-11
errors:
- ERR-AUTH-001
- ERR-NF-001
- ERR-RFQ-001
- ERR-RFQ-006
- ERR-STATE-002
- ERR-VND-002
ia:
- IAR-04
uir:
- UIR-01
- UIR-06
bindings:
- event: เปิดหน้าจากแถว PR ที่ `APPROVED`
  operation: getPurchaseRequest
  sends: ["prId"]
  reads: ["prNo", "title", "status", "totalEstimated", "items[].description", "items[].quantity", "items[].unit"]
  ui: หัวหน้าจอแสดง PR ต้นทางและรายการที่จะขอราคา
- event: เปิดหน้า หรือพิมพ์ค้นหาผู้ขาย
  operation: listVendors
  sends: ["q", "status"]
  reads: ["[].vendorId", "[].vendorCode", "[].nameTh", "[].status"]
  ui: รายการผู้ขายที่เลือกเชิญได้ (ส่ง `status=ACTIVE`)
- event: กดสร้าง RFQ
  operation: createRfq
  sends: ["prId", "dueAt", "vendorIds", "Idempotency-Key"]
  reads: ["rfqId", "rfqNo", "status", "vendorIds"]
  ui: ข้อความสำเร็จพร้อมเลขที่ RFQ แล้วไป SCR-05
---

# พฤติกรรมหน้า SCR-04 สร้าง RFQ และเชิญผู้ขาย

**เส้นทาง:** `/purchase-requests/{prId}/rfq/new` เข้าได้เฉพาะ `PROCUREMENT` และเฉพาะ PR ที่เป็น `APPROVED`

<!-- table: เหตุการณ์ในหน้า SCR-04 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้า | มี `prId` ใน path | แสดง PR ต้นทาง และรายการผู้ขายที่ใช้งานอยู่ | `getPurchaseRequest` และ `listVendors` |
| พิมพ์ค้นหาผู้ขาย | หยุดพิมพ์ 300 ms | กรองรายการผู้ขาย | `listVendors` |
| เลือกผู้ขาย | ผู้ขายต้องเป็น `ACTIVE` (BR-11 ผู้ขายที่ถูกระงับไม่อยู่ในรายการ) | นับจำนวนที่เลือก | ไม่เรียก |
| กดสร้าง RFQ | เลือกผู้ขายอย่างน้อย 3 ราย (BR-02) และกำหนดวันปิดรับในอนาคต | ปิดปุ่มระหว่างรอ สำเร็จแล้วไป SCR-05 | `createRfq` |

{{bind:UIX-04}}

<!-- table: สถานะของหน้า SCR-04 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ PR และรายการผู้ขาย | โครงหน้า ปุ่มสร้างปิด |
| ผู้ขายไม่พอ | เลือกน้อยกว่า 3 ราย หรือ `422` `ERR-RFQ-001` | ข้อความที่ปุ่มสร้าง |
| ผู้ขายถูกระงับระหว่างทาง | `422` `ERR-VND-002` | ข้อความจาก response และเอาผู้ขายนั้นออกจากรายการที่เลือก |
| PR ยังไม่อนุมัติ | `409` `ERR-STATE-002` | แจ้งสถานะล่าสุดและกลับ SCR-01 |
| PR วงเงินไม่เกิน 5,000 บาท | `422` `ERR-RFQ-006` | แจ้งให้ใช้ซื้อตรงที่ SCR-06 (BR-01) |
| ไม่พบ PR | `404` `ERR-NF-001` | หน้าแจ้งไม่พบเอกสาร |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับหน้านี้ |
