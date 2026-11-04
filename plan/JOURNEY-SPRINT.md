# JOURNEY-SPRINT — PRC

> สร้างอัตโนมัติจาก `plan/cards/*.md` ห้ามแก้ไฟล์นี้ด้วยมือ

## JNY-01 ขอซื้อและอนุมัติ

| Phase | การ์ด | สถานะ | Sprint | Dependency |
|---:|---|---|---:|---|
| 0 | `PRC-S1` | draft | 1 | – |
| 0 | `PRC-S2` | draft | 1 | PRC-S1 |
| 0 | `PRC-S3` | draft | 1 | PRC-S1, PRC-S2 |
| 1 | `PRC-01` | draft | 1 | PRC-S1, PRC-S2 |
| 2 | `PRC-02` | draft | 1 | PRC-S1, PRC-S2, PRC-01 |
| 3 | `PRC-03` | draft | 1 | PRC-02, PRC-S3 |

### Gate

- ครอบคลุมหน้าจอของ Journey: `PASS`
- ทุกการ์ดหน้าจอจบใน Sprint เดียว: `PASS` (Sprint 1)
- Dependency ไม่ข้าม Sprint ไปข้างหลัง: `PASS`
- Verdict: `REFINING`

## JNY-02 จัดหาและเลือกผู้ชนะ

| Phase | การ์ด | สถานะ | Sprint | Dependency |
|---:|---|---|---:|---|
| 1 | `PRC-08` | draft | 2 | PRC-S1, PRC-S2 |
| 2 | `PRC-04` | draft | 2 | PRC-03, PRC-08 |
| 3 | `PRC-05` | draft | 2 | PRC-04, PRC-S3 |

### Gate

- ครอบคลุมหน้าจอของ Journey: `PASS`
- ทุกการ์ดหน้าจอจบใน Sprint เดียว: `PASS` (Sprint 2)
- Dependency ไม่ข้าม Sprint ไปข้างหลัง: `PASS`
- Verdict: `REFINING`

## JNY-03 สั่งซื้อและรับของ

| Phase | การ์ด | สถานะ | Sprint | Dependency |
|---:|---|---|---:|---|
| 1 | `PRC-06` | draft | 3 | PRC-05, PRC-03 |
| 2 | `PRC-07` | draft | 3 | PRC-06 |

### Gate

- ครอบคลุมหน้าจอของ Journey: `PASS`
- ทุกการ์ดหน้าจอจบใน Sprint เดียว: `PASS` (Sprint 3)
- Dependency ไม่ข้าม Sprint ไปข้างหลัง: `PASS`
- Verdict: `REFINING`

## JNY-04 รายงานและตรวจสอบ

| Phase | การ์ด | สถานะ | Sprint | Dependency |
|---:|---|---|---:|---|
| 1 | `PRC-09` | draft | 4 | PRC-06, PRC-07 |
| 2 | `PRC-10` | draft | 4 | PRC-S3 |

### Gate

- ครอบคลุมหน้าจอของ Journey: `PASS`
- ทุกการ์ดหน้าจอจบใน Sprint เดียว: `PASS` (Sprint 4)
- Dependency ไม่ข้าม Sprint ไปข้างหลัง: `PASS`
- Verdict: `REFINING`
