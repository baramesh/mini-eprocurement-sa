---
doc_id: STP-05
decide: –
ai: เขียน OpenAPI {{count:ops}} operation พร้อม `x-fr` และ `x-roles` รหัสข้อผิดพลาด {{count:errors}} รหัส และกฎต่อ operation
artifact: '`api/openapi.yaml`, `design/06-api-contract/` (เล่ม API)'
check: 'ตัวตรวจ: `$ref` ทุกตัวหาเจอ ทุก operation มี FR และบทบาทที่ถูกต้อง'
---

# API
