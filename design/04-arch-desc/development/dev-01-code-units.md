---
doc_id: DEV-01
components:
- CMP-01
- CMP-02
- CMP-03
- CMP-04
- CMP-05
- CMP-06
- CMP-07
- CMP-08
containers:
- CTN-03
adrs:
- ADR-01
- ADR-02
- ADR-06
see:
- V-06
---

# หน่วยโค้ดของ API service

API service (CTN-03) เป็น modular monolith โมดูลธุรกิจแต่ละตัว (CMP-01 ถึง CMP-07) แบ่งโค้ดเป็นสี่ชั้นเหมือนกัน และ CMP-08 เป็นโมดูลแพลตฟอร์มที่ทุกโมดูลใช้ร่วม

<!-- table: ชั้นของโค้ดในแต่ละโมดูล -->
| ชั้น | หน้าที่ | ต้องไม่ทำ |
|---|---|---|
| Controller | รับ HTTP แปลง path query body เป็นคำสั่งของโมดูล ส่งผลกลับตามสัญญา OpenAPI แปลงข้อผิดพลาดของโมดูลเป็น `Problem` | ใส่กฎธุรกิจ เรียกฐานข้อมูลตรง |
| Application service | หนึ่ง operation หนึ่งเมธอด เปิดและปิดธุรกรรม เรียก policy และ repository ตามลำดับใน runtime view ของ operation นั้น เขียน audit | รู้จัก HTTP หรือรูปแบบ JSON |
| Domain policy | กฎล้วนๆ ไม่มี I/O: สายอนุมัติตามวงเงิน แยกหน้าที่ การเปลี่ยนสถานะที่อนุญาต การคำนวณวงเงินและการปัดเศษ เกณฑ์ซื้อตรง รับของไม่เกินจำนวนสั่ง | เรียก repository หรืออ่านเวลาปัจจุบันเอง (รับเวลาเป็นพารามิเตอร์) |
| Repository | คำสั่ง SQL ของตารางที่โมดูลเป็นเจ้าของ ส่งค่า `rowVersion` และจัดการ `If-Match` | ใส่กฎธุรกิจ เปิดธุรกรรมเอง |

<!-- table: ทิศทางการพึ่งพาของโมดูล -->
| กฎ | ความหมาย |
|---|---|
| ชั้นพึ่งพาลงล่างเท่านั้น | Controller → Application service → Domain policy และ Repository; Domain policy ไม่พึ่งชั้นอื่น |
| โมดูลไม่อ่านตารางของโมดูลอื่น | ต้องเรียก application service ของโมดูลเจ้าของ เช่น การสร้าง RFQ อ่านและเปลี่ยนสถานะ PR ผ่าน CMP-01 |
| ธุรกรรมเป็นของ application service | เมธอดของ operation หนึ่งตัวเปิดธุรกรรมเดียว การเรียกข้ามโมดูลอยู่ในธุรกรรมเดียวกัน |
| CMP-08 ให้บริการร่วม | ตรวจ token และบทบาท (V-06) ออกเลขเอกสาร (`usp_next_doc_no`) เขียน audit ตรวจ `Idempotency-Key` แปลงข้อผิดพลาดเป็น `Problem` |
| สัญญา OpenAPI เป็นต้นฉบับ | ชนิดของ request และ response สร้างจาก `api/openapi.yaml` ไม่เขียนมือซ้ำ |
