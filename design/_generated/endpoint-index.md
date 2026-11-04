ทั้งหมด 21 operation

<!-- table: ดัชนี endpoint ทั้งหมดของ API -->
| Method | Path | operationId | สรุป | บทบาท | FR |
|--|----------|----------|--------|---------|----|
| GET | `/purchase-requests` | `listPurchaseRequests` | ค้นหารายการใบขอซื้อ | REQUESTER, DEPT_APPROVER, PROCUREMENT, PROCUREMENT_HEAD, COMMITTEE, ADMIN | FR-02 |
| POST | `/purchase-requests` | `createPurchaseRequest` | สร้างใบขอซื้อ (draft) | REQUESTER | FR-01, FR-14 |
| GET | `/purchase-requests/{prId}` | `getPurchaseRequest` | ดูรายละเอียดใบขอซื้อ | REQUESTER, DEPT_APPROVER, PROCUREMENT, PROCUREMENT_HEAD, COMMITTEE, ADMIN | FR-02 |
| PUT | `/purchase-requests/{prId}` | `updatePurchaseRequest` | แก้ไขใบขอซื้อที่เป็น draft | REQUESTER | FR-01 |
| POST | `/purchase-requests/{prId}/submit` | `submitPurchaseRequest` | ส่งใบขอซื้อเพื่ออนุมัติ | REQUESTER | FR-03, FR-13 |
| GET | `/approvals` | `listMyApprovals` | กล่องอนุมัติของผู้เรียก (เฉพาะขั้นที่ถึงบทบาทตน) | DEPT_APPROVER, PROCUREMENT_HEAD, COMMITTEE | FR-04 |
| POST | `/approvals/{approvalId}/decision` | `decideApproval` | อนุมัติหรือปฏิเสธ | DEPT_APPROVER, PROCUREMENT_HEAD, COMMITTEE | FR-04, FR-08, FR-13 |
| POST | `/rfqs` | `createRfq` | สร้าง RFQ จาก PR ที่อนุมัติแล้วและเชิญผู้ขาย | PROCUREMENT | FR-05, FR-14 |
| GET | `/rfqs/{rfqId}` | `getRfq` | ดูรายละเอียด RFQ (รายการ PR และผู้ขายที่เชิญ) | PROCUREMENT, PROCUREMENT_HEAD, COMMITTEE | FR-05, FR-06 |
| POST | `/rfqs/{rfqId}/quotations` | `recordQuotation` | บันทึกใบเสนอราคาของผู้ขาย | PROCUREMENT | FR-06 |
| GET | `/rfqs/{rfqId}/comparison` | `getQuotationComparison` | ตารางเปรียบเทียบราคา | PROCUREMENT, PROCUREMENT_HEAD, COMMITTEE | FR-07 |
| POST | `/rfqs/{rfqId}/award` | `awardRfq` | เสนอผลเลือกผู้ชนะเพื่ออนุมัติ | PROCUREMENT | FR-08, FR-13 |
| POST | `/purchase-orders` | `createPurchaseOrder` | สร้าง PO (จากผลประกวดที่อนุมัติ หรือซื้อตรงวงเงินต่ำ) | PROCUREMENT | FR-09, FR-14 |
| GET | `/purchase-orders/{poId}` | `getPurchaseOrder` | ดูรายละเอียด PO พร้อมยอดสั่ง รับสะสม และคงเหลือ | PROCUREMENT, PROCUREMENT_HEAD, RECEIVER, ADMIN | FR-09, FR-10 |
| POST | `/purchase-orders/{poId}/issue` | `issuePurchaseOrder` | ออก PO ให้ผู้ขาย | PROCUREMENT | FR-09, FR-13 |
| POST | `/purchase-orders/{poId}/receipts` | `recordGoodsReceipt` | บันทึกการรับของ | RECEIVER | FR-10, FR-14 |
| GET | `/vendors` | `listVendors` | ค้นหาผู้ขาย | PROCUREMENT, PROCUREMENT_HEAD, ADMIN | FR-11 |
| POST | `/vendors` | `createVendor` | เพิ่มผู้ขาย | PROCUREMENT | FR-11 |
| PUT | `/vendors/{vendorId}/status` | `setVendorStatus` | ระงับหรือเปิดใช้ผู้ขาย | PROCUREMENT_HEAD | FR-11, FR-13 |
| GET | `/reports/spend-summary` | `getSpendSummary` | รายงานสรุปการจัดซื้อ | PROCUREMENT_HEAD, ADMIN | FR-12 |
| GET | `/audit-logs` | `listAuditLogs` | ตรวจ audit trail ของเอกสาร | ADMIN | FR-13 |
