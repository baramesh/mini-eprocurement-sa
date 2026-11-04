---
doc_id: AC-11-01
verifies:
- FR-11
kind: Negative
operation: createVendor
scenario: '`taxId` ซ้ำกับผู้ขายเดิม'
expected: 409 `ERR-VND-001`
errors:
- ERR-VND-001
---

# เพิ่มผู้ขายเลขภาษีซ้ำ
