---
doc_id: AC-11-02
verifies:
- FR-11
kind: Negative
operation: createVendor
scenario: '`taxId` 12 หลัก'
expected: 422 `ERR-VAL-001`
errors:
- ERR-VAL-001
---

# เลขภาษีไม่ครบ 13 หลัก
