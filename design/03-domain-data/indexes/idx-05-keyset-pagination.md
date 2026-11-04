---
doc_id: IDX-05
nfr:
- NFR-01
operations:
- listPurchaseRequests
---

# Pagination แบบ keyset

หน้ารายการใช้ pagination แบบ keyset (ตามฟิลด์ `created_at, pr_id`) เพื่อให้เวลาตอบไม่โตตามจำนวนหน้า ข้อนี้ยังไม่ได้วัดประสิทธิภาพจริงที่ 100,000 PR (ดูข้อจำกัดในเอกสารทดสอบ)
