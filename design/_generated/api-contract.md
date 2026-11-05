## ค้นหารายการใบขอซื้อ (listPurchaseRequests)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ listPurchaseRequests -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /purchase-requests` |
| สรุป | ค้นหารายการใบขอซื้อ |
| บทบาทที่เรียกได้ | `REQUESTER`, `DEPT_APPROVER`, `PROCUREMENT`, `PROCUREMENT_HEAD`, `COMMITTEE`, `ADMIN`, `RECEIVER` |
| FR | FR-02 |
| หน้าจอที่เรียก | SCR-01 |
| Runtime view | V-07 |
| การ์ดเจ้าของ | PRC-01 |
| ตัวอย่างการเรียก | `GET /purchase-requests?status=SUBMITTED` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-07 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ listPurchaseRequests -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `status` | query | string | ไม่ | ค่า: `DRAFT`, `SUBMITTED`, `APPROVED`, `IN_SOURCING`, `ORDERED`, `CLOSED`, `CANCELLED` |
| `createdFrom` | query | string | ไม่ | format `date` |
| `createdTo` | query | string | ไม่ | format `date` |
| `requesterId` | query | integer | ไม่ | กรองตามผู้ขอซื้อ (ผู้ขอซื้อธรรมดาเห็นเฉพาะของตนอยู่แล้ว ค่านี้ใช้กับบทบาทอื่น) |
| `cursor` | query | string | ไม่ | ตัวชี้หน้าถัดไปแบบ keyset |
| `limit` | query | integer | ไม่ | ค่าต่ำสุด 1; ค่าสูงสุด 100; ค่าเริ่มต้น `50` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ listPurchaseRequests -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | รายการ PR ตามสิทธิ์ของผู้เรียก | PrPage | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ listPurchaseRequests -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `items` | array[object] |  | `purchase_request` |
| `items[].prId` | integer | format `int64` | `purchase_request.pr_id` |
| `items[].prNo` | string |  | `purchase_request.pr_no` |
| `items[].status` | string | ค่า: `DRAFT`, `SUBMITTED`, `APPROVED`, `IN_SOURCING`, `ORDERED`, `CLOSED`, `CANCELLED` | `purchase_request.status` |
| `items[].title` | string |  | `purchase_request.title` |
| `items[].neededByDate` | string | format `date` | `purchase_request.needed_by_date` |
| `items[].totalEstimated` | number |  | `purchase_request.total_estimated` |
| `items[].requesterName` | string |  | `app_user[user_id=requester_id].full_name` |
| `items[].departmentName` | string |  | `department[department_id=department_id].name_th` |
| `items[].submittedAt` | string (null ได้) | format `date-time` | `purchase_request.submitted_at` |
| `items[].rfqId` | integer (null ได้) | format `int64`; RFQ ล่าสุดของ PR นี้ ใช้นำทางไปหน้าเปรียบเทียบ | `rfq[pr_id=pr_id].rfq_id` |
| `items[].poId` | integer (null ได้) | format `int64`; PO ของ PR นี้ ใช้นำทางไปหน้ารับของ | `purchase_order[pr_id=pr_id].po_id` |
| `nextCursor` | string (null ได้) |  | keyset: ค่า (created_at, pr_id) ของแถวสุดท้ายของหน้า เข้ารหัส base64; null เมื่อไม่มีหน้าถัดไป |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/listPurchaseRequests.response.200.json`):

```json
{
  "items": [
    {
      "prId": 4,
      "prNo": "PR-2026-00004",
      "status": "SUBMITTED",
      "title": "ระบบสำรองข้อมูล",
      "neededByDate": "2026-06-30",
      "totalEstimated": 250000,
      "requesterName": "สมชาย ผู้ขอซื้อ",
      "departmentName": "ไอที",
      "submittedAt": "2026-03-05T13:00:00Z",
      "rfqId": null,
      "poId": null
    }
  ],
  "nextCursor": null
}
```

## สร้างใบขอซื้อ (draft) (createPurchaseRequest)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ createPurchaseRequest -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /purchase-requests` |
| สรุป | สร้างใบขอซื้อ (draft) |
| บทบาทที่เรียกได้ | `REQUESTER` |
| FR | FR-01, FR-14 |
| หน้าจอที่เรียก | SCR-02 |
| Runtime view | V-08 |
| การ์ดเจ้าของ | PRC-02 |
| ตัวอย่างการเรียก | `POST /purchase-requests` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-08 (เล่มสถาปัตยกรรมของระบบ)

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ createPurchaseRequest -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `title` | string | ใช่ | ยาวไม่เกิน 200 | `purchase_request.title` |
| `justification` | string | ใช่ | ยาวไม่เกิน 1000 | `purchase_request.justification` |
| `neededByDate` | string | ใช่ | format `date` | `purchase_request.needed_by_date` |
| `items` | array[object] | ใช่ | อย่างน้อย 1 รายการ; ไม่เกิน 100 รายการ | `pr_item[pr_id=pr_id]` |
| `items[].description` | string | ใช่ | ยาวไม่เกิน 300 | `pr_item.description` |
| `items[].quantity` | number | ใช่ | มากกว่า 0 | `pr_item.quantity` |
| `items[].unit` | string | ใช่ | ยาวไม่เกิน 30 | `pr_item.unit` |
| `items[].estUnitPrice` | number | ใช่ | ค่าต่ำสุด 0 | `pr_item.est_unit_price` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ createPurchaseRequest -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `purchase_request` | INSERT | - | `pr_no` | เลขที่เอกสารถัดไปของชนิด PR (ออกก่อนเริ่มธุรกรรม) |
| `purchase_request` | INSERT | - | `requester_id` | ผู้เรียก `app_user.user_id` |
| `purchase_request` | INSERT | - | `department_id` | ผู้เรียก `app_user.department_id` |
| `purchase_request` | INSERT | - | `title` | `request.title` |
| `purchase_request` | INSERT | - | `justification` | `request.justification` |
| `purchase_request` | INSERT | - | `needed_by_date` | `request.neededByDate` |
| `purchase_request` | INSERT | - | `total_estimated` | ผลรวมของ ปัดเศษ 2 ตำแหน่ง (quantity x est_unit_price) ต่อบรรทัด |
| `purchase_request` | INSERT | - | `status` | ค่าคงที่ `DRAFT` |
| `purchase_request` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |
| `pr_item` | INSERT | ต่อ items[] | `pr_id` | `purchase_request.pr_id` ของแถวที่เพิ่งเขียน |
| `pr_item` | INSERT | ต่อ items[] | `line_no` | ลำดับในอาร์เรย์ เริ่มที่ 1 |
| `pr_item` | INSERT | ต่อ items[] | `description` | `request.items[].description` |
| `pr_item` | INSERT | ต่อ items[] | `quantity` | `request.items[].quantity` |
| `pr_item` | INSERT | ต่อ items[] | `unit` | `request.items[].unit` |
| `pr_item` | INSERT | ต่อ items[] | `est_unit_price` | `request.items[].estUnitPrice` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `PR` |
| `audit_log` | INSERT | - | `entity_id` | `purchase_request.pr_id` ของแถวที่เพิ่งเขียน |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `CREATE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ createPurchaseRequest -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `201` | สร้างแล้ว ได้เลขที่ PR | PurchaseRequest | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-VAL-001` |

<!-- table: ฟิลด์ใน response 201 ของ createPurchaseRequest -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `prId` | integer | format `int64` | `purchase_request.pr_id` |
| `prNo` | string |  | `purchase_request.pr_no` |
| `status` | string | ค่า: `DRAFT`, `SUBMITTED`, `APPROVED`, `IN_SOURCING`, `ORDERED`, `CLOSED`, `CANCELLED` | `purchase_request.status` |
| `title` | string |  | `purchase_request.title` |
| `neededByDate` | string | format `date` | `purchase_request.needed_by_date` |
| `totalEstimated` | number |  | `purchase_request.total_estimated` |
| `requesterName` | string |  | `app_user[user_id=requester_id].full_name` |
| `departmentName` | string |  | `department[department_id=department_id].name_th` |
| `submittedAt` | string (null ได้) | format `date-time` | `purchase_request.submitted_at` |
| `rfqId` | integer (null ได้) | format `int64`; RFQ ล่าสุดของ PR นี้ ใช้นำทางไปหน้าเปรียบเทียบ | `rfq[pr_id=pr_id].rfq_id` |
| `poId` | integer (null ได้) | format `int64`; PO ของ PR นี้ ใช้นำทางไปหน้ารับของ | `purchase_order[pr_id=pr_id].po_id` |
| `justification` | string |  | `purchase_request.justification` |
| `rowVersion` | string | ใช้เป็นค่า If-Match ตอนแก้ | `purchase_request.row_version` |
| `items` | array[object] |  | `pr_item[pr_id=pr_id]` |
| `items[].description` | string | ยาวไม่เกิน 300 | `pr_item.description` |
| `items[].quantity` | number | มากกว่า 0 | `pr_item.quantity` |
| `items[].unit` | string | ยาวไม่เกิน 30 | `pr_item.unit` |
| `items[].estUnitPrice` | number | ค่าต่ำสุด 0 | `pr_item.est_unit_price` |
| `items[].prItemId` | integer | format `int64` | `pr_item.pr_item_id` |
| `items[].lineNo` | integer |  | `pr_item.line_no` |
| `approvals` | array[object] |  | `approval[doc_id=pr_id,doc_type==PR]` |
| `approvals[].approvalId` | integer | format `int64` | `approval.approval_id` |
| `approvals[].docType` | string | ค่า: `PR`, `AWARD` | `approval.doc_type` |
| `approvals[].docId` | integer | format `int64` | `approval.doc_id` |
| `approvals[].stepNo` | integer |  | `approval.step_no` |
| `approvals[].requiredRole` | string |  | `approval.required_role` |
| `approvals[].decision` | string | ค่า: `PENDING`, `APPROVED`, `REJECTED` | `approval.decision` |
| `approvals[].comment` | string (null ได้) |  | `approval.comment` |
| `approvals[].decidedAt` | string (null ได้) | format `date-time` | `approval.decided_at` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/createPurchaseRequest.request.json`):

```json
{
  "title": "ปากกาและอุปกรณ์เครื่องเขียน",
  "justification": "ใช้งานประจำ",
  "neededByDate": "2026-03-31",
  "items": [
    {
      "description": "ปากกาและเครื่องเขียน",
      "quantity": 100,
      "unit": "ชุด",
      "estUnitPrice": 30
    }
  ]
}
```

ตัวอย่าง Response 201 (`api/examples/createPurchaseRequest.response.201.json`):

```json
{
  "prId": 5,
  "prNo": "PR-2026-00005",
  "status": "DRAFT",
  "title": "ปากกาและอุปกรณ์เครื่องเขียน",
  "neededByDate": "2026-03-31",
  "totalEstimated": 3000,
  "requesterName": "ธนา ผู้ขอซื้อฝ่ายปฏิบัติการ",
  "departmentName": "ปฏิบัติการ",
  "submittedAt": null,
  "rfqId": null,
  "poId": null,
  "justification": "ใช้งานประจำ",
  "items": [
    {
      "description": "ปากกาและเครื่องเขียน",
      "quantity": 100,
      "unit": "ชุด",
      "estUnitPrice": 30,
      "prItemId": 6,
      "lineNo": 1
    }
  ],
  "approvals": []
}
```

## ดูรายละเอียดใบขอซื้อ (getPurchaseRequest)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ getPurchaseRequest -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /purchase-requests/{prId}` |
| สรุป | ดูรายละเอียดใบขอซื้อ |
| บทบาทที่เรียกได้ | `REQUESTER`, `DEPT_APPROVER`, `PROCUREMENT`, `PROCUREMENT_HEAD`, `COMMITTEE`, `ADMIN` |
| FR | FR-02 |
| หน้าจอที่เรียก | SCR-02, SCR-04, SCR-06 |
| Runtime view | V-07 |
| การ์ดเจ้าของ | PRC-02 |
| ตัวอย่างการเรียก | `GET /purchase-requests/4` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-07 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ getPurchaseRequest -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `prId` | path | integer | ใช่ | format `int64` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ getPurchaseRequest -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | รายละเอียด PR | PurchaseRequest | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |

