---
doc_id: STP-13
decide: –
ai: เขียนชุดทดสอบ constraint สิทธิ์ audit และการออกเลข 1,000 เลขพร้อมกัน รันบน SQL Server 2022 ใน Docker พร้อมตัวควบคุม
artifact: '`sql/tests.sql`, `tests/db/RESULTS.md`'
check: ผ่านทั้งหมด ตัวควบคุม (`MAX()+1`) ได้เลขซ้ำจำนวนมาก
---

# ทดสอบฐานข้อมูล
