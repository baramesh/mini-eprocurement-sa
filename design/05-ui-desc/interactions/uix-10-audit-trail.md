---
doc_id: UIX-10
screen: SCR-10
operations:
- listAuditLogs
rules: []
errors:
- ERR-AUTH-001
- ERR-VAL-001
ia:
- IAR-01
- IAR-04
uir:
- UIR-01
bindings:
- event: กดค้นหา
  operation: listAuditLogs
  sends: ["entity", "entityId"]
  reads: ["[].auditId", "[].action", "[].actorId", "[].detail", "[].createdAt"]
  ui: เส้นเวลาเหตุการณ์ของเอกสาร เรียงตามเวลา
---

# พฤติกรรมหน้า SCR-10 Audit trail

**เส้นทาง:** `/audit?entity={entity}&entityId={id}` เข้าได้เฉพาะ `ADMIN` ต้องระบุชนิดและรหัสเอกสารก่อนจึงเรียก API ได้

<!-- table: เหตุการณ์ในหน้า SCR-10 -->
| ตัวกระตุ้น | เงื่อนไข | ผลที่ผู้ใช้เห็น | เรียก API |
|---|---|---|---|
| เปิดหน้า | ไม่มี query | แสดงแบบเลือกชนิดและกรอกรหัสเอกสาร ยังไม่เรียก API | ไม่เรียก |
| เปิดหน้าด้วย query | มี `entity` และ `entityId` | แสดงเหตุการณ์ของเอกสาร | `listAuditLogs` |
| กดค้นหา | เลือกชนิดและกรอกรหัสครบ | แสดงเหตุการณ์ของเอกสาร | `listAuditLogs` |

{{bind:UIX-10}}

{{rules:UIX-10}}

<!-- table: สถานะของหน้า SCR-10 -->
| สถานะ | เมื่อไร | สิ่งที่แสดง |
|---|---|---|
| กำลังโหลด | ระหว่างรอ response | โครงเส้นเวลา |
| ว่าง | ไม่มีเหตุการณ์ | "ไม่มีเหตุการณ์ของเอกสารนี้" |
| ข้อมูลไม่ผ่านการตรวจ | `422` `ERR-VAL-001` | ข้อความที่ช่องรหัสเอกสาร |
| token หมดอายุ | `401` `ERR-AUTH-001` | ไปยืนยันตัวตนใหม่ แล้วกลับหน้านี้ |
