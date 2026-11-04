---
doc_id: AC-13-02
verifies:
- FR-13
kind: Security
operation: listAuditLogs
scenario: พยายาม `UPDATE`/`DELETE` ตาราง `audit_log` ด้วยบัญชีแอป
expected: ถูกปฏิเสธโดยฐานข้อมูล (NFR-02)
nfr:
- NFR-02
---

# บัญชีแอปแก้ audit ไม่ได้
