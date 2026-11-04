---
doc_id: AC-02-01
verifies:
- FR-02
kind: Security
operation: listPurchaseRequests
scenario: ผู้ขอซื้อ A เรียกรายการ ขณะมี PR ของ B ในระบบ
expected: ผลไม่มี PR ของ B
---

# ผู้ขอซื้อเห็นเฉพาะ PR ของตน