<!-- table: ฟิลด์ใน response 200 ของ getPurchaseRequest -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `prId` | integer | format `int64` | `purchase_request.pr_id` |
| `prNo` | string |  | `purchase_request.pr_no` |
| `status` | string | ค่า: `DRAFT`, `SUBMITTED`, `APPROVED`, `IN_SOURCING`, `ORDERED`, `CLOSED`, `CANCELLED` | `purchase_request.status` |
| `title` | string |  | `purchase_request.title` |
| `neededByDate` | string | format `date` | `purchase_request.needed_by_date` |
| `totalEstimated` | number |  | `purchase_request.total_estimated` |
| `requesterName` | string |  | `app_user[user_id=requester_id].full_name` |
| `departmentName` | string |  | `department[department_id=department_id].name_th` |
| `submittedAt` | string (null ได้) | format `date-time` | `purchase_request.submitted_at` |
| `rfqId` | integer (null ได้) | format `int64`; RFQ ล่าสุดของ PR นี้ ใช้นำทางไปหน้าเปรียบเทียบ | `rfq[pr_id=pr_id].rfq_id` |
| `poId` | integer (null ได้) | format `int64`; PO ของ PR นี้ ใช้นำทางไปหน้ารับของ | `purchase_order[pr_id=pr_id].po_id` |
| `justification` | string |  | `purchase_request.justification` |
| `rowVersion` | string | ใช้เป็นค่า If-Match ตอนแก้ | `purchase_request.row_version` |
| `items` | array[object] |  | `pr_item[pr_id=pr_id]` |
| `items[].description` | string | ยาวไม่เกิน 300 | `pr_item.description` |
| `items[].quantity` | number | มากกว่า 0 | `pr_item.quantity` |
| `items[].unit` | string | ยาวไม่เกิน 30 | `pr_item.unit` |
| `items[].estUnitPrice` | number | ค่าต่ำสุด 0 | `pr_item.est_unit_price` |
| `items[].prItemId` | integer | format `int64` | `pr_item.pr_item_id` |
| `items[].lineNo` | integer |  | `pr_item.line_no` |
| `approvals` | array[object] |  | `approval[doc_id=pr_id,doc_type==PR]` |
| `approvals[].approvalId` | integer | format `int64` | `approval.approval_id` |
| `approvals[].docType` | string | ค่า: `PR`, `AWARD` | `approval.doc_type` |
| `approvals[].docId` | integer | format `int64` | `approval.doc_id` |
| `approvals[].stepNo` | integer |  | `approval.step_no` |
| `approvals[].requiredRole` | string |  | `approval.required_role` |
| `approvals[].decision` | string | ค่า: `PENDING`, `APPROVED`, `REJECTED` | `approval.decision` |
| `approvals[].comment` | string (null ได้) |  | `approval.comment` |
| `approvals[].decidedAt` | string (null ได้) | format `date-time` | `approval.decided_at` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/getPurchaseRequest.response.200.json`):

```json
{
  "prId": 4,
  "prNo": "PR-2026-00004",
  "status": "SUBMITTED",
  "title": "ระบบสำรองข้อมูล",
  "neededByDate": "2026-06-30",
  "totalEstimated": 250000,
  "requesterName": "สมชาย ผู้ขอซื้อ",
  "departmentName": "ไอที",
  "submittedAt": "2026-03-05T13:00:00Z",
  "rfqId": null,
  "poId": null,
  "justification": "ลดความเสี่ยงข้อมูลสูญหาย",
  "items": [
    {
      "description": "ระบบสำรองข้อมูลพร้อมติดตั้ง",
      "quantity": 1,
      "unit": "ชุด",
      "estUnitPrice": 250000,
      "prItemId": 5,
      "lineNo": 1
    }
  ],
  "approvals": [
    {
      "approvalId": 5,
      "docType": "PR",
      "docId": 4,
      "stepNo": 1,
      "requiredRole": "DEPT_APPROVER",
      "decision": "APPROVED",
      "comment": null,
      "decidedAt": "2026-03-05T14:00:00Z"
    },
    {
      "approvalId": 6,
      "docType": "PR",
      "docId": 4,
      "stepNo": 2,
      "requiredRole": "PROCUREMENT_HEAD",
      "decision": "PENDING",
      "comment": null,
      "decidedAt": null
    },
    {
      "approvalId": 7,
      "docType": "PR",
      "docId": 4,
      "stepNo": 3,
      "requiredRole": "COMMITTEE",
      "decision": "PENDING",
      "comment": null,
      "decidedAt": null
    }
  ]
}
```

## แก้ไขใบขอซื้อที่เป็น draft (updatePurchaseRequest)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ updatePurchaseRequest -->
| รายการ | ค่า |
|---|---|
| Endpoint | `PUT /purchase-requests/{prId}` |
| สรุป | แก้ไขใบขอซื้อที่เป็น draft |
| บทบาทที่เรียกได้ | `REQUESTER` |
| FR | FR-01 |
| หน้าจอที่เรียก | SCR-02 |
| Runtime view | V-08 |
| การ์ดเจ้าของ | PRC-02 |
| ตัวอย่างการเรียก | `PUT /purchase-requests/5` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-08 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ updatePurchaseRequest -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `prId` | path | integer | ใช่ | format `int64` |
| `If-Match` | header | string | ใช่ | ค่า rowVersion ล่าสุดที่ผู้ใช้เห็น |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ updatePurchaseRequest -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `title` | string | ใช่ | ยาวไม่เกิน 200 | `purchase_request.title` |
| `justification` | string | ใช่ | ยาวไม่เกิน 1000 | `purchase_request.justification` |
| `neededByDate` | string | ใช่ | format `date` | `purchase_request.needed_by_date` |
| `items` | array[object] | ใช่ | อย่างน้อย 1 รายการ; ไม่เกิน 100 รายการ | `pr_item[pr_id=pr_id]` |
| `items[].description` | string | ใช่ | ยาวไม่เกิน 300 | `pr_item.description` |
| `items[].quantity` | number | ใช่ | มากกว่า 0 | `pr_item.quantity` |
| `items[].unit` | string | ใช่ | ยาวไม่เกิน 30 | `pr_item.unit` |
| `items[].estUnitPrice` | number | ใช่ | ค่าต่ำสุด 0 | `pr_item.est_unit_price` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ updatePurchaseRequest -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `purchase_request` | UPDATE | เงื่อนไข pr_id = path.prId, row_version = header.If-Match, status = DRAFT | `title` | `request.title` |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = path.prId, row_version = header.If-Match, status = DRAFT | `justification` | `request.justification` |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = path.prId, row_version = header.If-Match, status = DRAFT | `needed_by_date` | `request.neededByDate` |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = path.prId, row_version = header.If-Match, status = DRAFT | `total_estimated` | ผลรวมของ ปัดเศษ 2 ตำแหน่ง (quantity x est_unit_price) ต่อบรรทัด |
| `pr_item` | DELETE | เงื่อนไข pr_id = path.prId | - | - |
| `pr_item` | INSERT | ต่อ items[] | `pr_id` | `path.prId` |
| `pr_item` | INSERT | ต่อ items[] | `line_no` | ลำดับในอาร์เรย์ เริ่มที่ 1 |
| `pr_item` | INSERT | ต่อ items[] | `description` | `request.items[].description` |
| `pr_item` | INSERT | ต่อ items[] | `quantity` | `request.items[].quantity` |
| `pr_item` | INSERT | ต่อ items[] | `unit` | `request.items[].unit` |
| `pr_item` | INSERT | ต่อ items[] | `est_unit_price` | `request.items[].estUnitPrice` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `PR` |
| `audit_log` | INSERT | - | `entity_id` | `path.prId` |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `UPDATE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ updatePurchaseRequest -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | แก้แล้ว | PurchaseRequest | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-CONC-001` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ updatePurchaseRequest -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `prId` | integer | format `int64` | `purchase_request.pr_id` |
| `prNo` | string |  | `purchase_request.pr_no` |
| `status` | string | ค่า: `DRAFT`, `SUBMITTED`, `APPROVED`, `IN_SOURCING`, `ORDERED`, `CLOSED`, `CANCELLED` | `purchase_request.status` |
| `title` | string |  | `purchase_request.title` |
| `neededByDate` | string | format `date` | `purchase_request.needed_by_date` |
| `totalEstimated` | number |  | `purchase_request.total_estimated` |
| `requesterName` | string |  | `app_user[user_id=requester_id].full_name` |
| `departmentName` | string |  | `department[department_id=department_id].name_th` |
| `submittedAt` | string (null ได้) | format `date-time` | `purchase_request.submitted_at` |
| `rfqId` | integer (null ได้) | format `int64`; RFQ ล่าสุดของ PR นี้ ใช้นำทางไปหน้าเปรียบเทียบ | `rfq[pr_id=pr_id].rfq_id` |
| `poId` | integer (null ได้) | format `int64`; PO ของ PR นี้ ใช้นำทางไปหน้ารับของ | `purchase_order[pr_id=pr_id].po_id` |
| `justification` | string |  | `purchase_request.justification` |
| `rowVersion` | string | ใช้เป็นค่า If-Match ตอนแก้ | `purchase_request.row_version` |
| `items` | array[object] |  | `pr_item[pr_id=pr_id]` |
| `items[].description` | string | ยาวไม่เกิน 300 | `pr_item.description` |
| `items[].quantity` | number | มากกว่า 0 | `pr_item.quantity` |
| `items[].unit` | string | ยาวไม่เกิน 30 | `pr_item.unit` |
| `items[].estUnitPrice` | number | ค่าต่ำสุด 0 | `pr_item.est_unit_price` |
| `items[].prItemId` | integer | format `int64` | `pr_item.pr_item_id` |
| `items[].lineNo` | integer |  | `pr_item.line_no` |
| `approvals` | array[object] |  | `approval[doc_id=pr_id,doc_type==PR]` |
| `approvals[].approvalId` | integer | format `int64` | `approval.approval_id` |
| `approvals[].docType` | string | ค่า: `PR`, `AWARD` | `approval.doc_type` |
| `approvals[].docId` | integer | format `int64` | `approval.doc_id` |
| `approvals[].stepNo` | integer |  | `approval.step_no` |
| `approvals[].requiredRole` | string |  | `approval.required_role` |
| `approvals[].decision` | string | ค่า: `PENDING`, `APPROVED`, `REJECTED` | `approval.decision` |
| `approvals[].comment` | string (null ได้) |  | `approval.comment` |
| `approvals[].decidedAt` | string (null ได้) | format `date-time` | `approval.decided_at` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/updatePurchaseRequest.request.json`):

