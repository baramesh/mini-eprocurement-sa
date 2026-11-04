---
doc_id: AC-13-01
verifies:
- FR-13
kind: Positive
operation: listAuditLogs
scenario: PR ที่ผ่าน ส่ง→อนุมัติ→สร้าง RFQ
expected: ประวัติของ PR มี `SUBMIT` แล้ว `APPROVE` ทุกขั้นเรียงตามเวลา และประวัติของ RFQ ที่สร้างจาก PR นั้นมี `CREATE`
---

# ตรวจ audit ของ PR
