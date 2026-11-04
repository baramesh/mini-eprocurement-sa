<!-- table: API operation ไปยังเกณฑ์ตรวจรับ -->
| operationId | Method Path | เกณฑ์ตรวจรับ |
|-----|-----|----------|
| `listPurchaseRequests` | GET `/purchase-requests` | AC-02-01, AC-02-02 |
| `createPurchaseRequest` | POST `/purchase-requests` | AC-01-01, AC-01-02, AC-01-03, AC-14-01 |
| `getPurchaseRequest` | GET `/purchase-requests/{prId}` | AC-02-03, AC-02-04 |
| `updatePurchaseRequest` | PUT `/purchase-requests/{prId}` | AC-01-04 |
| `submitPurchaseRequest` | POST `/purchase-requests/{prId}/submit` | AC-03-01, AC-03-02, AC-03-03, AC-03-04, AC-03-05, AC-03-06, AC-03-07 |
| `listMyApprovals` | GET `/approvals` | AC-04-05 |
| `decideApproval` | POST `/approvals/{approvalId}/decision` | AC-04-01, AC-04-02, AC-04-03, AC-04-04, AC-08-05 |
| `createRfq` | POST `/rfqs` | AC-05-01, AC-05-02, AC-05-03, AC-05-04, AC-05-05 |
| `recordQuotation` | POST `/rfqs/{rfqId}/quotations` | AC-06-01, AC-06-02, AC-06-03 |
| `getQuotationComparison` | GET `/rfqs/{rfqId}/comparison` | AC-07-01 |
| `awardRfq` | POST `/rfqs/{rfqId}/award` | AC-08-01, AC-08-02, AC-08-03, AC-08-04 |
| `createPurchaseOrder` | POST `/purchase-orders` | AC-09-01, AC-09-02, AC-09-03 |
| `issuePurchaseOrder` | POST `/purchase-orders/{poId}/issue` | AC-09-04, AC-09-05 |
| `recordGoodsReceipt` | POST `/purchase-orders/{poId}/receipts` | AC-10-01, AC-10-02, AC-10-03, AC-10-04 |
| `listVendors` | GET `/vendors` | AC-11-04 |
| `createVendor` | POST `/vendors` | AC-11-01, AC-11-02 |
| `setVendorStatus` | PUT `/vendors/{vendorId}/status` | AC-11-03 |
| `getSpendSummary` | GET `/reports/spend-summary` | AC-12-01, AC-12-02 |
| `listAuditLogs` | GET `/audit-logs` | AC-13-01, AC-13-02 |