```json
{
  "title": "ปากกาและอุปกรณ์เครื่องเขียน",
  "justification": "ใช้งานประจำ",
  "neededByDate": "2026-03-31",
  "items": [
    {
      "description": "ปากกาและเครื่องเขียน",
      "quantity": 100,
      "unit": "ชุด",
      "estUnitPrice": 30
    }
  ]
}
```

ตัวอย่าง Response 200 (`api/examples/updatePurchaseRequest.response.200.json`):

```json
{
  "prId": 5,
  "prNo": "PR-2026-00005",
  "status": "DRAFT",
  "title": "ปากกาและอุปกรณ์เครื่องเขียน",
  "neededByDate": "2026-03-31",
  "totalEstimated": 3000,
  "requesterName": "ธนา ผู้ขอซื้อฝ่ายปฏิบัติการ",
  "departmentName": "ปฏิบัติการ",
  "submittedAt": null,
  "rfqId": null,
  "poId": null,
  "justification": "ใช้งานประจำ",
  "items": [
    {
      "description": "ปากกาและเครื่องเขียน",
      "quantity": 100,
      "unit": "ชุด",
      "estUnitPrice": 30,
      "prItemId": 6,
      "lineNo": 1
    }
  ],
  "approvals": []
}
```

## ส่งใบขอซื้อเพื่ออนุมัติ (submitPurchaseRequest)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ submitPurchaseRequest -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /purchase-requests/{prId}/submit` |
| สรุป | ส่งใบขอซื้อเพื่ออนุมัติ |
| บทบาทที่เรียกได้ | `REQUESTER` |
| FR | FR-03, FR-13 |
| หน้าจอที่เรียก | SCR-02 |
| Runtime view | V-03 |
| การ์ดเจ้าของ | PRC-02 |
| ตัวอย่างการเรียก | `POST /purchase-requests/4/submit` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-03 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ submitPurchaseRequest -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `prId` | path | integer | ใช่ | format `int64` |
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ submitPurchaseRequest -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `approval` | INSERT | ต่อ ขั้นอนุมัติแต่ละขั้นของสายตามวงเงิน (BR-03) | `doc_type` | ค่าคงที่ `PR` |
| `approval` | INSERT | ต่อ ขั้นอนุมัติแต่ละขั้นของสายตามวงเงิน (BR-03) | `doc_id` | `path.prId` |
| `approval` | INSERT | ต่อ ขั้นอนุมัติแต่ละขั้นของสายตามวงเงิน (BR-03) | `step_no` | ลำดับขั้น เริ่มที่ 1 |
| `approval` | INSERT | ต่อ ขั้นอนุมัติแต่ละขั้นของสายตามวงเงิน (BR-03) | `required_role` | บทบาทของขั้นตามวงเงินรวมของ PR |
| `approval` | INSERT | ต่อ ขั้นอนุมัติแต่ละขั้นของสายตามวงเงิน (BR-03) | `decision` | ค่าคงที่ `PENDING` |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = path.prId, status = DRAFT | `status` | ค่าคงที่ `SUBMITTED` |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = path.prId, status = DRAFT | `submitted_at` | เวลาของคำขอ (UTC) |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `PR` |
| `audit_log` | INSERT | - | `entity_id` | `path.prId` |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `SUBMIT` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `detail` | ค่าคงที่ `ส่งอนุมัติ` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ submitPurchaseRequest -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | ส่งแล้ว สถานะ SUBMITTED พร้อมสายอนุมัติ | PurchaseRequest | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-STATE-001` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ submitPurchaseRequest -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `prId` | integer | format `int64` | `purchase_request.pr_id` |
| `prNo` | string |  | `purchase_request.pr_no` |
| `status` | string | ค่า: `DRAFT`, `SUBMITTED`, `APPROVED`, `IN_SOURCING`, `ORDERED`, `CLOSED`, `CANCELLED` | `purchase_request.status` |
| `title` | string |  | `purchase_request.title` |
| `neededByDate` | string | format `date` | `purchase_request.needed_by_date` |
| `totalEstimated` | number |  | `purchase_request.total_estimated` |
| `requesterName` | string |  | `app_user[user_id=requester_id].full_name` |
| `departmentName` | string |  | `department[department_id=department_id].name_th` |
| `submittedAt` | string (null ได้) | format `date-time` | `purchase_request.submitted_at` |
| `rfqId` | integer (null ได้) | format `int64`; RFQ ล่าสุดของ PR นี้ ใช้นำทางไปหน้าเปรียบเทียบ | `rfq[pr_id=pr_id].rfq_id` |
| `poId` | integer (null ได้) | format `int64`; PO ของ PR นี้ ใช้นำทางไปหน้ารับของ | `purchase_order[pr_id=pr_id].po_id` |
| `justification` | string |  | `purchase_request.justification` |
| `rowVersion` | string | ใช้เป็นค่า If-Match ตอนแก้ | `purchase_request.row_version` |
| `items` | array[object] |  | `pr_item[pr_id=pr_id]` |
| `items[].description` | string | ยาวไม่เกิน 300 | `pr_item.description` |
| `items[].quantity` | number | มากกว่า 0 | `pr_item.quantity` |
| `items[].unit` | string | ยาวไม่เกิน 30 | `pr_item.unit` |
| `items[].estUnitPrice` | number | ค่าต่ำสุด 0 | `pr_item.est_unit_price` |
| `items[].prItemId` | integer | format `int64` | `pr_item.pr_item_id` |
| `items[].lineNo` | integer |  | `pr_item.line_no` |
| `approvals` | array[object] |  | `approval[doc_id=pr_id,doc_type==PR]` |
| `approvals[].approvalId` | integer | format `int64` | `approval.approval_id` |
| `approvals[].docType` | string | ค่า: `PR`, `AWARD` | `approval.doc_type` |
| `approvals[].docId` | integer | format `int64` | `approval.doc_id` |
| `approvals[].stepNo` | integer |  | `approval.step_no` |
| `approvals[].requiredRole` | string |  | `approval.required_role` |
| `approvals[].decision` | string | ค่า: `PENDING`, `APPROVED`, `REJECTED` | `approval.decision` |
| `approvals[].comment` | string (null ได้) |  | `approval.comment` |
| `approvals[].decidedAt` | string (null ได้) | format `date-time` | `approval.decided_at` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/submitPurchaseRequest.response.200.json`):

```json
{
  "prId": 4,
  "prNo": "PR-2026-00004",
  "status": "SUBMITTED",
  "title": "ระบบสำรองข้อมูล",
  "neededByDate": "2026-06-30",
  "totalEstimated": 250000,
  "requesterName": "สมชาย ผู้ขอซื้อ",
  "departmentName": "ไอที",
  "submittedAt": "2026-03-05T13:00:00Z",
  "rfqId": null,
  "poId": null,
  "justification": "ลดความเสี่ยงข้อมูลสูญหาย",
  "items": [
    {
      "description": "ระบบสำรองข้อมูลพร้อมติดตั้ง",
      "quantity": 1,
      "unit": "ชุด",
      "estUnitPrice": 250000,
      "prItemId": 5,
      "lineNo": 1
    }
  ],
  "approvals": [
    {
      "approvalId": 5,
      "docType": "PR",
      "docId": 4,
      "stepNo": 1,
      "requiredRole": "DEPT_APPROVER",
      "decision": "APPROVED",
      "comment": null,
      "decidedAt": "2026-03-05T14:00:00Z"
    },
    {
      "approvalId": 6,
      "docType": "PR",
      "docId": 4,
      "stepNo": 2,
      "requiredRole": "PROCUREMENT_HEAD",
      "decision": "PENDING",
      "comment": null,
      "decidedAt": null
    },
    {
      "approvalId": 7,
      "docType": "PR",
      "docId": 4,
      "stepNo": 3,
      "requiredRole": "COMMITTEE",
      "decision": "PENDING",
      "comment": null,
      "decidedAt": null
    }
  ]
}
```

## กล่องอนุมัติของผู้เรียก (เฉพาะขั้นที่ถึงบทบาทตน) (listMyApprovals)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ listMyApprovals -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /approvals` |
| สรุป | กล่องอนุมัติของผู้เรียก (เฉพาะขั้นที่ถึงบทบาทตน) |
| บทบาทที่เรียกได้ | `DEPT_APPROVER`, `PROCUREMENT_HEAD`, `COMMITTEE` |
| FR | FR-04 |
| หน้าจอที่เรียก | SCR-03 |
| Runtime view | V-07 |
| การ์ดเจ้าของ | PRC-03 |
| ตัวอย่างการเรียก | `GET /approvals` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-07 (เล่มสถาปัตยกรรมของระบบ)

### ผลลัพธ์ (Response)

<!-- table: Response ของ listMyApprovals -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | งานรออนุมัติ | array[ApprovalItem] | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |

