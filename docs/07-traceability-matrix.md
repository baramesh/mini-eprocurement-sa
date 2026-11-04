# เมทริกซ์การสืบกลับ (Traceability Matrix)

> สร้างอัตโนมัติจากเอกสาร 01, 02, 04 (OpenAPI), 05 และ 06 ด้วยสคริปต์ภายใน (ไม่เผยแพร่) ห้ามแก้ไฟล์นี้ด้วยมือ ถ้าเมทริกซ์ผิด ให้แก้ที่เอกสารต้นทางแล้วสร้างใหม่

## 1. สรุปความครอบคลุม

| รายการ | จำนวน |
|---|---|
| ข้อกำหนดเชิงหน้าที่ (FR) | 14 |
| Use Case | 10 |
| หน้าจอ | 10 |
| API operation | 19 |
| กรณีทดสอบ | 51 |
| FR ที่มี UC และ API และ TC ครบ | 14 จาก 14 |
| API operation ที่มี TC | 19 จาก 19 |

## 2. FR ไป UC, หน้าจอ, API และกรณีทดสอบ

| FR | ข้อกำหนด | UC | หน้าจอ | API operation | กรณีทดสอบ |
|---|---|---|---|---|---|
| FR-01 | ผู้ขอซื้อสร้างและแก้ไข PR สถานะ draft ได้ โดยระบุหัวข้อ ... | UC-01 | SCR-02 | `createPurchaseRequest`, `updatePurchaseRequest` | TC-01, TC-02, TC-03, TC-04 |
| FR-02 | ค้นหาและดูรายการ PR ตามสถานะ ช่วงวันที่ และผู้ขอซื้อ ... | UC-01 | SCR-01 | `getPurchaseRequest`, `listPurchaseRequests` | TC-05, TC-49, TC-50, TC-51 |
| FR-03 | ผู้ขอซื้อส่ง PR เพื่ออนุมัติ ... | UC-02 | SCR-02 | `submitPurchaseRequest` | TC-06, TC-07, TC-08, TC-09, TC-10, TC-11 |
| FR-04 | ผู้อนุมัติอนุมัติหรือปฏิเสธ PR ... | UC-03 | SCR-03 | `decideApproval`, `listMyApprovals` | TC-06, TC-07, TC-08, TC-09, TC-12, TC-13, TC-14, TC-15, TC-16 |
| FR-05 | เจ้าหน้าที่จัดซื้อสร้าง RFQ จาก PR ... | UC-04 | SCR-04 | `createRfq` | TC-17, TC-18, TC-19, TC-20, TC-21 |
| FR-06 | เจ้าหน้าที่จัดซื้อบันทึกใบเสนอราคาของผู้ขายที่ได้รับเชิญ ... | UC-04 | SCR-05 | `recordQuotation` | TC-22, TC-23, TC-24 |
| FR-07 | ดูตารางเปรียบเทียบราคาของทุกรายต่อรายการ พร้อมราคารวม ... | UC-05 | SCR-05 | `getQuotationComparison` | TC-25 |
| FR-08 | เลือกผู้ชนะพร้อมเหตุผล ... | UC-05 | SCR-03, SCR-05 | `awardRfq`, `decideApproval` | TC-26, TC-27, TC-28, TC-29, TC-30 |
| FR-09 | ออก PO จากผลที่อนุมัติ หรือออก PO ซื้อตรงเมื่อวงเงิน PR ... | UC-06 | SCR-06 | `createPurchaseOrder`, `issuePurchaseOrder` | TC-31, TC-32, TC-33, TC-34, TC-35 |
| FR-10 | บันทึกการรับของตาม PO ทั้งครบและบางส่วน ... | UC-07 | SCR-07 | `recordGoodsReceipt` | TC-36, TC-37, TC-38, TC-39 |
| FR-11 | จัดการทะเบียนผู้ขาย: เพิ่ม แก้ ระงับ ตรวจเลขผู้เสียภาษี 13 ... | UC-08 | SCR-08 | `createVendor`, `listVendors`, `setVendorStatus` | TC-20, TC-33, TC-40, TC-41, TC-42, TC-43 |
| FR-12 | รายงานสรุปการจัดซื้อตามช่วงเวลา หน่วยงาน ผู้ขาย: ... | UC-09 | SCR-09 | `getSpendSummary` | TC-44, TC-45 |
| FR-13 | บันทึก audit trail ทุกการเปลี่ยนสถานะและการตัดสินใจ ... | UC-03, UC-05, UC-10 | SCR-10 | `awardRfq`, `decideApproval`, `issuePurchaseOrder`, `listAuditLogs`, `setVendorStatus`, `submitPurchaseRequest` | TC-10, TC-14, TC-30, TC-34, TC-42, TC-46, TC-47 |
| FR-14 | ออกเลขเอกสาร PR/RFQ/PO/GR อัตโนมัติรูปแบบ `<ชนิด>-<ปี ... | UC-01, UC-04, UC-06, UC-07 | – | `createPurchaseOrder`, `createPurchaseRequest`, `createRfq`, `recordGoodsReceipt` | TC-01, TC-17, TC-31, TC-36, TC-48 |

## 3. API operation ไปกรณีทดสอบ

| operationId | Method Path | กรณีทดสอบ |
|---|---|---|
| `listPurchaseRequests` | GET `/purchase-requests` | TC-05, TC-49 |
| `createPurchaseRequest` | POST `/purchase-requests` | TC-01, TC-02, TC-03, TC-48 |
| `getPurchaseRequest` | GET `/purchase-requests/{prId}` | TC-50, TC-51 |
| `updatePurchaseRequest` | PUT `/purchase-requests/{prId}` | TC-04 |
| `submitPurchaseRequest` | POST `/purchase-requests/{prId}/submit` | TC-06, TC-07, TC-08, TC-09, TC-10, TC-11 |
| `listMyApprovals` | GET `/approvals` | TC-16 |
| `decideApproval` | POST `/approvals/{approvalId}/decision` | TC-12, TC-13, TC-14, TC-15, TC-30 |
| `createRfq` | POST `/rfqs` | TC-17, TC-18, TC-19, TC-20, TC-21 |
| `recordQuotation` | POST `/rfqs/{rfqId}/quotations` | TC-22, TC-23, TC-24 |
| `getQuotationComparison` | GET `/rfqs/{rfqId}/comparison` | TC-25 |
| `awardRfq` | POST `/rfqs/{rfqId}/award` | TC-26, TC-27, TC-28, TC-29 |
| `createPurchaseOrder` | POST `/purchase-orders` | TC-31, TC-32, TC-33 |
| `issuePurchaseOrder` | POST `/purchase-orders/{poId}/issue` | TC-34, TC-35 |
| `recordGoodsReceipt` | POST `/purchase-orders/{poId}/receipts` | TC-36, TC-37, TC-38, TC-39 |
| `listVendors` | GET `/vendors` | TC-43 |
| `createVendor` | POST `/vendors` | TC-40, TC-41 |
| `setVendorStatus` | PUT `/vendors/{vendorId}/status` | TC-42 |
| `getSpendSummary` | GET `/reports/spend-summary` | TC-44, TC-45 |
| `listAuditLogs` | GET `/audit-logs` | TC-46, TC-47 |
