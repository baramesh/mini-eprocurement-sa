---
doc_id: UIX-01
screen: SCR-01
navigates_to:
- SCR-02
- SCR-04
- SCR-05
- SCR-07
operations:
- listPurchaseRequests
rules: []
errors:
- ERR-AUTH-001
- ERR-AUTH-002
ia:
- IAR-01
- IAR-02
- IAR-04
uir:
- UIR-01
- UIR-02
- UIR-03
bindings:
- event: เปิดหน้า หรือเปลี่ยนตัวกรอง
  operation: listPurchaseRequests
  sends: ["status", "createdFrom", "createdTo", "requesterId", "limit"]
  reads: ["items[].prId", "items[].prNo", "items[].title", "items[].status", "items[].totalEstimated", "items[].requesterName", "items[].departmentName", "items[].neededByDate", "items[].submittedAt", "items[].rfqId", "items[].poId", "nextCursor"]
  ui: ตารางรายการ ปุ่มโหลดเพิ่ม และลิงก์ไปหน้าถัดไปของแต่ละแถว
- event: กดโหลดเพิ่ม
  operation: listPurchaseRequests
  sends: ["cursor", "limit", "status", "createdFrom", "createdTo", "requesterId"]
  reads: ["items[].prNo", "items[].status", "nextCursor"]
  ui: แถวที่ต่อท้ายตาราง และการซ่อนปุ่มโหลดเพิ่มเมื่อ `nextCursor` เป็น null
---

# พฤติกรรมหน้า SCR-01 รายการใบขอซื้อ

**เส้นทาง:** `/purchase-requests` ตัวกรองเก็บใน query string (`status`, `createdFrom`, `createdTo`, `requesterId`) เพื่อให้ลิงก์และการรีเฟรชได้หน้าเดิม ตำแหน่งหน้า (`cursor`) เก็บในหน่วยความจำของหน้าเท่านั้น

<!-- table: เหตุการณ์ในหน้า SCR-01 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้า | บทบาทใดก็ได้ที่เข้า SCR-01 ได้ | แสดงสถานะกำลังโหลด แล้วแสดง 50 แถวแรกเรียงใหม่สุดก่อน | `listPurchaseRequests` |
| เปลี่ยนตัวกรอง | ค่าเปลี่ยน (ช่วงวันที่ต้องครบทั้งสองค่าก่อนเรียก) | ล้างรายการเดิม เริ่มใหม่จากหน้าแรกของผลลัพธ์ | `listPurchaseRequests` |
| กดโหลดเพิ่ม | `nextCursor` ไม่ว่าง | ต่อแถวถัดไปท้ายตาราง ปิดปุ่มระหว่างรอ | `listPurchaseRequests` |
| กดปุ่มสร้าง PR | ผู้ใช้เป็น `REQUESTER` (บทบาทอื่นไม่เห็นปุ่ม) | ไป SCR-02 โหมดสร้าง | ไม่เรียก |
| กดแถว | ทุกบทบาท | ไป SCR-02 ของ `prId` นั้น: แก้ไขได้ถ้า `DRAFT` และเป็นผู้ขอ นอกนั้นอ่านอย่างเดียว | ไม่เรียก (SCR-02 โหลดเอง) |
| กดลิงก์ท้ายแถว | `APPROVED` และเป็น `PROCUREMENT`: "สร้าง RFQ" ไป SCR-04; `IN_SOURCING` และ `rfqId` ไม่ว่าง: "เปรียบเทียบราคา" ไป SCR-05; `ORDERED` และ `poId` ไม่ว่าง: "รับของ" ไป SCR-07 | ไปหน้านั้นพร้อมรหัสเอกสาร | ไม่เรียก |

{{bind:UIX-01}}

<!-- table: สถานะของหน้า SCR-01 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ response | โครงตารางเปล่า ปุ่มโหลดเพิ่มปิด คงตัวกรองไว้ |
| ว่าง ไม่มีตัวกรอง | `items` ว่างและไม่มีตัวกรอง | "ยังไม่มีใบขอซื้อ" และปุ่มสร้าง PR (เฉพาะ `REQUESTER`) |
| ว่าง มีตัวกรอง | `items` ว่างและมีตัวกรอง | "ไม่พบใบขอซื้อตามเงื่อนไข" และปุ่มล้างตัวกรอง |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่แล้วกลับหน้านี้พร้อมตัวกรองเดิม |
| ไม่มีสิทธิ์ | `403` `ERR-AUTH-002` | หน้าแจ้งไม่มีสิทธิ์ ไม่เปลี่ยนเส้นทางเงียบๆ |
| ระบบขัดข้อง | `5xx` หรือเครือข่ายล่ม | แถบแจ้งข้อผิดพลาดพร้อมปุ่มลองใหม่ คงรายการที่โหลดแล้ว |