<!-- table: ฟิลด์ใน response 200 ของ listMyApprovals -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `approvalId` | integer | format `int64` | `approval.approval_id` |
| `docType` | string | ค่า: `PR`, `AWARD` | `approval.doc_type` |
| `docId` | integer | format `int64` | `approval.doc_id` |
| `stepNo` | integer |  | `approval.step_no` |
| `requiredRole` | string |  | `approval.required_role` |
| `decision` | string | ค่า: `PENDING`, `APPROVED`, `REJECTED` | `approval.decision` |
| `comment` | string (null ได้) |  | `approval.comment` |
| `decidedAt` | string (null ได้) | format `date-time` | `approval.decided_at` |
| `docNo` | string |  | ถ้า doc_type=PR: `purchase_request[pr_id=doc_id].pr_no`; ถ้า doc_type=AWARD: `rfq[rfq_id=doc_id].rfq_no` |
| `docTitle` | string |  | ถ้า doc_type=PR: `purchase_request[pr_id=doc_id].title`; ถ้า doc_type=AWARD: `rfq[rfq_id=doc_id]>purchase_request[pr_id=pr_id].title` |
| `requesterName` | string |  | ถ้า doc_type=PR: `purchase_request[pr_id=doc_id]>app_user[user_id=requester_id].full_name`; ถ้า doc_type=AWARD: `rfq[rfq_id=doc_id]>purchase_request[pr_id=pr_id]>app_user[user_id=requester_id].full_name` |
| `amount` | number | วงเงิน PR หรือมูลค่าใบเสนอราคาที่ชนะ | ถ้า doc_type=PR: `purchase_request[pr_id=doc_id].total_estimated`; ถ้า doc_type=AWARD: `award[rfq_id=doc_id]>quotation[quotation_id=quotation_id].total_amount` |
| `submittedAt` | string | format `date-time` | ถ้า doc_type=PR: `purchase_request[pr_id=doc_id].submitted_at`; ถ้า doc_type=AWARD: `award[rfq_id=doc_id].awarded_at` |
| `proposerId` | integer | ผู้ขอซื้อ (PR) หรือผู้เสนอผล (AWARD) ใช้ซ่อนปุ่มตัดสินตาม BR-04 | ถ้า doc_type=PR: `purchase_request[pr_id=doc_id].requester_id`; ถ้า doc_type=AWARD: `award[rfq_id=doc_id].awarded_by` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/listMyApprovals.response.200.json`):

```json
[
  {
    "approvalId": 6,
    "docType": "PR",
    "docId": 4,
    "stepNo": 2,
    "requiredRole": "PROCUREMENT_HEAD",
    "decision": "PENDING",
    "comment": null,
    "decidedAt": null,
    "docNo": "PR-2026-00004",
    "docTitle": "ระบบสำรองข้อมูล",
    "requesterName": "สมชาย ผู้ขอซื้อ",
    "amount": 250000,
    "submittedAt": "2026-03-05T13:00:00Z",
    "proposerId": 2
  },
  {
    "approvalId": 7,
    "docType": "PR",
    "docId": 4,
    "stepNo": 3,
    "requiredRole": "COMMITTEE",
    "decision": "PENDING",
    "comment": null,
    "decidedAt": null,
    "docNo": "PR-2026-00004",
    "docTitle": "ระบบสำรองข้อมูล",
    "requesterName": "สมชาย ผู้ขอซื้อ",
    "amount": 250000,
    "submittedAt": "2026-03-05T13:00:00Z",
    "proposerId": 2
  }
]
```

## อนุมัติหรือปฏิเสธ (decideApproval)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ decideApproval -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /approvals/{approvalId}/decision` |
| สรุป | อนุมัติหรือปฏิเสธ |
| บทบาทที่เรียกได้ | `DEPT_APPROVER`, `PROCUREMENT_HEAD`, `COMMITTEE` |
| FR | FR-04, FR-08, FR-13 |
| หน้าจอที่เรียก | SCR-03 |
| Runtime view | V-04 |
| การ์ดเจ้าของ | PRC-03 |
| ตัวอย่างการเรียก | `POST /approvals/8/decision` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-04 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ decideApproval -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `approvalId` | path | integer | ใช่ | format `int64` |
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ decideApproval -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `decision` | string | ใช่ | ค่า: `APPROVED`, `REJECTED` | `approval.decision` |
| `comment` | string | ไม่ | ยาวไม่เกิน 500; บังคับเมื่อ REJECTED | `approval.comment` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ decideApproval -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `approval` | UPDATE | เงื่อนไข approval_id = path.approvalId, decision = PENDING | `decision` | `request.decision` |
| `approval` | UPDATE | เงื่อนไข approval_id = path.approvalId, decision = PENDING | `comment` | `request.comment` |
| `approval` | UPDATE | เงื่อนไข approval_id = path.approvalId, decision = PENDING | `approver_id` | ผู้เรียก `app_user.user_id` |
| `approval` | UPDATE | เงื่อนไข approval_id = path.approvalId, decision = PENDING | `decided_at` | เวลาของคำขอ (UTC) |
| `purchase_request` | UPDATE | เมื่อ อนุมัติขั้นสุดท้ายของ PR | `status` | ค่าคงที่ `APPROVED` |
| `rfq` | UPDATE | เมื่อ อนุมัติขั้นสุดท้ายของผลเลือกผู้ชนะ | `status` | ค่าคงที่ `AWARDED` |
| `approval` | DELETE | เมื่อ ปฏิเสธ (ลบทั้งชุดของเอกสารนั้น ประวัติอยู่ที่ audit_log) | - | - |
| `purchase_request` | UPDATE | เมื่อ ปฏิเสธขั้นของ PR | `status` | ค่าคงที่ `DRAFT` |
| `award` | DELETE | เมื่อ ปฏิเสธผลเลือกผู้ชนะ | - | - |
| `rfq` | UPDATE | เมื่อ ปฏิเสธผลเลือกผู้ชนะ | `status` | ค่าคงที่ `OPEN` |
| `audit_log` | INSERT | - | `entity` | PR หรือ RFQ ตามชนิดงาน |
| `audit_log` | INSERT | - | `entity_id` | อ่านจาก `approval.doc_id` |
| `audit_log` | INSERT | - | `action` | APPROVE หรือ REJECT |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `detail` | request.comment หรือ "ขั้น N" เมื่อไม่มีความเห็น |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ decideApproval -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | บันทึกผลแล้ว | Approval | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002`, `ERR-SOD-001` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-STATE-001` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-VAL-001` |

<!-- table: ฟิลด์ใน response 200 ของ decideApproval -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `approvalId` | integer | format `int64` | `approval.approval_id` |
| `docType` | string | ค่า: `PR`, `AWARD` | `approval.doc_type` |
| `docId` | integer | format `int64` | `approval.doc_id` |
| `stepNo` | integer |  | `approval.step_no` |
| `requiredRole` | string |  | `approval.required_role` |
| `decision` | string | ค่า: `PENDING`, `APPROVED`, `REJECTED` | `approval.decision` |
| `comment` | string (null ได้) |  | `approval.comment` |
| `decidedAt` | string (null ได้) | format `date-time` | `approval.decided_at` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/decideApproval.request.json`):

```json
{
  "decision": "REJECTED",
  "comment": "ขอเปรียบเทียบสเปกกับรุ่นอื่นก่อน"
}
```

ตัวอย่าง Response 200 (`api/examples/decideApproval.response.200.json`):

```json
{
  "approvalId": 8,
  "docType": "PR",
  "docId": 6,
  "stepNo": 1,
  "requiredRole": "DEPT_APPROVER",
  "decision": "REJECTED",
  "comment": "ขอเปรียบเทียบสเปกกับรุ่นอื่นก่อน",
  "decidedAt": "2026-03-06T13:00:00Z"
}
```

## สร้าง RFQ จาก PR ที่อนุมัติแล้วและเชิญผู้ขาย (createRfq)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ createRfq -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /rfqs` |
| สรุป | สร้าง RFQ จาก PR ที่อนุมัติแล้วและเชิญผู้ขาย |
| บทบาทที่เรียกได้ | `PROCUREMENT` |
| FR | FR-05, FR-14 |
| หน้าจอที่เรียก | SCR-04 |
| Runtime view | V-09 |
| การ์ดเจ้าของ | PRC-04 |
| ตัวอย่างการเรียก | `POST /rfqs` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-09 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ createRfq -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ createRfq -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `prId` | integer | ใช่ | format `int64` | `rfq.pr_id` |
| `dueAt` | string | ใช่ | format `date-time` | `rfq.due_at` |
| `vendorIds` | array[integer] | ใช่ | อย่างน้อย 3 รายการ; ไม่ซ้ำ | `rfq_vendor[rfq_id=rfq_id].vendor_id` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ createRfq -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `rfq` | INSERT | - | `rfq_no` | เลขที่เอกสารถัดไปของชนิด RFQ (ออกก่อนเริ่มธุรกรรม) |
| `rfq` | INSERT | - | `pr_id` | `request.prId` |
| `rfq` | INSERT | - | `status` | ค่าคงที่ `OPEN` |
| `rfq` | INSERT | - | `due_at` | `request.dueAt` |
| `rfq` | INSERT | - | `created_by` | ผู้เรียก `app_user.user_id` |
| `rfq` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |
| `rfq_vendor` | INSERT | ต่อ vendorIds[] | `rfq_id` | `rfq.rfq_id` ของแถวที่เพิ่งเขียน |
| `rfq_vendor` | INSERT | ต่อ vendorIds[] | `vendor_id` | `request.vendorIds` |
| `rfq_vendor` | INSERT | ต่อ vendorIds[] | `invited_at` | เวลาของคำขอ (UTC) |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = request.prId, status = APPROVED | `status` | ค่าคงที่ `IN_SOURCING` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `RFQ` |
| `audit_log` | INSERT | - | `entity_id` | `rfq.rfq_id` ของแถวที่เพิ่งเขียน |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `CREATE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ createRfq -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `201` | สร้าง RFQ แล้ว | Rfq | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-STATE-002` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-RFQ-001`, `ERR-RFQ-006`, `ERR-VND-002` |

<!-- table: ฟิลด์ใน response 201 ของ createRfq -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `rfqId` | integer | format `int64` | `rfq.rfq_id` |
| `rfqNo` | string |  | `rfq.rfq_no` |
| `prId` | integer | format `int64` | `rfq.pr_id` |
| `status` | string | ค่า: `OPEN`, `AWARD_PENDING`, `AWARDED` | `rfq.status` |
| `dueAt` | string | format `date-time` | `rfq.due_at` |
| `vendorIds` | array[integer] |  | `rfq_vendor[rfq_id=rfq_id].vendor_id` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/createRfq.request.json`):

```json
{
  "prId": 3,
  "dueAt": "2026-03-16T17:00:00Z",
  "vendorIds": [1, 3, 4]
}
```

ตัวอย่าง Response 201 (`api/examples/createRfq.response.201.json`):

```json
{
  "rfqId": 2,
  "rfqNo": "RFQ-2026-00002",
  "prId": 3,
  "status": "OPEN",
  "dueAt": "2026-03-16T17:00:00Z",
  "vendorIds": [1, 3, 4]
}
```

## ดูรายละเอียด RFQ (รายการ PR และผู้ขายที่เชิญ) (getRfq)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ getRfq -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /rfqs/{rfqId}` |
| สรุป | ดูรายละเอียด RFQ (รายการ PR และผู้ขายที่เชิญ) |
| บทบาทที่เรียกได้ | `PROCUREMENT`, `PROCUREMENT_HEAD`, `COMMITTEE` |
| FR | FR-05, FR-06 |
| หน้าจอที่เรียก | SCR-05, SCR-06 |
| Runtime view | V-09 |
| การ์ดเจ้าของ | PRC-05 |
| ตัวอย่างการเรียก | `GET /rfqs/2` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-09 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ getRfq -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `rfqId` | path | integer | ใช่ | format `int64` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ getRfq -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | รายละเอียด RFQ | RfqDetail | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |

