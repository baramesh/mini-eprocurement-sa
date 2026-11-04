<!-- table: สิทธิ์เรียก API operation ของแต่ละบทบาท -->
| operationId | REQUESTER | DEPT_APPROVER | PROCUREMENT | PROCUREMENT_HEAD | COMMITTEE | RECEIVER | ADMIN |
|----------------|----|----|----|----|----|----|----|
| `listPurchaseRequests` | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| `createPurchaseRequest` | ✓ |  |  |  |  |  |  |
| `getPurchaseRequest` | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| `updatePurchaseRequest` | ✓ |  |  |  |  |  |  |
| `submitPurchaseRequest` | ✓ |  |  |  |  |  |  |
| `listMyApprovals` |  | ✓ |  | ✓ | ✓ |  |  |
| `decideApproval` |  | ✓ |  | ✓ | ✓ |  |  |
| `createRfq` |  |  | ✓ |  |  |  |  |
| `recordQuotation` |  |  | ✓ |  |  |  |  |
| `getQuotationComparison` |  |  | ✓ | ✓ | ✓ |  |  |
| `awardRfq` |  |  | ✓ |  |  |  |  |
| `createPurchaseOrder` |  |  | ✓ |  |  |  |  |
| `issuePurchaseOrder` |  |  | ✓ |  |  |  |  |
| `recordGoodsReceipt` |  |  |  |  |  | ✓ |  |
| `listVendors` |  |  | ✓ | ✓ |  |  | ✓ |
| `createVendor` |  |  | ✓ |  |  |  |  |
| `setVendorStatus` |  |  |  | ✓ |  |  |  |
| `getSpendSummary` |  |  |  | ✓ |  |  | ✓ |
| `listAuditLogs` |  |  |  |  |  |  | ✓ |
