---
doc_id: CNV-06
errors:
- ERR-CONC-001
- ERR-VAL-001
---

# การแก้ไขซ้อน

`PUT` ใบขอซื้อต้องมี `If-Match` เป็น `rowVersion`; ไม่ส่งหัวนี้ตอบ 422 `ERR-VAL-001` ที่ field `If-Match`; ไม่ตรงกับเวอร์ชันปัจจุบันตอบ 409 `ERR-CONC-001`