<!-- table: ฟิลด์ใน response 200 ของ getRfq -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `rfqId` | integer | format `int64` | `rfq.rfq_id` |
| `rfqNo` | string |  | `rfq.rfq_no` |
| `prId` | integer | format `int64` | `rfq.pr_id` |
| `status` | string | ค่า: `OPEN`, `AWARD_PENDING`, `AWARDED` | `rfq.status` |
| `dueAt` | string | format `date-time` | `rfq.due_at` |
| `vendorIds` | array[integer] |  | `rfq_vendor[rfq_id=rfq_id].vendor_id` |
| `prNo` | string |  | `purchase_request[pr_id=pr_id].pr_no` |
| `prTitle` | string |  | `purchase_request[pr_id=pr_id].title` |
| `awardedQuotationId` | integer (null ได้) | format `int64`; ใบเสนอราคาที่ถูกเสนอเป็นผู้ชนะ (ว่างจนกว่าจะเสนอผล) | `award[rfq_id=rfq_id].quotation_id` |
| `awardReason` | string (null ได้) | เหตุผลที่ไม่เลือกราคาต่ำสุด (ว่างเมื่อเลือกราคาต่ำสุดหรือยังไม่เสนอผล) | `award[rfq_id=rfq_id].reason` |
| `items` | array[object] |  | `pr_item[pr_id=pr_id]` |
| `items[].prItemId` | integer | format `int64` | `pr_item.pr_item_id` |
| `items[].description` | string |  | `pr_item.description` |
| `items[].quantity` | number |  | `pr_item.quantity` |
| `items[].unit` | string |  | `pr_item.unit` |
| `vendors` | array[object] |  | `rfq_vendor[rfq_id=rfq_id]` |
| `vendors[].vendorId` | integer |  | `rfq_vendor.vendor_id` |
| `vendors[].vendorName` | string |  | `vendor[vendor_id=vendor_id].name_th` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/getRfq.response.200.json`):

```json
{
  "rfqId": 2,
  "rfqNo": "RFQ-2026-00002",
  "prId": 3,
  "status": "AWARDED",
  "dueAt": "2026-03-16T17:00:00Z",
  "vendorIds": [1, 3, 4],
  "prNo": "PR-2026-00003",
  "prTitle": "เครื่องคอมพิวเตอร์ 4 เครื่อง",
  "awardedQuotationId": 6,
  "awardReason": "ผู้ขายรายนี้รับประกันสามปีและส่งมอบเร็วกว่าห้าวัน",
  "items": [
    {
      "prItemId": 4,
      "description": "เครื่องคอมพิวเตอร์ตั้งโต๊ะ",
      "quantity": 4,
      "unit": "เครื่อง"
    }
  ],
  "vendors": [
    {
      "vendorId": 1,
      "vendorName": "บริษัท สำนักงานตัวอย่าง จำกัด"
    },
    {
      "vendorId": 3,
      "vendorName": "บริษัท ไอทีตัวอย่าง จำกัด"
    },
    {
      "vendorId": 4,
      "vendorName": "บริษัท คอมพิวเตอร์ตัวอย่าง จำกัด"
    }
  ]
}
```

## บันทึกใบเสนอราคาของผู้ขาย (recordQuotation)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ recordQuotation -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /rfqs/{rfqId}/quotations` |
| สรุป | บันทึกใบเสนอราคาของผู้ขาย |
| บทบาทที่เรียกได้ | `PROCUREMENT` |
| FR | FR-06 |
| หน้าจอที่เรียก | SCR-05 |
| Runtime view | V-09 |
| การ์ดเจ้าของ | PRC-05 |
| ตัวอย่างการเรียก | `POST /rfqs/2/quotations` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-09 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ recordQuotation -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `rfqId` | path | integer | ใช่ | format `int64` |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ recordQuotation -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `vendorId` | integer | ใช่ |  | `quotation.vendor_id` |
| `leadTimeDays` | integer | ใช่ | ค่าต่ำสุด 0 | `quotation.lead_time_days` |
| `items` | array[object] | ใช่ | อย่างน้อย 1 รายการ | `quotation_item[quotation_id=quotation_id]` |
| `items[].prItemId` | integer | ใช่ | format `int64` | `quotation_item.pr_item_id` |
| `items[].unitPrice` | number | ใช่ | ค่าต่ำสุด 0 | `quotation_item.unit_price` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ recordQuotation -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `quotation` | UPDATE | เงื่อนไข rfq_id = path.rfqId, vendor_id = request.vendorId, is_active = 1 | `is_active` | ค่าคงที่ `0` |
| `quotation` | INSERT | - | `rfq_id` | `path.rfqId` |
| `quotation` | INSERT | - | `vendor_id` | `request.vendorId` |
| `quotation` | INSERT | - | `total_amount` | ผลรวมของ ปัดเศษ 2 ตำแหน่ง (pr_item.quantity x unitPrice) ต่อบรรทัด |
| `quotation` | INSERT | - | `lead_time_days` | `request.leadTimeDays` |
| `quotation` | INSERT | - | `is_active` | ค่าคงที่ `1` |
| `quotation` | INSERT | - | `submitted_at` | เวลาของคำขอ (UTC) |
| `quotation_item` | INSERT | ต่อ items[] | `quotation_id` | `quotation.quotation_id` ของแถวที่เพิ่งเขียน |
| `quotation_item` | INSERT | ต่อ items[] | `pr_item_id` | `request.items[].prItemId` |
| `quotation_item` | INSERT | ต่อ items[] | `unit_price` | `request.items[].unitPrice` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ recordQuotation -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `201` | บันทึกแล้ว | Quotation | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-RFQ-003` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-RFQ-002` |

<!-- table: ฟิลด์ใน response 201 ของ recordQuotation -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `quotationId` | integer | format `int64` | `quotation.quotation_id` |
| `vendorId` | integer |  | `quotation.vendor_id` |
| `vendorName` | string |  | `vendor[vendor_id=vendor_id].name_th` |
| `totalAmount` | number |  | `quotation.total_amount` |
| `leadTimeDays` | integer |  | `quotation.lead_time_days` |
| `isActive` | boolean |  | `quotation.is_active` |
| `submittedAt` | string | format `date-time` | `quotation.submitted_at` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/recordQuotation.request.json`):

```json
{
  "vendorId": 1,
  "leadTimeDays": 14,
  "items": [
    {
      "prItemId": 4,
      "unitPrice": 29000
    }
  ]
}
```

ตัวอย่าง Response 201 (`api/examples/recordQuotation.response.201.json`):

```json
{
  "quotationId": 5,
  "vendorId": 1,
  "vendorName": "บริษัท สำนักงานตัวอย่าง จำกัด",
  "totalAmount": 116000,
  "leadTimeDays": 14,
  "isActive": true,
  "submittedAt": "2026-03-12T10:00:00Z"
}
```

## ตารางเปรียบเทียบราคา (getQuotationComparison)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ getQuotationComparison -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /rfqs/{rfqId}/comparison` |
| สรุป | ตารางเปรียบเทียบราคา |
| บทบาทที่เรียกได้ | `PROCUREMENT`, `PROCUREMENT_HEAD`, `COMMITTEE` |
| FR | FR-07 |
| หน้าจอที่เรียก | SCR-05, SCR-06 |
| Runtime view | V-10 |
| การ์ดเจ้าของ | PRC-05 |
| ตัวอย่างการเรียก | `GET /rfqs/2/comparison` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-10 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ getQuotationComparison -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `rfqId` | path | integer | ใช่ | format `int64` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ getQuotationComparison -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | ราคาของทุกรายต่อรายการ พร้อมระบุรายที่ต่ำสุด | Comparison | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |

<!-- table: ฟิลด์ใน response 200 ของ getQuotationComparison -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `rfqId` | integer | format `int64` | `rfq.rfq_id` |
| `lowestQuotationId` | integer (null ได้) | format `int64` | คำนวณ: `argmin(quotations, totalAmount, quotationId)` |
| `quotations` | array[object] |  | `quotation[rfq_id=rfq_id,is_active==1]` |
| `quotations[].quotationId` | integer | format `int64` | `quotation.quotation_id` |
| `quotations[].vendorId` | integer |  | `quotation.vendor_id` |
| `quotations[].vendorName` | string |  | `vendor[vendor_id=vendor_id].name_th` |
| `quotations[].totalAmount` | number |  | `quotation.total_amount` |
| `quotations[].leadTimeDays` | integer |  | `quotation.lead_time_days` |
| `quotations[].isActive` | boolean |  | `quotation.is_active` |
| `quotations[].submittedAt` | string | format `date-time` | `quotation.submitted_at` |
| `quotations[].itemPrices` | array[object] |  | `quotation_item[quotation_id=quotation_id]` |
| `quotations[].itemPrices[].prItemId` | integer | format `int64` | `quotation_item.pr_item_id` |
| `quotations[].itemPrices[].unitPrice` | number |  | `quotation_item.unit_price` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/getQuotationComparison.response.200.json`):

```json
{
  "rfqId": 2,
  "lowestQuotationId": 5,
  "quotations": [
    {
      "quotationId": 5,
      "vendorId": 1,
      "vendorName": "บริษัท สำนักงานตัวอย่าง จำกัด",
      "totalAmount": 116000,
      "leadTimeDays": 14,
      "isActive": true,
      "submittedAt": "2026-03-12T10:00:00Z",
      "itemPrices": [
        {
          "prItemId": 4,
          "unitPrice": 29000
        }
      ]
    },
    {
      "quotationId": 6,
      "vendorId": 3,
      "vendorName": "บริษัท ไอทีตัวอย่าง จำกัด",
      "totalAmount": 118000,
      "leadTimeDays": 9,
      "isActive": true,
      "submittedAt": "2026-03-11T10:00:00Z",
      "itemPrices": [
        {
          "prItemId": 4,
          "unitPrice": 29500
        }
      ]
    },
    {
      "quotationId": 7,
      "vendorId": 4,
      "vendorName": "บริษัท คอมพิวเตอร์ตัวอย่าง จำกัด",
      "totalAmount": 120000,
      "leadTimeDays": 12,
      "isActive": true,
      "submittedAt": "2026-03-13T10:00:00Z",
      "itemPrices": [
        {
          "prItemId": 4,
          "unitPrice": 30000
        }
      ]
    }
  ]
}
```

## เสนอผลเลือกผู้ชนะเพื่ออนุมัติ (awardRfq)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ awardRfq -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /rfqs/{rfqId}/award` |
| สรุป | เสนอผลเลือกผู้ชนะเพื่ออนุมัติ |
| บทบาทที่เรียกได้ | `PROCUREMENT` |
| FR | FR-08, FR-13 |
| หน้าจอที่เรียก | SCR-05 |
| Runtime view | V-10 |
| การ์ดเจ้าของ | PRC-05 |
| ตัวอย่างการเรียก | `POST /rfqs/2/award` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-10 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ awardRfq -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `rfqId` | path | integer | ใช่ | format `int64` |
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ awardRfq -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `quotationId` | integer | ใช่ | format `int64` | `award.quotation_id` |
| `reason` | string | ไม่ | ยาวไม่เกิน 500; บังคับ (อย่างน้อย 20 ตัวอักษร) เมื่อไม่ใช่ราคาต่ำสุด | `award.reason` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ awardRfq -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `award` | INSERT | - | `rfq_id` | `path.rfqId` |
| `award` | INSERT | - | `quotation_id` | `request.quotationId` |
| `award` | INSERT | - | `reason` | `request.reason` |
| `award` | INSERT | - | `awarded_by` | ผู้เรียก `app_user.user_id` |
| `award` | INSERT | - | `awarded_at` | เวลาของคำขอ (UTC) |
| `rfq` | UPDATE | เงื่อนไข rfq_id = path.rfqId, status = OPEN | `status` | ค่าคงที่ `AWARD_PENDING` |
| `approval` | INSERT | - | `doc_type` | ค่าคงที่ `AWARD` |
| `approval` | INSERT | - | `doc_id` | `path.rfqId` |
| `approval` | INSERT | - | `step_no` | ค่าคงที่ `1` |
| `approval` | INSERT | - | `required_role` | COMMITTEE เมื่อราคารวมของผู้ชนะเกิน 200,000 นอกนั้น PROCUREMENT_HEAD (BR-05) |
| `approval` | INSERT | - | `decision` | ค่าคงที่ `PENDING` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `RFQ` |
| `audit_log` | INSERT | - | `entity_id` | `path.rfqId` |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `AWARD` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `detail` | `request.reason` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ awardRfq -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `202` | รับเรื่องแล้ว RFQ เป็น AWARD_PENDING รออนุมัติ | Rfq | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-RFQ-004`, `ERR-RFQ-005` |

<!-- table: ฟิลด์ใน response 202 ของ awardRfq -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `rfqId` | integer | format `int64` | `rfq.rfq_id` |
| `rfqNo` | string |  | `rfq.rfq_no` |
| `prId` | integer | format `int64` | `rfq.pr_id` |
| `status` | string | ค่า: `OPEN`, `AWARD_PENDING`, `AWARDED` | `rfq.status` |
| `dueAt` | string | format `date-time` | `rfq.due_at` |
| `vendorIds` | array[integer] |  | `rfq_vendor[rfq_id=rfq_id].vendor_id` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/awardRfq.request.json`):

