---
doc_id: FND-07
what: ทดสอบเชิงลบแล้ว Journey ที่ถูกแยกข้าม Sprint ได้ verdict `BLOCKED` แต่ตัวตรวจยังจบสำเร็จ และล้มด้วย traceback เมื่อการ์ดอ้าง operation ที่ไม่มีอยู่
fix: ให้ `BLOCKED` นับเป็น error และให้ข้อความ error แทน traceback แล้วทดสอบซ้ำจนจับได้ทั้ง 4 แบบ
---

# ตัวตรวจแผนงานหลวมเกินไป
