---
doc_id: WF-07
screen: SCR-07
caption: Wireframe ของหน้าจอ SCR-07 บันทึกการรับของ
image: design/05-ui-desc/wireframes/img/wf-07-goods-receipt.png
source: design/05-ui-desc/wireframes/wireframes.figcraft
rules:
- BR-10
errors:
- ERR-GR-001
---

# Wireframe SCR-07 บันทึกการรับของ

เลขกำกับในภาพ:

1. ตารางรับของ: สั่ง รับสะสม และคงเหลือ แยกตามรายการ
2. ข้อความผิดพลาดเมื่อจำนวนรับเกินคงเหลือ (BR-10, ERR-GR-001) จำนวนที่ปฏิเสธไม่นับเป็นรับ
3. บันทึกรับของ สถานะ PO เปลี่ยนเป็น PARTIALLY_RECEIVED หรือ RECEIVED และปิด PR เมื่อรับครบ
