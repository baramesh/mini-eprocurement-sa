---
doc_id: UIX-06
screen: SCR-06
navigates_to:
- SCR-01
operations:
- getPurchaseRequest
- getRfq
- getQuotationComparison
- listVendors
- createPurchaseOrder
- getPurchaseOrder
- issuePurchaseOrder
rules:
- BR-01
- BR-09
- BR-11
errors:
- ERR-AUTH-001
- ERR-NF-001
- ERR-PO-001
- ERR-STATE-001
- ERR-STATE-002
- ERR-VND-002
ia:
- IAR-04
- IAR-05
uir:
- UIR-02
- UIR-06
bindings:
- event: เปิดหน้าโหมดซื้อตรง
  operation: getPurchaseRequest
  sends: ["prId"]
  reads: ["prNo", "title", "status", "totalEstimated", "items[].description", "items[].quantity", "items[].unit", "items[].estUnitPrice"]
  ui: รายการและมูลค่าที่จะสั่ง ซึ่งต้องไม่เกินวงเงิน PR
- event: เปิดหน้าโหมดจากผลประกวด
  operation: getRfq
  sends: ["rfqId"]
  reads: ["awardedQuotationId", "status"]
  ui: ตัดสินว่าใบเสนอราคาใดชนะ (ต้องเป็น `AWARDED`)
- event: เปิดหน้าโหมดจากผลประกวด
  operation: getQuotationComparison
  sends: ["rfqId"]
  reads: ["quotations[].quotationId", "quotations[].vendorName", "quotations[].totalAmount", "quotations[].itemPrices[].prItemId", "quotations[].itemPrices[].unitPrice"]
  ui: ผู้ขายและราคาของใบเสนอราคาที่ชนะ แสดงเป็นรายการที่จะสั่ง
- event: เลือกผู้ขายในโหมดซื้อตรง
  operation: listVendors
  sends: ["q", "status"]
  reads: ["[].vendorId", "[].nameTh", "[].status"]
  ui: รายการผู้ขายที่เลือกได้ (ส่ง `status=ACTIVE`)
- event: กดสร้าง PO
  operation: createPurchaseOrder
  sends: ["prId", "vendorId", "rfqId", "Idempotency-Key"]
  reads: ["poId", "poNo", "status"]
  ui: เลขที่ PO และเปลี่ยนหน้าเป็นแสดง PO ที่สร้าง
- event: แสดง PO ที่สร้างแล้ว
  operation: getPurchaseOrder
  sends: ["poId"]
  reads: ["poNo", "status", "vendorName", "totalAmount", "issuedAt", "items[].description", "items[].unit", "items[].quantity", "items[].unitPrice"]
  ui: ตาราง PO และการเปิดปุ่มออก PO เมื่อ `status` เป็น `DRAFT`
- event: กดออก PO
  operation: issuePurchaseOrder
  sends: ["poId", "Idempotency-Key"]
  reads: ["status", "issuedAt"]
  ui: ป้ายสถานะ ISSUED และเวลาออก
---

# พฤติกรรมหน้า SCR-06 ใบสั่งซื้อ

**เส้นทาง:** `/purchase-orders/new?prId={prId}&rfqId={rfqId}` (ไม่ส่ง `rfqId` = ซื้อตรง) และ `/purchase-orders/{poId}` เข้าได้เฉพาะ `PROCUREMENT` (ออก PO) ส่วน `PROCUREMENT_HEAD` และ `ADMIN` ดูได้ ซื้อตรงใช้ได้เมื่อ PR ไม่เกิน 5,000 บาท (BR-01) นอกนั้นต้องมาจากผลประกวดที่อนุมัติแล้ว

<!-- table: เหตุการณ์ในหน้า SCR-06 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้าโหมดซื้อตรง | ไม่มี `rfqId` | แสดง PR และตัวเลือกผู้ขาย | `getPurchaseRequest` และ `listVendors` |
| เปิดหน้าโหมดจากผลประกวด | มี `rfqId` | แสดงผู้ขายและราคาของใบเสนอราคาที่ชนะ (`awardedQuotationId`) ผู้ขายเลือกเองไม่ได้ | `getRfq` และ `getQuotationComparison` |
| กดสร้าง PO | โหมดซื้อตรงต้องเลือกผู้ขาย; ผู้ขายต้องไม่ถูกระงับ (BR-11); มูลค่าไม่เกินวงเงิน PR (BR-09) | ปิดปุ่มระหว่างรอ สำเร็จแล้วแสดง PO สถานะ `DRAFT` | `createPurchaseOrder` แล้ว `getPurchaseOrder` |
| เปิดหน้า PO ที่มีอยู่ | มี `poId` ใน path | แสดง PO และปุ่มตามสถานะ | `getPurchaseOrder` |
| กดออก PO | `status` เป็น `DRAFT` | ปิดปุ่มระหว่างรอ สำเร็จแล้วสถานะเป็น `ISSUED` | `issuePurchaseOrder` |

{{bind:UIX-06}}

<!-- table: สถานะของหน้า SCR-06 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ response | โครงหน้า ปุ่มทั้งหมดปิด |
| ซื้อตรงเกินวงเงิน | `422` `ERR-PO-001` | ข้อความจาก response ที่ช่องมูลค่า |
| ผู้ขายถูกระงับ | `422` `ERR-VND-002` | ข้อความจาก response และให้เลือกผู้ขายใหม่ |
| PR ยังไม่อนุมัติ | `409` `ERR-STATE-002` | แจ้งสถานะล่าสุด กลับ SCR-01 |
| PO เปลี่ยนสถานะไปแล้ว | `409` `ERR-STATE-001` | แสดงสถานะล่าสุด ปิดปุ่มที่ใช้ไม่ได้ |
| ไม่พบเอกสาร | `404` `ERR-NF-001` | หน้าแจ้งไม่พบเอกสาร |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับหน้านี้ |
