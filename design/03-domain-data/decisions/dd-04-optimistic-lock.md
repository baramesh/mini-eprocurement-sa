---
doc_id: DD-04
decision: '`row_version` (ROWVERSION) ใน `purchase_request`'
reason: ผู้ใช้สองคนแก้ draft เดียวกัน คนหลังได้ conflict แทนที่จะเขียนทับเงียบๆ
tables:
- purchase_request
errors:
- ERR-CONC-001
---

# ล็อกการแก้ซ้อน
