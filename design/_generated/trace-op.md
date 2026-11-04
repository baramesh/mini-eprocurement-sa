<!-- table: API operation ไปยังกรณีทดสอบ -->
| operationId | Method Path | กรณีทดสอบ |
|-----|-----|----------|
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
