---
doc_id: FND-03
what: รัน `sql/schema.sql` บน SQL Server ครั้งแรกแล้ว filtered index ล้มเหลว เพราะ `sqlcmd` ตั้ง `QUOTED_IDENTIFIER` เป็น OFF โดยปริยาย ต่างจากการเชื่อมต่อของแอป การอ่านด้วยตาไม่เจอ
fix: เพิ่ม `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;` ที่หัวไฟล์ แล้วรันซ้ำบนฐานข้อมูลเปล่าจนผ่าน
---

# schema สร้างไม่ผ่านตอนรันจริง
