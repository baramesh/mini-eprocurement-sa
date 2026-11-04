---
doc_id: CNV-06
errors:
- ERR-CONC-001
---

# การแก้ไขซ้อน

`PUT` ใบขอซื้อต้องมี `If-Match` เป็น `rowVersion`; ไม่ตรงตอบ 409 `ERR-CONC-001`
