<!-- table: FR ไปยัง Use Case หน้าจอ API เกณฑ์ตรวจรับ และการ์ดงาน -->
| FR | หัวข้อ | UC | หน้าจอ | API operation | เกณฑ์ตรวจรับ | การ์ด | สถานะการ์ด |
|--|--------|--|--|-------|-------|-----|-----|
| FR-01 | สร้างและแก้ไขใบขอซื้อ | UC-01 | SCR-02 | `createPurchaseRequest`, `updatePurchaseRequest` | AC-01-01, AC-01-02, AC-01-03, AC-01-04 | PRC-02 | draft x1 |
| FR-02 | ค้นหาและดูรายการใบขอซื้อ | UC-01 | SCR-01 | `getPurchaseRequest`, `listPurchaseRequests` | AC-02-01, AC-02-02, AC-02-03, AC-02-04 | PRC-01 | draft x1 |
| FR-03 | ส่งใบขอซื้อเพื่ออนุมัติ | UC-02 | SCR-02 | `submitPurchaseRequest` | AC-03-01, AC-03-02, AC-03-03, AC-03-04, AC-03-05, AC-03-06, AC-03-07 | PRC-02 | draft x1 |
| FR-04 | อนุมัติหรือปฏิเสธตามสายอนุมัติ | UC-03 | SCR-03 | `decideApproval`, `listMyApprovals` | AC-03-01, AC-03-02, AC-03-03, AC-03-04, AC-04-01, AC-04-02, AC-04-03, AC-04-04, AC-04-05 | PRC-03, PRC-S3 | draft x2 |
| FR-05 | สร้าง RFQ และเชิญผู้ขาย | UC-04 | SCR-04 | `createRfq` | AC-05-01, AC-05-02, AC-05-03, AC-05-04, AC-05-05 | PRC-04 | draft x1 |
| FR-06 | บันทึกใบเสนอราคา | UC-04 | SCR-05 | `recordQuotation` | AC-06-01, AC-06-02, AC-06-03 | PRC-05 | draft x1 |
| FR-07 | เปรียบเทียบราคา | UC-05 | SCR-05 | `getQuotationComparison` | AC-07-01 | PRC-05 | draft x1 |
| FR-08 | เลือกผู้ชนะพร้อมเหตุผล | UC-05 | SCR-03, SCR-05 | `awardRfq`, `decideApproval` | AC-08-01, AC-08-02, AC-08-03, AC-08-04, AC-08-05 | PRC-03, PRC-05 | draft x2 |
| FR-09 | ออกใบสั่งซื้อ | UC-06 | SCR-06 | `createPurchaseOrder`, `issuePurchaseOrder` | AC-09-01, AC-09-02, AC-09-03, AC-09-04, AC-09-05 | PRC-06 | draft x1 |
| FR-10 | รับของตามใบสั่งซื้อ | UC-07 | SCR-07 | `recordGoodsReceipt` | AC-10-01, AC-10-02, AC-10-03, AC-10-04 | PRC-07 | draft x1 |
| FR-11 | จัดการทะเบียนผู้ขาย | UC-08 | SCR-08 | `createVendor`, `listVendors`, `setVendorStatus` | AC-05-04, AC-09-03, AC-11-01, AC-11-02, AC-11-03, AC-11-04 | PRC-08 | draft x1 |
| FR-12 | รายงานสรุปการจัดซื้อ | UC-09 | SCR-09 | `getSpendSummary` | AC-12-01, AC-12-02 | PRC-09 | draft x1 |
| FR-13 | บันทึก audit trail | UC-03, UC-05, UC-10 | SCR-10 | `awardRfq`, `decideApproval`, `issuePurchaseOrder`, `listAuditLogs`, `setVendorStatus`, `submitPurchaseRequest` | AC-03-05, AC-04-03, AC-08-05, AC-09-04, AC-11-03, AC-13-01, AC-13-02 | PRC-10, PRC-S1, PRC-S3 | draft x3 |
| FR-14 | ออกเลขเอกสารอัตโนมัติ | UC-01, UC-04, UC-06, UC-07 | – | `createPurchaseOrder`, `createPurchaseRequest`, `createRfq`, `recordGoodsReceipt` | AC-01-01, AC-05-01, AC-09-01, AC-10-01, AC-14-01 | PRC-S1 | draft x1 |
