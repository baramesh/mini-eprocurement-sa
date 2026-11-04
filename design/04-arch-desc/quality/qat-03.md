---
doc_id: QAT-03
nfr: NFR-03
verified_by:
- TC-05
- TC-12
- TC-16
- TC-45
- TC-51
---

# ทุก endpoint ตรวจสิทธิ์ตามบทบาทและขอบเขตข้อมูล

JWT จาก SSO, ตรวจ `x-roles` ต่อ operation, กรองข้อมูลตามหน่วยงานใน service, แยกหน้าที่ในโมดูลอนุมัติ