```json
{
  "quotationId": 6,
  "reason": "ผู้ขายรายนี้รับประกันสามปีและส่งมอบเร็วกว่าห้าวัน"
}
```

ตัวอย่าง Response 202 (`api/examples/awardRfq.response.202.json`):

```json
{
  "rfqId": 2,
  "rfqNo": "RFQ-2026-00002",
  "prId": 3,
  "status": "AWARD_PENDING",
  "dueAt": "2026-03-16T17:00:00Z",
  "vendorIds": [1, 3, 4]
}
```

## สร้าง PO (จากผลประกวดที่อนุมัติ หรือซื้อตรงวงเงินต่ำ) (createPurchaseOrder)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ createPurchaseOrder -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /purchase-orders` |
| สรุป | สร้าง PO (จากผลประกวดที่อนุมัติ หรือซื้อตรงวงเงินต่ำ) |
| บทบาทที่เรียกได้ | `PROCUREMENT` |
| FR | FR-09, FR-14 |
| หน้าจอที่เรียก | SCR-06 |
| Runtime view | V-11 |
| การ์ดเจ้าของ | PRC-06 |
| ตัวอย่างการเรียก | `POST /purchase-orders` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-11 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ createPurchaseOrder -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ createPurchaseOrder -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `prId` | integer | ใช่ | format `int64` | `purchase_order.pr_id` |
| `vendorId` | integer | ไม่ | ใช้เฉพาะซื้อตรง (PR ไม่เกิน 5 | `purchase_order.vendor_id` |
| `rfqId` | integer | ไม่ | format `int64`; ใช้เมื่อออกจากผลประกวดที่อนุมัติแล้ว | `purchase_order.rfq_id` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ createPurchaseOrder -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `purchase_order` | INSERT | เมื่อ ซื้อตรง (ไม่ส่ง rfqId) | `po_no` | เลขที่เอกสารถัดไปของชนิด PO (ออกก่อนเริ่มธุรกรรม) |
| `purchase_order` | INSERT | เมื่อ ซื้อตรง (ไม่ส่ง rfqId) | `pr_id` | `request.prId` |
| `purchase_order` | INSERT | เมื่อ ซื้อตรง (ไม่ส่ง rfqId) | `vendor_id` | `request.vendorId` |
| `purchase_order` | INSERT | เมื่อ ซื้อตรง (ไม่ส่ง rfqId) | `total_amount` | ผลรวมของ ปัดเศษ 2 ตำแหน่ง (quantity x est_unit_price) ต่อบรรทัด |
| `purchase_order` | INSERT | เมื่อ ซื้อตรง (ไม่ส่ง rfqId) | `status` | ค่าคงที่ `DRAFT` |
| `purchase_order` | INSERT | เมื่อ ซื้อตรง (ไม่ส่ง rfqId) | `created_by` | ผู้เรียก `app_user.user_id` |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `po_no` | เลขที่เอกสารถัดไปของชนิด PO (ออกก่อนเริ่มธุรกรรม) |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `pr_id` | `request.prId` |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `rfq_id` | `request.rfqId` |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `vendor_id` | อ่านจาก `quotation.vendor_id` |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `total_amount` | ผลรวมของ ปัดเศษ 2 ตำแหน่ง (quantity x quotation_item.unit_price ของใบที่ชนะ) ต่อบรรทัด |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `status` | ค่าคงที่ `DRAFT` |
| `purchase_order` | INSERT | เมื่อ จากผลประกวด (ส่ง rfqId) | `created_by` | ผู้เรียก `app_user.user_id` |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ ซื้อตรง | `po_id` | `purchase_order.po_id` ของแถวที่เพิ่งเขียน |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ ซื้อตรง | `pr_item_id` | อ่านจาก `pr_item.pr_item_id` |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ ซื้อตรง | `quantity` | อ่านจาก `pr_item.quantity` |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ ซื้อตรง | `unit_price` | อ่านจาก `pr_item.est_unit_price` |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ จากผลประกวด | `po_id` | `purchase_order.po_id` ของแถวที่เพิ่งเขียน |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ จากผลประกวด | `pr_item_id` | อ่านจาก `pr_item.pr_item_id` |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ จากผลประกวด | `quantity` | อ่านจาก `pr_item.quantity` |
| `po_item` | INSERT | ต่อ รายการของ PR ต้นทางทุกรายการ; เมื่อ จากผลประกวด | `unit_price` | อ่านจาก `quotation_item.unit_price` |
| `purchase_request` | UPDATE | เงื่อนไข pr_id = request.prId | `status` | ค่าคงที่ `ORDERED` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `PO` |
| `audit_log` | INSERT | - | `entity_id` | `purchase_order.po_id` ของแถวที่เพิ่งเขียน |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `CREATE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ createPurchaseOrder -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `201` | สร้าง PO สถานะ DRAFT | PurchaseOrder | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-PO-001`, `ERR-VND-002` |

<!-- table: ฟิลด์ใน response 201 ของ createPurchaseOrder -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `poId` | integer | format `int64` | `purchase_order.po_id` |
| `poNo` | string |  | `purchase_order.po_no` |
| `prId` | integer | format `int64` | `purchase_order.pr_id` |
| `vendorId` | integer |  | `purchase_order.vendor_id` |
| `totalAmount` | number |  | `purchase_order.total_amount` |
| `status` | string | ค่า: `DRAFT`, `ISSUED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED` | `purchase_order.status` |
| `vendorName` | string |  | `vendor[vendor_id=vendor_id].name_th` |
| `rfqId` | integer (null ได้) | format `int64` | `purchase_order.rfq_id` |
| `issuedAt` | string (null ได้) | format `date-time` | `purchase_order.issued_at` |
| `items` | array[object] |  | `po_item[po_id=po_id]` |
| `items[].poItemId` | integer | format `int64` | `po_item.po_item_id` |
| `items[].prItemId` | integer | format `int64` | `po_item.pr_item_id` |
| `items[].description` | string |  | `pr_item[pr_item_id=pr_item_id].description` |
| `items[].unit` | string |  | `pr_item[pr_item_id=pr_item_id].unit` |
| `items[].quantity` | number |  | `po_item.quantity` |
| `items[].unitPrice` | number |  | `po_item.unit_price` |
| `items[].qtyReceived` | number | รับสะสม (ไม่รวมจำนวนที่ปฏิเสธ ตาม BR-10) | คำนวณ: `sum(gr_item[po_item_id=po_item_id].qty_received)` |
| `items[].qtyRemaining` | number | คงเหลือ = สั่ง ลบ รับสะสม | คำนวณ: `quantity - qtyReceived` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/createPurchaseOrder.request.json`):

```json
{
  "prId": 1,
  "vendorId": 1
}
```

ตัวอย่าง Response 201 (`api/examples/createPurchaseOrder.response.201.json`):

```json
{
  "poId": 1,
  "poNo": "PO-2026-00001",
  "prId": 1,
  "vendorId": 1,
  "totalAmount": 4800,
  "status": "DRAFT",
  "vendorName": "บริษัท สำนักงานตัวอย่าง จำกัด",
  "rfqId": null,
  "issuedAt": null,
  "items": [
    {
      "poItemId": 1,
      "prItemId": 1,
      "description": "กระดาษ A4 80 แกรม",
      "unit": "รีม",
      "quantity": 40,
      "unitPrice": 90,
      "qtyReceived": 0,
      "qtyRemaining": 40
    },
    {
      "poItemId": 2,
      "prItemId": 2,
      "description": "หมึกพิมพ์",
      "unit": "กล่อง",
      "quantity": 4,
      "unitPrice": 300,
      "qtyReceived": 0,
      "qtyRemaining": 4
    }
  ]
}
```

## ดูรายละเอียด PO พร้อมยอดสั่ง รับสะสม และคงเหลือ (getPurchaseOrder)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ getPurchaseOrder -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /purchase-orders/{poId}` |
| สรุป | ดูรายละเอียด PO พร้อมยอดสั่ง รับสะสม และคงเหลือ |
| บทบาทที่เรียกได้ | `PROCUREMENT`, `PROCUREMENT_HEAD`, `RECEIVER`, `ADMIN` |
| FR | FR-09, FR-10 |
| หน้าจอที่เรียก | SCR-06, SCR-07 |
| Runtime view | V-11 |
| การ์ดเจ้าของ | PRC-06 |
| ตัวอย่างการเรียก | `GET /purchase-orders/2` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-11 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ getPurchaseOrder -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `poId` | path | integer | ใช่ | format `int64` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ getPurchaseOrder -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | รายละเอียด PO | PurchaseOrder | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |

<!-- table: ฟิลด์ใน response 200 ของ getPurchaseOrder -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `poId` | integer | format `int64` | `purchase_order.po_id` |
| `poNo` | string |  | `purchase_order.po_no` |
| `prId` | integer | format `int64` | `purchase_order.pr_id` |
| `vendorId` | integer |  | `purchase_order.vendor_id` |
| `totalAmount` | number |  | `purchase_order.total_amount` |
| `status` | string | ค่า: `DRAFT`, `ISSUED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED` | `purchase_order.status` |
| `vendorName` | string |  | `vendor[vendor_id=vendor_id].name_th` |
| `rfqId` | integer (null ได้) | format `int64` | `purchase_order.rfq_id` |
| `issuedAt` | string (null ได้) | format `date-time` | `purchase_order.issued_at` |
| `items` | array[object] |  | `po_item[po_id=po_id]` |
| `items[].poItemId` | integer | format `int64` | `po_item.po_item_id` |
| `items[].prItemId` | integer | format `int64` | `po_item.pr_item_id` |
| `items[].description` | string |  | `pr_item[pr_item_id=pr_item_id].description` |
| `items[].unit` | string |  | `pr_item[pr_item_id=pr_item_id].unit` |
| `items[].quantity` | number |  | `po_item.quantity` |
| `items[].unitPrice` | number |  | `po_item.unit_price` |
| `items[].qtyReceived` | number | รับสะสม (ไม่รวมจำนวนที่ปฏิเสธ ตาม BR-10) | คำนวณ: `sum(gr_item[po_item_id=po_item_id].qty_received)` |
| `items[].qtyRemaining` | number | คงเหลือ = สั่ง ลบ รับสะสม | คำนวณ: `quantity - qtyReceived` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/getPurchaseOrder.response.200.json`):

```json
{
  "poId": 2,
  "poNo": "PO-2026-00002",
  "prId": 2,
  "vendorId": 2,
  "totalAmount": 17400,
  "status": "PARTIALLY_RECEIVED",
  "vendorName": "ห้างหุ้นส่วน เฟอร์นิเจอร์ตัวอย่าง",
  "rfqId": 1,
  "issuedAt": "2026-03-11T09:00:00Z",
  "items": [
    {
      "poItemId": 3,
      "prItemId": 3,
      "description": "เก้าอี้สำนักงานพนักพิงสูง",
      "unit": "ตัว",
      "quantity": 6,
      "unitPrice": 2900,
      "qtyReceived": 4,
      "qtyRemaining": 2
    }
  ]
}
```

## ออก PO ให้ผู้ขาย (issuePurchaseOrder)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ issuePurchaseOrder -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /purchase-orders/{poId}/issue` |
| สรุป | ออก PO ให้ผู้ขาย |
| บทบาทที่เรียกได้ | `PROCUREMENT` |
| FR | FR-09, FR-13 |
| หน้าจอที่เรียก | SCR-06 |
| Runtime view | V-11 |
| การ์ดเจ้าของ | PRC-06 |
| ตัวอย่างการเรียก | `POST /purchase-orders/1/issue` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-11 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ issuePurchaseOrder -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `poId` | path | integer | ใช่ | format `int64` |
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ issuePurchaseOrder -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `purchase_order` | UPDATE | เงื่อนไข po_id = path.poId, status = DRAFT | `status` | ค่าคงที่ `ISSUED` |
| `purchase_order` | UPDATE | เงื่อนไข po_id = path.poId, status = DRAFT | `issued_at` | เวลาของคำขอ (UTC) |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `PO` |
| `audit_log` | INSERT | - | `entity_id` | `path.poId` |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `ISSUE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ issuePurchaseOrder -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | ออกแล้ว สถานะ ISSUED | PurchaseOrder | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-STATE-001` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ issuePurchaseOrder -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `poId` | integer | format `int64` | `purchase_order.po_id` |
| `poNo` | string |  | `purchase_order.po_no` |
| `prId` | integer | format `int64` | `purchase_order.pr_id` |
| `vendorId` | integer |  | `purchase_order.vendor_id` |
| `totalAmount` | number |  | `purchase_order.total_amount` |
| `status` | string | ค่า: `DRAFT`, `ISSUED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED` | `purchase_order.status` |
| `vendorName` | string |  | `vendor[vendor_id=vendor_id].name_th` |
| `rfqId` | integer (null ได้) | format `int64` | `purchase_order.rfq_id` |
| `issuedAt` | string (null ได้) | format `date-time` | `purchase_order.issued_at` |
| `items` | array[object] |  | `po_item[po_id=po_id]` |
| `items[].poItemId` | integer | format `int64` | `po_item.po_item_id` |
| `items[].prItemId` | integer | format `int64` | `po_item.pr_item_id` |
| `items[].description` | string |  | `pr_item[pr_item_id=pr_item_id].description` |
| `items[].unit` | string |  | `pr_item[pr_item_id=pr_item_id].unit` |
| `items[].quantity` | number |  | `po_item.quantity` |
| `items[].unitPrice` | number |  | `po_item.unit_price` |
| `items[].qtyReceived` | number | รับสะสม (ไม่รวมจำนวนที่ปฏิเสธ ตาม BR-10) | คำนวณ: `sum(gr_item[po_item_id=po_item_id].qty_received)` |
| `items[].qtyRemaining` | number | คงเหลือ = สั่ง ลบ รับสะสม | คำนวณ: `quantity - qtyReceived` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/issuePurchaseOrder.response.200.json`):

```json
{
  "poId": 1,
  "poNo": "PO-2026-00001",
  "prId": 1,
  "vendorId": 1,
  "totalAmount": 4800,
  "status": "ISSUED",
  "vendorName": "บริษัท สำนักงานตัวอย่าง จำกัด",
  "rfqId": null,
  "issuedAt": "2026-03-02T15:00:00Z",
  "items": [
    {
      "poItemId": 1,
      "prItemId": 1,
      "description": "กระดาษ A4 80 แกรม",
      "unit": "รีม",
      "quantity": 40,
      "unitPrice": 90,
      "qtyReceived": 0,
      "qtyRemaining": 40
    },
    {
      "poItemId": 2,
      "prItemId": 2,
      "description": "หมึกพิมพ์",
      "unit": "กล่อง",
      "quantity": 4,
      "unitPrice": 300,
      "qtyReceived": 0,
      "qtyRemaining": 4
    }
  ]
}
```

## บันทึกการรับของ (recordGoodsReceipt)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ recordGoodsReceipt -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /purchase-orders/{poId}/receipts` |
| สรุป | บันทึกการรับของ |
| บทบาทที่เรียกได้ | `RECEIVER` |
| FR | FR-10, FR-14 |
| หน้าจอที่เรียก | SCR-07 |
| Runtime view | V-12 |
| การ์ดเจ้าของ | PRC-07 |
| ตัวอย่างการเรียก | `POST /purchase-orders/2/receipts` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-12 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ recordGoodsReceipt -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `poId` | path | integer | ใช่ | format `int64` |
| `Idempotency-Key` | header | string | ใช่ | format `uuid`; UUID ที่ client สร้าง ส่งซ้ำด้วยคีย์เดิมจะได้ผลเดิม ไม่ทำงานซ้ำ (NFR-05) |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ recordGoodsReceipt -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `note` | string | ไม่ | ยาวไม่เกิน 500 | `goods_receipt.note` |
| `items` | array[object] | ใช่ | อย่างน้อย 1 รายการ | `gr_item[gr_id=gr_id]` |
| `items[].poItemId` | integer | ใช่ | format `int64` | `gr_item.po_item_id` |
| `items[].qtyReceived` | number | ใช่ | ค่าต่ำสุด 0 | `gr_item.qty_received` |
| `items[].qtyRejected` | number | ไม่ | ค่าต่ำสุด 0; ค่าเริ่มต้น `0` | `gr_item.qty_rejected` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ recordGoodsReceipt -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `goods_receipt` | INSERT | - | `gr_no` | เลขที่เอกสารถัดไปของชนิด GR (ออกก่อนเริ่มธุรกรรม) |
| `goods_receipt` | INSERT | - | `po_id` | `path.poId` |
| `goods_receipt` | INSERT | - | `received_by` | ผู้เรียก `app_user.user_id` |
| `goods_receipt` | INSERT | - | `received_at` | เวลาของคำขอ (UTC) |
| `goods_receipt` | INSERT | - | `note` | `request.note` |
| `gr_item` | INSERT | ต่อ items[] | `gr_id` | `goods_receipt.gr_id` ของแถวที่เพิ่งเขียน |
| `gr_item` | INSERT | ต่อ items[] | `po_item_id` | `request.items[].poItemId` |
| `gr_item` | INSERT | ต่อ items[] | `qty_received` | `request.items[].qtyReceived` |
| `gr_item` | INSERT | ต่อ items[] | `qty_rejected` | `request.items[].qtyRejected` |
| `purchase_order` | UPDATE | เงื่อนไข po_id = path.poId | `status` | RECEIVED เมื่อทุกรายการรับสะสมเท่าจำนวนสั่ง นอกนั้น PARTIALLY_RECEIVED |
| `purchase_request` | UPDATE | เมื่อ PO เป็น RECEIVED | `status` | ค่าคงที่ `CLOSED` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `PO` |
| `audit_log` | INSERT | - | `entity_id` | `path.poId` |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `RECEIVE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ recordGoodsReceipt -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `201` | บันทึกแล้ว PO เป็น PARTIALLY_RECEIVED หรือ RECEIVED | Receipt | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-GR-001` |

<!-- table: ฟิลด์ใน response 201 ของ recordGoodsReceipt -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `grId` | integer | format `int64` | `goods_receipt.gr_id` |
| `grNo` | string |  | `goods_receipt.gr_no` |
| `poStatus` | string | ค่า: `PARTIALLY_RECEIVED`, `RECEIVED` | `purchase_order[po_id=po_id].status` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/recordGoodsReceipt.request.json`):

```json
{
  "note": "ส่งมอบรอบแรก เก้าอี้ 1 ตัวชำรุด",
  "items": [
    {
      "poItemId": 3,
      "qtyReceived": 4,
      "qtyRejected": 1
    }
  ]
}
```

ตัวอย่าง Response 201 (`api/examples/recordGoodsReceipt.response.201.json`):

```json
{
  "grId": 2,
  "grNo": "GR-2026-00002",
  "poStatus": "PARTIALLY_RECEIVED"
}
```

## ค้นหาผู้ขาย (listVendors)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ listVendors -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /vendors` |
| สรุป | ค้นหาผู้ขาย |
| บทบาทที่เรียกได้ | `PROCUREMENT`, `PROCUREMENT_HEAD`, `ADMIN` |
| FR | FR-11 |
| หน้าจอที่เรียก | SCR-04, SCR-06, SCR-08 |
| Runtime view | V-13 |
| การ์ดเจ้าของ | PRC-08 |
| ตัวอย่างการเรียก | `GET /vendors?status=ACTIVE` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-13 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ listVendors -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `q` | query | string | ไม่ | คำค้นชื่อหรือเลขผู้เสียภาษี |
| `status` | query | string | ไม่ | ค่า: `ACTIVE`, `SUSPENDED` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ listVendors -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | รายการผู้ขาย | array[Vendor] | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |

<!-- table: ฟิลด์ใน response 200 ของ listVendors -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `nameTh` | string | ยาวไม่เกิน 200 | `vendor.name_th` |
| `taxId` | string | รูปแบบ `^[0-9]{13}$` | `vendor.tax_id` |
| `email` | string | format `email` | `vendor.email` |
| `vendorId` | integer |  | `vendor.vendor_id` |
| `vendorCode` | string |  | `vendor.vendor_code` |
| `status` | string | ค่า: `ACTIVE`, `SUSPENDED` | `vendor.status` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/listVendors.response.200.json`):

```json
[
  {
    "nameTh": "บริษัท สำนักงานตัวอย่าง จำกัด",
    "taxId": "0000000000011",
    "email": "sales@vendor1.example.test",
    "vendorId": 1,
    "vendorCode": "V0001",
    "status": "ACTIVE"
  },
  {
    "nameTh": "ห้างหุ้นส่วน เฟอร์นิเจอร์ตัวอย่าง",
    "taxId": "0000000000012",
    "email": "sales@vendor2.example.test",
    "vendorId": 2,
    "vendorCode": "V0002",
    "status": "ACTIVE"
  },
  {
    "nameTh": "บริษัท ไอทีตัวอย่าง จำกัด",
    "taxId": "0000000000013",
    "email": "sales@vendor3.example.test",
    "vendorId": 3,
    "vendorCode": "V0003",
    "status": "ACTIVE"
  },
  {
    "nameTh": "บริษัท คอมพิวเตอร์ตัวอย่าง จำกัด",
    "taxId": "0000000000014",
    "email": "sales@vendor4.example.test",
    "vendorId": 4,
    "vendorCode": "V0004",
    "status": "ACTIVE"
  }
]
```

## เพิ่มผู้ขาย (createVendor)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ createVendor -->
| รายการ | ค่า |
|---|---|
| Endpoint | `POST /vendors` |
| สรุป | เพิ่มผู้ขาย |
| บทบาทที่เรียกได้ | `PROCUREMENT` |
| FR | FR-11 |
| หน้าจอที่เรียก | SCR-08 |
| Runtime view | V-13 |
| การ์ดเจ้าของ | PRC-08 |
| ตัวอย่างการเรียก | `POST /vendors` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-13 (เล่มสถาปัตยกรรมของระบบ)

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ createVendor -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `nameTh` | string | ใช่ | ยาวไม่เกิน 200 | `vendor.name_th` |
| `taxId` | string | ใช่ | รูปแบบ `^[0-9]{13}$` | `vendor.tax_id` |
| `email` | string | ไม่ | format `email` | `vendor.email` |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ createVendor -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `vendor` | INSERT | - | `vendor_code` | V ตามด้วยเลข 4 หลักของ vendor_id |
| `vendor` | INSERT | - | `name_th` | `request.nameTh` |
| `vendor` | INSERT | - | `tax_id` | `request.taxId` |
| `vendor` | INSERT | - | `email` | `request.email` |
| `vendor` | INSERT | - | `status` | ค่าคงที่ `ACTIVE` |
| `vendor` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `VENDOR` |
| `audit_log` | INSERT | - | `entity_id` | `vendor.vendor_id` ของแถวที่เพิ่งเขียน |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `CREATE` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ createVendor -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `201` | เพิ่มแล้ว | Vendor | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `409` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-VND-001` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | `ERR-VAL-001` |

<!-- table: ฟิลด์ใน response 201 ของ createVendor -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `nameTh` | string | ยาวไม่เกิน 200 | `vendor.name_th` |
| `taxId` | string | รูปแบบ `^[0-9]{13}$` | `vendor.tax_id` |
| `email` | string | format `email` | `vendor.email` |
| `vendorId` | integer |  | `vendor.vendor_id` |
| `vendorCode` | string |  | `vendor.vendor_code` |
| `status` | string | ค่า: `ACTIVE`, `SUSPENDED` | `vendor.status` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/createVendor.request.json`):

```json
{
  "nameTh": "บริษัท คอมพิวเตอร์ตัวอย่าง จำกัด",
  "taxId": "0000000000014",
  "email": "sales@vendor4.example.test"
}
```

ตัวอย่าง Response 201 (`api/examples/createVendor.response.201.json`):

```json
{
  "nameTh": "บริษัท คอมพิวเตอร์ตัวอย่าง จำกัด",
  "taxId": "0000000000014",
  "email": "sales@vendor4.example.test",
  "vendorId": 4,
  "vendorCode": "V0004",
  "status": "ACTIVE"
}
```

## ระงับหรือเปิดใช้ผู้ขาย (setVendorStatus)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ setVendorStatus -->
| รายการ | ค่า |
|---|---|
| Endpoint | `PUT /vendors/{vendorId}/status` |
| สรุป | ระงับหรือเปิดใช้ผู้ขาย |
| บทบาทที่เรียกได้ | `PROCUREMENT_HEAD` |
| FR | FR-11, FR-13 |
| หน้าจอที่เรียก | SCR-08 |
| Runtime view | V-13 |
| การ์ดเจ้าของ | PRC-08 |
| ตัวอย่างการเรียก | `PUT /vendors/5/status` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-13 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ setVendorStatus -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `vendorId` | path | integer | ใช่ |  |

### ข้อมูลที่ส่ง (Request body)

<!-- table: Request body ของ setVendorStatus -->
| ฟิลด์ | ชนิด | บังคับ | กติกา | ที่มา (ตาราง.คอลัมน์) |
|---|---|---|---|---|
| `status` | string | ใช่ | ค่า: `ACTIVE`, `SUSPENDED` | `vendor.status` |
| `reason` | string | ไม่ | ยาวไม่เกิน 500; บังคับเมื่อ status เป็น SUSPENDED | บันทึกใน audit_log.detail ของเหตุการณ์ ไม่เก็บเป็นคอลัมน์ของ vendor |

### ข้อมูลที่บันทึก

<!-- table: ข้อมูลที่บันทึกของ setVendorStatus -->
| ตาราง | การกระทำ | เงื่อนไข | คอลัมน์ | ค่ามาจาก |
|---|---|---|---|---|
| `vendor` | UPDATE | เงื่อนไข vendor_id = path.vendorId | `status` | `request.status` |
| `audit_log` | INSERT | - | `entity` | ค่าคงที่ `VENDOR` |
| `audit_log` | INSERT | - | `entity_id` | `path.vendorId` |
| `audit_log` | INSERT | - | `action` | ค่าคงที่ `STATUS` |
| `audit_log` | INSERT | - | `actor_id` | ผู้เรียก `app_user.user_id` |
| `audit_log` | INSERT | - | `detail` | `request.reason` |
| `audit_log` | INSERT | - | `created_at` | เวลาของคำขอ (UTC) |

### ผลลัพธ์ (Response)

<!-- table: Response ของ setVendorStatus -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | เปลี่ยนแล้ว | Vendor | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `404` | ไม่พบเอกสารตามรหัสที่ระบุ หรือผู้เรียกไม่มีสิทธิ์เห็นเอกสารนั้น (ERR-NF-001) | Problem | `ERR-NF-001` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ setVendorStatus -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `nameTh` | string | ยาวไม่เกิน 200 | `vendor.name_th` |
| `taxId` | string | รูปแบบ `^[0-9]{13}$` | `vendor.tax_id` |
| `email` | string | format `email` | `vendor.email` |
| `vendorId` | integer |  | `vendor.vendor_id` |
| `vendorCode` | string |  | `vendor.vendor_code` |
| `status` | string | ค่า: `ACTIVE`, `SUSPENDED` | `vendor.status` |

### ตัวอย่าง

ตัวอย่าง Request (`api/examples/setVendorStatus.request.json`):

```json
{
  "status": "SUSPENDED",
  "reason": "ระงับชั่วคราวระหว่างตรวจเอกสารจดทะเบียน"
}
```

ตัวอย่าง Response 200 (`api/examples/setVendorStatus.response.200.json`):

```json
{
  "nameTh": "บริษัท ถูกระงับตัวอย่าง จำกัด",
  "taxId": "0000000000015",
  "vendorId": 5,
  "vendorCode": "V0005",
  "status": "SUSPENDED"
}
```

## รายงานสรุปการจัดซื้อ (getSpendSummary)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ getSpendSummary -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /reports/spend-summary` |
| สรุป | รายงานสรุปการจัดซื้อ |
| บทบาทที่เรียกได้ | `PROCUREMENT_HEAD`, `ADMIN` |
| FR | FR-12 |
| หน้าจอที่เรียก | SCR-09 |
| Runtime view | V-14 |
| การ์ดเจ้าของ | PRC-09 |
| ตัวอย่างการเรียก | `GET /reports/spend-summary?from=2026-03-01&to=2026-03-31&groupBy=department` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-14 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ getSpendSummary -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `from` | query | string | ใช่ | format `date` |
| `to` | query | string | ใช่ | format `date` |
| `groupBy` | query | string | ไม่ | ค่า: `department`, `vendor`, `month`; ค่าเริ่มต้น `department` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ getSpendSummary -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | สรุปจำนวนเอกสารและมูลค่า | SpendSummary | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ getSpendSummary -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `from` | string | format `date` | ค่าของ query from |
| `to` | string | format `date` | ค่าของ query to |
| `rows` | array[object] |  | คำนวณ: สูตรรายงานสรุปการจัดซื้อ (FR-12) |
| `rows[].group` | string |  | รวมจากแถวเอกสารตามกติกาใน FR-12 (ดูหัวข้อสูตรรายงาน) |
| `rows[].prCount` | integer |  | รวมจากแถวเอกสารตามกติกาใน FR-12 (ดูหัวข้อสูตรรายงาน) |
| `rows[].poCount` | integer |  | รวมจากแถวเอกสารตามกติกาใน FR-12 (ดูหัวข้อสูตรรายงาน) |
| `rows[].estimatedTotal` | number |  | รวมจากแถวเอกสารตามกติกาใน FR-12 (ดูหัวข้อสูตรรายงาน) |
| `rows[].orderedTotal` | number |  | รวมจากแถวเอกสารตามกติกาใน FR-12 (ดูหัวข้อสูตรรายงาน) |
| `rows[].savingVsEstimate` | number | ประมาณการ ลบ มูลค่าที่สั่งจริง | รวมจากแถวเอกสารตามกติกาใน FR-12 (ดูหัวข้อสูตรรายงาน) |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/getSpendSummary.response.200.json`):

```json
{
  "from": "2026-03-01",
  "to": "2026-03-31",
  "rows": [
    {
      "group": "ปฏิบัติการ",
      "prCount": 1,
      "poCount": 1,
      "estimatedTotal": 120000,
      "orderedTotal": 118000,
      "savingVsEstimate": 2000
    },
    {
      "group": "ไอที",
      "prCount": 2,
      "poCount": 2,
      "estimatedTotal": 22800,
      "orderedTotal": 22200,
      "savingVsEstimate": 600
    }
  ]
}
```

## ตรวจ audit trail ของเอกสาร (listAuditLogs)

### ข้อมูลทั่วไป

<!-- table: ข้อมูลทั่วไปของ listAuditLogs -->
| รายการ | ค่า |
|---|---|
| Endpoint | `GET /audit-logs` |
| สรุป | ตรวจ audit trail ของเอกสาร |
| บทบาทที่เรียกได้ | `ADMIN` |
| FR | FR-13 |
| หน้าจอที่เรียก | SCR-10 |
| Runtime view | V-14 |
| การ์ดเจ้าของ | PRC-10 |
| ตัวอย่างการเรียก | `GET /audit-logs?entity=PR&entityId=1` |

- ต้องมี `Authorization: Bearer <token>` (SSO) ทุกคำขอ; เรียกด้วยบทบาทที่ไม่อยู่ในรายการข้างบนได้ `403`
- ขั้นตอนการทำงานภายในและลำดับการตรวจอยู่ที่ runtime view V-14 (เล่มสถาปัตยกรรมของระบบ)

### พารามิเตอร์

<!-- table: พารามิเตอร์ของ listAuditLogs -->
| ชื่อ | ที่ | ชนิด | บังคับ | กติกา |
|---|---|---|---|---|
| `entity` | query | string | ใช่ | ค่า: `PR`, `RFQ`, `PO`, `GR`, `VENDOR` |
| `entityId` | query | integer | ใช่ | format `int64` |

### ผลลัพธ์ (Response)

<!-- table: Response ของ listAuditLogs -->
| HTTP | ความหมาย | schema | รหัสข้อผิดพลาดที่เกิดได้ |
|---|---|---|---|
| `200` | เหตุการณ์เรียงตามเวลา | array[AuditEntry] | - |
| `401` | ไม่มี token หรือ token หมดอายุ (ERR-AUTH-001) | Problem | `ERR-AUTH-001` |
| `403` | บทบาทหรือขอบเขตข้อมูลไม่อนุญาต (ERR-AUTH-002) | Problem | `ERR-AUTH-002` |
| `422` | ข้อผิดพลาด (รหัสใน `code` ดูตารางรหัสข้อผิดพลาดในเอกสาร API) | Problem | - |

<!-- table: ฟิลด์ใน response 200 ของ listAuditLogs -->
| ฟิลด์ | ชนิด | กติกา | ที่มา |
|---|---|---|---|
| `auditId` | integer | format `int64` | `audit_log.audit_id` |
| `action` | string |  | `audit_log.action` |
| `actorId` | integer |  | `audit_log.actor_id` |
| `detail` | string |  | `audit_log.detail` |
| `createdAt` | string | format `date-time` | `audit_log.created_at` |

### ตัวอย่าง

ตัวอย่าง Response 200 (`api/examples/listAuditLogs.response.200.json`):

```json
[
  {
    "auditId": 1,
    "action": "SUBMIT",
    "actorId": 2,
    "detail": "ส่งอนุมัติ",
    "createdAt": "2026-03-02T09:30:00Z"
  },
  {
    "auditId": 2,
    "action": "APPROVE",
    "actorId": 3,
    "detail": "อนุมัติขั้น 1",
    "createdAt": "2026-03-02T10:00:00Z"
  }
]
```
