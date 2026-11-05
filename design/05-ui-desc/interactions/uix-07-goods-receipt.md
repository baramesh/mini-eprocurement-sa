---
doc_id: UIX-07
screen: SCR-07
operations:
- getPurchaseOrder
- recordGoodsReceipt
rules:
- BR-10
errors:
- ERR-AUTH-001
- ERR-GR-001
- ERR-NF-001
- ERR-STATE-001
- ERR-VAL-001
ia:
- IAR-04
- IAR-05
uir:
- UIR-06
bindings:
- event: เปิดหน้า หรือหลังบันทึกรับของ
  operation: getPurchaseOrder
  sends: ["poId"]
  reads: ["poNo", "status", "vendorName", "items[].poItemId", "items[].description", "items[].unit", "items[].quantity", "items[].qtyReceived", "items[].qtyRemaining"]
  ui: ตารางรับของ (สั่ง รับสะสม คงเหลือ) และช่องกรอกจำนวนรับที่จำกัดไม่เกินคงเหลือ
- event: กดบันทึกรับของ
  operation: recordGoodsReceipt
  sends: ["poId", "Idempotency-Key", "note", "items[].poItemId", "items[].qtyReceived", "items[].qtyRejected"]
  reads: ["grNo", "poStatus"]
  ui: เลขที่ใบรับของ และสถานะ PO ที่เปลี่ยนเป็นรับบางส่วนหรือรับครบ
---

# พฤติกรรมหน้า SCR-07 บันทึกการรับของ

**เส้นทาง:** `/purchase-orders/{poId}/receipt` เข้าได้เฉพาะ `RECEIVER` เมื่อ PO เป็น `ISSUED` หรือ `PARTIALLY_RECEIVED`

<!-- table: เหตุการณ์ในหน้า SCR-07 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้า | มี `poId` ใน path | แสดงตาราง สั่ง รับสะสม คงเหลือ ต่อรายการ | `getPurchaseOrder` |
| กรอกจำนวนรับ | จำนวนรับไม่เกิน `qtyRemaining` (BR-10) | ช่องผ่านการตรวจ; เกินแล้วแสดงข้อความที่ช่องและปิดปุ่มบันทึก | ไม่เรียก |
| กรอกจำนวนปฏิเสธ | ไม่ติดลบ | จำนวนปฏิเสธไม่นับเป็นรับ | ไม่เรียก |
| กดบันทึกรับของ | มีอย่างน้อยหนึ่งรายการที่จำนวนรับมากกว่า 0 | ปิดปุ่มระหว่างรอ สำเร็จแล้วแสดงเลขที่ใบรับของ แล้วโหลด PO ใหม่ | `recordGoodsReceipt` แล้ว `getPurchaseOrder` |

{{bind:UIX-07}}

{{rules:UIX-07}}

<!-- table: สถานะของหน้า SCR-07 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ response | โครงตาราง |
| รับครบแล้ว | `status` เป็น `RECEIVED` | ตารางอ่านอย่างเดียว ไม่มีปุ่มบันทึก |
| รับเกินคงเหลือ | `422` `ERR-GR-001` | ข้อความจาก response ที่แถวนั้น แล้วโหลดคงเหลือล่าสุด |
| ข้อมูลไม่ผ่านการตรวจ | `422` `ERR-VAL-001` | ข้อความที่ฟิลด์ |
| PO ไม่อยู่ในสถานะรับของได้ | `409` `ERR-STATE-001` | แสดงสถานะล่าสุด ปิดปุ่มบันทึก |
| ไม่พบ PO | `404` `ERR-NF-001` | หน้าแจ้งไม่พบเอกสาร |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับหน้านี้พร้อมจำนวนที่กรอกค้าง |
