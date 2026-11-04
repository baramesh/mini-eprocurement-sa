---
doc_id: UIX-09
screen: SCR-09
operations:
- getSpendSummary
rules: []
errors:
- ERR-AUTH-001
- ERR-VAL-001
ia:
- IAR-01
- IAR-04
uir:
- UIR-01
- UIR-02
bindings:
- event: กดแสดงรายงาน หรือเปลี่ยนการจัดกลุ่ม
  operation: getSpendSummary
  sends: ["from", "to", "groupBy"]
  reads: ["from", "to", "rows[].group", "rows[].prCount", "rows[].poCount", "rows[].estimatedTotal", "rows[].orderedTotal", "rows[].savingVsEstimate"]
  ui: ตารางสรุปตามกลุ่ม และแถวรวมที่หน้าคำนวณจากผลรวมของแถว
---

# พฤติกรรมหน้า SCR-09 รายงานสรุปการจัดซื้อ

**เส้นทาง:** `/reports/spend` เข้าได้เฉพาะ `PROCUREMENT_HEAD` และ `ADMIN` ช่วงเริ่มต้นคือเดือนปัจจุบัน จัดกลุ่มเริ่มต้นตามหน่วยงาน

<!-- table: เหตุการณ์ในหน้า SCR-09 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้า | บทบาทที่เข้าได้ | แสดงรายงานของเดือนปัจจุบัน จัดกลุ่มตามหน่วยงาน | `getSpendSummary` |
| เปลี่ยนช่วงวันที่หรือการจัดกลุ่ม | `from` ไม่เกิน `to` | โหลดรายงานใหม่ | `getSpendSummary` |

{{bind:UIX-09}}

<!-- table: สถานะของหน้า SCR-09 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ response | โครงตาราง |
| ว่าง | `rows` ว่าง | "ไม่มีรายการในช่วงที่เลือก" |
| ช่วงวันที่ผิด | `from` เกิน `to` หรือ `422` `ERR-VAL-001` | ข้อความที่ช่องวันที่ |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับหน้านี้ |
