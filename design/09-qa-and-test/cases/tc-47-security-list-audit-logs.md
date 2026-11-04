---
doc_id: TC-47
type: Security
frs:
- FR-13
operation: listAuditLogs
steps: พยายาม `UPDATE`/`DELETE` ตาราง `audit_log` ด้วยบัญชีแอป
expected: ถูกปฏิเสธโดยฐานข้อมูล (NFR-02)
---

# บัญชีแอปแก้ audit ไม่ได้
