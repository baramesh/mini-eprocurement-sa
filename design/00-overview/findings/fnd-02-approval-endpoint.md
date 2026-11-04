---
doc_id: FND-02
what: ร่างแรกให้อนุมัติผลเลือกผู้ชนะผ่าน endpoint ของ PR โดยแยกด้วยฟิลด์ `target` ซึ่งปนความรับผิดชอบ
fix: เปลี่ยนเป็น endpoint กลาง `/approvals` ที่แยกชนิดงานด้วย `docType` แล้วแก้ sequence diagram ให้ตรง
---

# การออกแบบ endpoint อนุมัติ
