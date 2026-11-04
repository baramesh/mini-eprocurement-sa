---
doc_id: UIX-02
screen: SCR-02
navigates_to:
- SCR-01
operations:
- getPurchaseRequest
- createPurchaseRequest
- updatePurchaseRequest
- submitPurchaseRequest
rules:
- BR-03
errors:
- ERR-AUTH-001
- ERR-CONC-001
- ERR-STATE-001
- ERR-VAL-001
- ERR-NF-001
ia:
- IAR-03
- IAR-04
- IAR-05
uir:
- UIR-01
- UIR-02
- UIR-04
- UIR-06
bindings:
- event: เปิดหน้าของ PR ที่มีอยู่
  operation: getPurchaseRequest
  sends: ["prId"]
  reads: ["prNo", "status", "title", "justification", "neededByDate", "items[].prItemId", "items[].lineNo", "items[].description", "items[].quantity", "items[].unit", "items[].estUnitPrice", "totalEstimated", "rowVersion", "approvals[].stepNo", "approvals[].requiredRole", "approvals[].decision", "approvals[].comment", "approvals[].decidedAt"]
  ui: ฟอร์มทุกฟิลด์ ป้ายสถานะ ตารางสายอนุมัติ และค่า `If-Match` ที่เก็บไว้ใช้ตอนบันทึก
- event: กดบันทึกร่างของ PR ใหม่
  operation: createPurchaseRequest
  sends: ["title", "justification", "neededByDate", "items[].description", "items[].quantity", "items[].unit", "items[].estUnitPrice"]
  reads: ["prId", "prNo", "status", "rowVersion"]
  ui: เลขที่ PR ที่หัวฟอร์ม และเปลี่ยนเป็นโหมดแก้ไขของ `prId` ที่ได้
- event: กดบันทึกร่างของ PR ที่มีอยู่
  operation: updatePurchaseRequest
  sends: ["prId", "If-Match", "title", "justification", "neededByDate", "items[].description", "items[].quantity", "items[].unit", "items[].estUnitPrice"]
  reads: ["rowVersion", "totalEstimated", "status"]
  ui: แทนที่ค่า `rowVersion` ที่เก็บไว้ และวงเงินรวมที่เซิร์ฟเวอร์คำนวณ
- event: กดส่งอนุมัติ
  operation: submitPurchaseRequest
  sends: ["prId", "Idempotency-Key"]
  reads: ["status", "approvals[].stepNo", "approvals[].requiredRole"]
  ui: ข้อความยืนยันพร้อมรายชื่อขั้นอนุมัติที่เกิดขึ้นจริง แล้วกลับ SCR-01
---

# พฤติกรรมหน้า SCR-02 แบบฟอร์มใบขอซื้อ

**เส้นทาง:** `/purchase-requests/new` (สร้าง) และ `/purchase-requests/{prId}` (แก้หรืออ่าน) โหมดแก้ไขได้เมื่อ `status` เป็น `DRAFT` และผู้ใช้เป็นผู้ขอ นอกนั้นทุกฟิลด์อ่านอย่างเดียวและไม่มีปุ่มบันทึก

**ค่าที่คำนวณในหน้า:** แถวรายการเพิ่มหรือลบได้ในหน้า (ไม่เรียก API) วงเงินรวมแสดงทันทีจาก จำนวน × ราคา ค่าที่ใช้จริงคือที่เซิร์ฟเวอร์คำนวณตอนบันทึก ส่วน "สายอนุมัติที่จะเกิดขึ้น" แสดงจากวงเงินรวมตามเกณฑ์ BR-03 ที่หน้าถือเป็นค่าคงที่ร่วมกับเซิร์ฟเวอร์ (ยังไม่มี endpoint ให้อ่านเกณฑ์) ค่าจริงคือสายที่ `submitPurchaseRequest` สร้าง

<!-- table: เหตุการณ์ในหน้า SCR-02 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้าโหมดสร้าง | ผู้ใช้เป็น `REQUESTER` | ฟอร์มว่างหนึ่งแถวรายการ ไม่มีเลขที่ PR | ไม่เรียก |
| เปิดหน้าโหมดแก้หรืออ่าน | มี `prId` ใน path | กำลังโหลด แล้วเติมฟอร์ม | `getPurchaseRequest` |
| กดบันทึกร่าง | ยังไม่มี `prId` และฟอร์มผ่านการตรวจ | ได้เลขที่ PR เปลี่ยนเป็นโหมดแก้ไข แจ้ง "บันทึกร่างแล้ว" | `createPurchaseRequest` |
| กดบันทึกร่าง | มี `prId` และฟอร์มผ่านการตรวจ | แจ้ง "บันทึกร่างแล้ว" ส่ง `rowVersion` ที่ถืออยู่ใน `If-Match` | `updatePurchaseRequest` |
| กดส่งอนุมัติ | `DRAFT` และฟอร์มผ่านการตรวจ (ถ้ามีการแก้ค้างอยู่ให้บันทึกร่างก่อนแล้วจึงส่ง) | ปิดปุ่มระหว่างรอ สำเร็จแล้วกลับ SCR-01 | `updatePurchaseRequest` (ถ้าแก้ค้าง) แล้ว `submitPurchaseRequest` |
| กดยกเลิก | `DRAFT` | ถามยืนยัน แล้วทิ้งการแก้ไขที่ยังไม่บันทึกและกลับ SCR-01 (ไม่เปลี่ยนสถานะ PR) | ไม่เรียก |

{{bind:UIX-02}}

<!-- table: สถานะของหน้า SCR-02 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | โหมดแก้หรืออ่านระหว่างรอ response | โครงฟอร์ม ปุ่มทั้งหมดปิด |
| ฟิลด์ไม่ผ่านการตรวจ | ก่อนเรียก API หรือ `422` `ERR-VAL-001` | ข้อความใต้ฟิลด์ตามตารางฟิลด์ของ SCR-02 และสรุปที่หัวฟอร์ม จากฟิลด์ `details[]` ของ response |
| แก้ชนกัน | `409` `ERR-CONC-001` | กล่องแจ้งว่ามีผู้อื่นแก้แล้ว ให้โหลดข้อมูลล่าสุดแทนการเขียนทับ (`getPurchaseRequest`) |
| สถานะเปลี่ยนไปแล้ว | `409` `ERR-STATE-001` ตอนส่ง | แสดงสถานะล่าสุด ปิดปุ่มที่ใช้ไม่ได้ |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับมาพร้อมข้อมูลที่กรอกค้าง |
| ไม่พบหรือไม่มีสิทธิ์ดู | `404` `ERR-NF-001` | หน้าแจ้งไม่พบเอกสาร |
