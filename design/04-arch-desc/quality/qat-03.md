---
doc_id: QAT-03
nfr: NFR-03
verified_by:
- AC-02-01
- AC-04-01
- AC-04-05
- AC-12-02
- AC-02-04
---

# ทุก endpoint ตรวจสิทธิ์ตามบทบาทและขอบเขตข้อมูล

JWT จาก SSO, ตรวจ `x-roles` ต่อ operation, กรองข้อมูลตามหน่วยงานใน service, แยกหน้าที่ในโมดูลอนุมัติ
