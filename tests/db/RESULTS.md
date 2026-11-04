# ผลทดสอบฐานข้อมูล (SQL Server)

> สร้างอัตโนมัติด้วยสคริปต์ภายใน (ไม่เผยแพร่) ห้ามแก้ไฟล์นี้ด้วยมือ

| รายการ | ค่า |
|---|---|
| วันที่รัน (UTC) | 2026-11-04T10:59:52Z |
| SQL Server | 16.0.4305.5 Developer Edition (64-bit) (image `mcr.microsoft.com/mssql/server:2022-latest`, linux/amd64) |
| `sql/schema.sql` (SHA-256 16 ตัวแรก) | 634cf8ad1127d35b |
| `sql/tests.sql` (SHA-256 16 ตัวแรก) | 70f863c3a7989d9a |
| ผลการสร้าง schema | สำเร็จ: 17 tables, 106 columns, 1 procedure |
| การทดสอบ constraint/สิทธิ์ | 13 รายการผ่าน |
| ออกเลขเอกสารพร้อมกัน (20 เธรด × 50) | rows=1000 distinct=1000 first=PR-2026-00001 last=PR-2026-01000; เธรดที่ล้มเหลว: 0 |
| ตัวควบคุม: `MAX()+1` แบบไม่ล็อก | rows=1000 distinct=229 |

## ผลดิบของ tests.sql

```text
seed ok
PASS BR-07 not-invited vendor rejected (error 547)
PASS BR-08 second active quotation rejected (error 2601)
PASS TC-24 replacement keeps history, one active
PASS FR-11 duplicate tax id rejected (error 2627)
PASS TC-03 quantity 0 rejected
PASS invalid role_code rejected
PASS invalid PR status rejected
PASS duplicate approval step rejected
PASS TC-04 row_version changes on update
PASS TC-47 app account can INSERT audit rows
PASS TC-47 UPDATE denied (error 229)
PASS TC-47 DELETE denied (error 229)
PASS FR-14 format PREFIX-YYYY-NNNNN, sequential, independent per document type
DB TESTS DONE
```
