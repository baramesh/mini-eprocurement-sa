---
doc_id: IDX-01
index: ix_pr_status_created (status, created_at DESC) INCLUDE (pr_no, department_id, total_estimated)
query: หน้ารายการ PR กรองตามสถานะ เรียงล่าสุด เป็น covering index ไม่ต้อง key lookup
tables:
- purchase_request
operations:
- listPurchaseRequests
---

# ดัชนี 1
