---
doc_id: NAV-01
caption: ผังการนำทางระหว่างหน้าจอ
screens:
- SCR-01
- SCR-02
- SCR-03
- SCR-04
- SCR-05
- SCR-06
- SCR-07
- SCR-08
---

# ผังการนำทาง

```mermaid
flowchart LR
    L[SCR-01 รายการ PR] --> F[SCR-02 ฟอร์ม PR]
    F --> L
    I[SCR-03 กล่องอนุมัติ] --> F
    L --> R4[SCR-04 สร้าง RFQ]
    R4 --> Q[SCR-05 ใบเสนอราคา]
    Q --> I
    Q --> P[SCR-06 ใบสั่งซื้อ]
    P --> G[SCR-07 รับของ]
    V[SCR-08 ผู้ขาย] --> R4
```
