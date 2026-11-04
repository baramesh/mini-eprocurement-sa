<!-- table: Backlog -->
| รหัส | ชื่อ | Sprint | Epic | ความสำคัญ | SP dev | SP qa | Dependency | สถานะ |
|--|--------|--|--|--|--|--|-----|--|
| `PRC-S1` | ฐานข้อมูลและการออกเลขเอกสาร | 1 | JNY-01 | must | 8 | 3 | – | draft |
| `PRC-S2` | โครงพื้นฐานของ API | 1 | JNY-01 | must | 8 | 5 | PRC-S1 | draft |
| `PRC-S3` | สายอนุมัติและ audit trail | 1 | JNY-01 | must | 5 | 3 | PRC-S1, PRC-S2 | draft |
| `PRC-01` | รายการใบขอซื้อ | 1 | JNY-01 | must | 3 | 2 | PRC-S1, PRC-S2 | draft |
| `PRC-02` | แบบฟอร์มใบขอซื้อ | 1 | JNY-01 | must | 8 | 5 | PRC-S1, PRC-S2, PRC-01 | draft |
| `PRC-03` | กล่องอนุมัติ | 1 | JNY-01 | must | 5 | 3 | PRC-02, PRC-S3 | draft |
| `PRC-08` | ทะเบียนผู้ขาย | 2 | JNY-02 | must | 3 | 2 | PRC-S1, PRC-S2 | draft |
| `PRC-04` | สร้าง RFQ และเชิญผู้ขาย | 2 | JNY-02 | must | 5 | 3 | PRC-03, PRC-08 | draft |
| `PRC-05` | บันทึกและเปรียบเทียบใบเสนอราคา | 2 | JNY-02 | must | 8 | 5 | PRC-04, PRC-S3 | draft |
| `PRC-06` | ใบสั่งซื้อ | 3 | JNY-03 | must | 5 | 3 | PRC-05, PRC-03 | draft |
| `PRC-07` | บันทึกการรับของ | 3 | JNY-03 | must | 5 | 3 | PRC-06 | draft |
| `PRC-09` | รายงานสรุปการจัดซื้อ | 4 | JNY-04 | should | 5 | 3 | PRC-06, PRC-07 | draft |
| `PRC-10` | Audit trail | 4 | JNY-04 | should | 2 | 2 | PRC-S3 | draft |
