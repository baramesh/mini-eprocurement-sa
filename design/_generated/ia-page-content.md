<!-- table: ข้อมูลที่แต่ละหน้าจอแสดงและบันทึก -->
| หน้าจอ | API operation | ตารางข้อมูลที่เกี่ยวข้อง |
|-----------|------------------|------------------|
| SCR-01 รายการใบขอซื้อ | `listPurchaseRequests` | `app_user`, `department`, `purchase_request` |
| SCR-02 แบบฟอร์มใบขอซื้อ | `getPurchaseRequest`, `createPurchaseRequest`, `updatePurchaseRequest`, `submitPurchaseRequest` | `pr_item`, `purchase_request` |
| SCR-03 กล่องอนุมัติ | `listMyApprovals`, `decideApproval` | `app_user`, `approval`, `award`, `department` |
| SCR-04 สร้าง RFQ และเชิญผู้ขาย | `getPurchaseRequest`, `listVendors`, `createRfq` | `rfq`, `rfq_vendor` |
| SCR-05 บันทึกและเปรียบเทียบใบเสนอราคา | `getRfq`, `recordQuotation`, `getQuotationComparison`, `awardRfq` | `approval`, `award`, `quotation`, `quotation_item` |
| SCR-06 ใบสั่งซื้อ | `getPurchaseRequest`, `getQuotationComparison`, `listVendors`, `createPurchaseOrder`, `getPurchaseOrder`, `issuePurchaseOrder` | `po_item`, `purchase_order` |
| SCR-07 บันทึกการรับของ | `getPurchaseOrder`, `recordGoodsReceipt` | `goods_receipt`, `gr_item` |
| SCR-08 ทะเบียนผู้ขาย | `listVendors`, `createVendor`, `setVendorStatus` | `vendor` |
| SCR-09 รายงานสรุปการจัดซื้อ | `getSpendSummary` | – |
| SCR-10 Audit trail | `listAuditLogs` | `audit_log` |
