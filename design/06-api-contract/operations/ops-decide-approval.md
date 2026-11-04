---
doc_id: OPS-decideApproval
operation: decideApproval
checks: ขั้นปัจจุบันตรงบทบาทผู้เรียก; ผู้เรียกไม่ใช่ผู้ขอซื้อ/ผู้เสนอผล (`ERR-SOD-001`); ขั้นยัง `PENDING` (`ERR-STATE-001`); ปฏิเสธต้องมี `comment`; ถ้าอนุมัติและเป็นขั้นสุดท้าย เปลี่ยนสถานะเอกสาร
success: 'อนุมัติขั้นสุดท้าย: PR เป็น `APPROVED` หรือ RFQ เป็น `AWARDED`; ปฏิเสธ: PR กลับ `DRAFT`, RFQ กลับ `OPEN`'
---

# decideApproval
