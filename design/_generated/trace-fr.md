<!-- table: FR ไปยัง Use Case หน้าจอ API และกรณีทดสอบ -->
| FR | หัวข้อ | UC | หน้าจอ | API operation | กรณีทดสอบ |
|--|--------|--|--|-------|-------|
| FR-01 | สร้างและแก้ไขใบขอซื้อ | UC-01 | SCR-02 | `createPurchaseRequest`, `updatePurchaseRequest` | TC-01, TC-02, TC-03, TC-04 |
| FR-02 | ค้นหาและดูรายการใบขอซื้อ | UC-01 | SCR-01 | `getPurchaseRequest`, `listPurchaseRequests` | TC-05, TC-49, TC-50, TC-51 |
| FR-03 | ส่งใบขอซื้อเพื่ออนุมัติ | UC-02 | SCR-02 | `submitPurchaseRequest` | TC-06, TC-07, TC-08, TC-09, TC-10, TC-11 |
| FR-04 | อนุมัติหรือปฏิเสธตามสายอนุมัติ | UC-03 | SCR-03 | `decideApproval`, `listMyApprovals` | TC-06, TC-07, TC-08, TC-09, TC-12, TC-13, TC-14, TC-15, TC-16 |
| FR-05 | สร้าง RFQ และเชิญผู้ขาย | UC-04 | SCR-04 | `createRfq` | TC-17, TC-18, TC-19, TC-20, TC-21 |
| FR-06 | บันทึกใบเสนอราคา | UC-04 | SCR-05 | `recordQuotation` | TC-22, TC-23, TC-24 |
| FR-07 | เปรียบเทียบราคา | UC-05 | SCR-05 | `getQuotationComparison` | TC-25 |
| FR-08 | เลือกผู้ชนะพร้อมเหตุผล | UC-05 | SCR-03, SCR-05 | `awardRfq`, `decideApproval` | TC-26, TC-27, TC-28, TC-29, TC-30 |
| FR-09 | ออกใบสั่งซื้อ | UC-06 | SCR-06 | `createPurchaseOrder`, `issuePurchaseOrder` | TC-31, TC-32, TC-33, TC-34, TC-35 |
| FR-10 | รับของตามใบสั่งซื้อ | UC-07 | SCR-07 | `recordGoodsReceipt` | TC-36, TC-37, TC-38, TC-39 |
| FR-11 | จัดการทะเบียนผู้ขาย | UC-08 | SCR-08 | `createVendor`, `listVendors`, `setVendorStatus` | TC-20, TC-33, TC-40, TC-41, TC-42, TC-43 |
| FR-12 | รายงานสรุปการจัดซื้อ | UC-09 | SCR-09 | `getSpendSummary` | TC-44, TC-45 |
| FR-13 | บันทึก audit trail | UC-03, UC-05, UC-10 | SCR-10 | `awardRfq`, `decideApproval`, `issuePurchaseOrder`, `listAuditLogs`, `setVendorStatus`, `submitPurchaseRequest` | TC-10, TC-14, TC-30, TC-34, TC-42, TC-46, TC-47 |
| FR-14 | ออกเลขเอกสารอัตโนมัติ | UC-01, UC-04, UC-06, UC-07 | – | `createPurchaseOrder`, `createPurchaseRequest`, `createRfq`, `recordGoodsReceipt` | TC-01, TC-17, TC-31, TC-36, TC-48 |
