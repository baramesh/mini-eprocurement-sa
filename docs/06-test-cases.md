# กรณีทดสอบ (Test Cases)

## 1. กลยุทธ์การทดสอบ

| ระดับ | ทดสอบอะไร | หมายเหตุ |
|---|---|---|
| API / Integration | ทุก operation ตามกฎใน `docs/04-api-spec.md` รวมรหัสข้อผิดพลาด | เป็นระดับหลักของชุดนี้ |
| ข้อมูล / ฐานข้อมูล | constraint, unique index, `usp_next_doc_no` ภายใต้ภาระพร้อมกัน | ต้องรันบน SQL Server (ดูข้อจำกัด) |
| UI | กติกาฟิลด์และข้อความใน `docs/05-screen-spec.md` | ใช้ E2E ในระบบจริง ไม่อยู่ในชุดนี้ |

การออกแบบกรณีทดสอบใช้ **การวิเคราะห์ค่าขอบ (Boundary Value Analysis)** กับเกณฑ์วงเงิน 5,000 / 20,000 / 200,000 บาท ซึ่งเป็นจุดที่กฎธุรกิจเปลี่ยนพฤติกรรม

## 2. กรณีทดสอบ

| รหัส | ชื่อกรณีทดสอบ | ประเภท | FR | API (operationId) | ขั้นตอนและข้อมูล | ผลที่คาดหวัง |
|---|---|---|---|---|---|---|
| TC-01 | สร้าง PR ถูกต้อง | Positive | FR-01, FR-14 | createPurchaseRequest | ผู้ขอซื้อส่งหัวข้อ เหตุผล วันที่ในอนาคต 2 รายการ | 201, `prNo` รูปแบบ `PR-YYYY-NNNNN`, status `DRAFT`, `totalEstimated` = ผลรวม |
| TC-02 | สร้าง PR ไม่มีรายการ | Negative | FR-01 | createPurchaseRequest | `items` เป็น `[]` | 422 `ERR-VAL-001` |
| TC-03 | จำนวนเป็นศูนย์ | Negative | FR-01 | createPurchaseRequest | `quantity` = 0 | 422 `ERR-VAL-001` ที่ `items[0].quantity` |
| TC-04 | แก้ draft ด้วยเวอร์ชันล้าสมัย | Negative | FR-01 | updatePurchaseRequest | ผู้ใช้ A และ B โหลดเวอร์ชันเดียวกัน A แก้แล้ว B แก้ด้วย `If-Match` เดิม | B ได้ 409 `ERR-CONC-001` |
| TC-05 | ผู้ขอซื้อเห็นเฉพาะ PR ของตน | Security | FR-02 | listPurchaseRequests | ผู้ขอซื้อ A เรียกรายการ ขณะมี PR ของ B ในระบบ | ผลไม่มี PR ของ B |
| TC-06 | ส่ง PR ไม่เกิน 20,000 | Boundary | FR-03, FR-04 | submitPurchaseRequest | `totalEstimated` = 20,000.00 | สร้างอนุมัติ 1 ขั้น (`DEPT_APPROVER`) |
| TC-07 | ส่ง PR เกิน 20,000 หนึ่งสตางค์ | Boundary | FR-03, FR-04 | submitPurchaseRequest | `totalEstimated` = 20,000.01 | สร้างอนุมัติ 2 ขั้น (`DEPT_APPROVER`, `PROCUREMENT_HEAD`) |
| TC-08 | ส่ง PR ที่ 200,000 | Boundary | FR-03, FR-04 | submitPurchaseRequest | `totalEstimated` = 200,000.00 | อนุมัติ 2 ขั้น |
| TC-09 | ส่ง PR เกิน 200,000 | Boundary | FR-03, FR-04 | submitPurchaseRequest | `totalEstimated` = 200,000.01 | อนุมัติ 3 ขั้น (เพิ่ม `COMMITTEE`) |
| TC-10 | ส่งซ้ำด้วย Idempotency-Key เดิม | Idempotency | FR-03, FR-13 | submitPurchaseRequest | เรียก 2 ครั้งด้วยคีย์และ payload เดียวกัน | ได้ผลเดิม สร้างอนุมัติและ audit ชุดเดียว |
| TC-11 | ส่ง PR ที่ไม่ใช่ draft | Negative | FR-03 | submitPurchaseRequest | ส่งซ้ำด้วยคีย์ใหม่หลังส่งไปแล้ว | 409 `ERR-STATE-001` |
| TC-12 | ผู้ขอซื้ออนุมัติ PR ตนเอง | Security | FR-04 | decideApproval | ผู้ใช้มีบทบาท `DEPT_APPROVER` และเป็นผู้ขอซื้อ | 403 `ERR-SOD-001` |
| TC-13 | ปฏิเสธโดยไม่ระบุเหตุผล | Negative | FR-04 | decideApproval | `decision` = REJECTED ไม่มี `comment` | 422 `ERR-VAL-001` |
| TC-14 | อนุมัติครบทุกขั้น | Positive | FR-04, FR-13 | decideApproval | PR 2 ขั้น ผู้อนุมัติแต่ละขั้นอนุมัติตามลำดับ | PR เป็น `APPROVED` มี audit ครบทุกขั้น |
| TC-15 | ปฏิเสธแล้วกลับ draft | Positive | FR-04 | decideApproval | ผู้อนุมัติขั้นแรกปฏิเสธพร้อมเหตุผล | PR เป็น `DRAFT` แก้ไขได้ |
| TC-16 | กล่องอนุมัติแสดงเฉพาะขั้นของตน | Security | FR-04 | listMyApprovals | `PROCUREMENT_HEAD` เรียกเมื่อ PR ยังอยู่ขั้น `DEPT_APPROVER` | ไม่เห็น PR นั้น |
| TC-17 | สร้าง RFQ จาก PR วงเงิน 5,000.01 | Boundary | FR-05, FR-14 | createRfq | PR `APPROVED` เชิญผู้ขาย 3 ราย | 201 `rfqNo` ถูกรูปแบบ PR เป็น `IN_SOURCING` |
| TC-18 | สร้าง RFQ จาก PR วงเงิน 5,000.00 | Boundary | FR-05 | createRfq | PR `APPROVED` วงเงิน 5,000.00 | 422 `ERR-RFQ-006` (ให้ซื้อตรง) |
| TC-19 | เชิญผู้ขายเพียง 2 ราย | Negative | FR-05 | createRfq | `vendorIds` มี 2 ค่า | 422 `ERR-RFQ-001` |
| TC-20 | เชิญผู้ขายที่ถูกระงับ | Negative | FR-05, FR-11 | createRfq | ผู้ขาย 1 ใน 3 สถานะ `SUSPENDED` | 422 `ERR-VND-002` |
| TC-21 | สร้าง RFQ จาก PR ที่ยังไม่อนุมัติ | Negative | FR-05 | createRfq | PR สถานะ `SUBMITTED` | 409 `ERR-STATE-002` |
| TC-22 | บันทึกใบเสนอราคาจากผู้ขายที่ไม่ได้รับเชิญ | Negative | FR-06 | recordQuotation | `vendorId` ไม่อยู่ใน RFQ | 422 `ERR-RFQ-002` |
| TC-23 | บันทึกใบเสนอราคาหลังปิดรับ | Negative | FR-06 | recordQuotation | เวลาปัจจุบันเลย `dueAt` | 409 `ERR-RFQ-003` |
| TC-24 | บันทึกใบเสนอราคาซ้ำ | Positive | FR-06 | recordQuotation | ผู้ขายรายเดิมบันทึก 2 ครั้ง ราคาต่างกัน | ฉบับแรก `isActive` = false ฉบับหลัง true เหลือฉบับที่ใช้งาน 1 ฉบับ |
| TC-25 | ตารางเทียบราคาระบุรายต่ำสุด | Positive | FR-07 | getQuotationComparison | 3 ใบเสนอราคา ราคารวม 100, 90, 95 | `lowestQuotationId` ชี้ใบ 90 |
| TC-26 | เสนอผลโดยมีใบเสนอราคารายเดียว | Negative | FR-08 | awardRfq | RFQ มีใบเสนอราคาที่ใช้งาน 1 ใบ | 422 `ERR-RFQ-005` |
| TC-27 | เลือกไม่ใช่ราคาต่ำสุด ไม่มีเหตุผล | Negative | FR-08 | awardRfq | เลือกใบ 95 ขณะต่ำสุดคือ 90 ไม่ส่ง `reason` | 422 `ERR-RFQ-004` |
| TC-28 | เลือกไม่ใช่ต่ำสุด เหตุผล 19 ตัวอักษร | Boundary | FR-08 | awardRfq | `reason` ยาว 19 ตัวอักษร | 422 `ERR-RFQ-004` |
| TC-29 | เลือกไม่ใช่ต่ำสุด เหตุผล 20 ตัวอักษร | Boundary | FR-08 | awardRfq | `reason` ยาว 20 ตัวอักษร | 202 RFQ เป็น `AWARD_PENDING` |
| TC-30 | อนุมัติผลเลือกวงเงินเกิน 200,000 | Positive | FR-08, FR-13 | decideApproval | RFQ มูลค่าที่ชนะ 250,000 อนุมัติโดย `COMMITTEE` | RFQ เป็น `AWARDED` (BR-05) |
| TC-31 | ซื้อตรงวงเงิน 5,000.00 | Boundary | FR-09, FR-14 | createPurchaseOrder | PR `APPROVED` วงเงิน 5,000.00 ระบุ `vendorId` | 201 `poNo` ถูกรูปแบบ PR เป็น `ORDERED` |
| TC-32 | ซื้อตรงวงเงิน 5,000.01 | Boundary | FR-09 | createPurchaseOrder | PR วงเงิน 5,000.01 ไม่มี `rfqId` | 422 `ERR-PO-001` |
| TC-33 | ออก PO ให้ผู้ขายที่ถูกระงับ | Negative | FR-09, FR-11 | createPurchaseOrder | ซื้อตรงกับผู้ขาย `SUSPENDED` | 422 `ERR-VND-002` |
| TC-34 | ออก PO จาก DRAFT เป็น ISSUED | Positive | FR-09, FR-13 | issuePurchaseOrder | PO `DRAFT` | 200 `ISSUED` มี audit |
| TC-35 | ออก PO ซ้ำ | Negative | FR-09 | issuePurchaseOrder | ออก PO ที่เป็น `ISSUED` แล้วด้วยคีย์ใหม่ | 409 `ERR-STATE-001` |
| TC-36 | รับของบางส่วน | Positive | FR-10, FR-14 | recordGoodsReceipt | PO สั่ง 10 หน่วย รับ 4 | 201 `grNo` ถูกรูปแบบ PO เป็น `PARTIALLY_RECEIVED` |
| TC-37 | รับของครบด้วยการรับหลายครั้ง | Positive | FR-10 | recordGoodsReceipt | รับ 4 แล้วรับ 6 | PO เป็น `RECEIVED` PR เป็น `CLOSED` |
| TC-38 | รับของเกินจำนวนสั่ง | Boundary | FR-10 | recordGoodsReceipt | สั่ง 10 รับสะสมแล้ว 4 รับเพิ่ม 7 | 422 `ERR-GR-001` |
| TC-39 | จำนวนที่ปฏิเสธไม่นับเป็นรับ | Positive | FR-10 | recordGoodsReceipt | รับ 5 ปฏิเสธ 1 | ยอดรับสะสมนับ 5 ไม่ใช่ 6 |
| TC-40 | เพิ่มผู้ขายเลขภาษีซ้ำ | Negative | FR-11 | createVendor | `taxId` ซ้ำกับผู้ขายเดิม | 409 `ERR-VND-001` |
| TC-41 | เลขภาษีไม่ครบ 13 หลัก | Negative | FR-11 | createVendor | `taxId` 12 หลัก | 422 `ERR-VAL-001` |
| TC-42 | ระงับผู้ขาย | Positive | FR-11, FR-13 | setVendorStatus | `PROCUREMENT_HEAD` ตั้ง `SUSPENDED` พร้อมเหตุผล | 200 มี audit |
| TC-43 | ค้นหาผู้ขายตามชื่อ | Positive | FR-11 | listVendors | `q` = บางส่วนของชื่อ | ได้เฉพาะผู้ขายที่ตรง |
| TC-44 | รายงานสรุปแยกหน่วยงาน | Positive | FR-12 | getSpendSummary | ช่วงวันที่ที่มี PR/PO หลายหน่วยงาน | ผลรวมตรงกับข้อมูลต้นทาง `savingVsEstimate` = ประมาณการ − สั่งจริง |
| TC-45 | ผู้ขอซื้อเรียกรายงาน | Security | FR-12 | getSpendSummary | token บทบาท `REQUESTER` | 403 `ERR-AUTH-002` |
| TC-46 | ตรวจ audit ของ PR | Positive | FR-13 | listAuditLogs | PR ที่ผ่าน ส่ง→อนุมัติ→สร้าง RFQ | เห็นเหตุการณ์ครบเรียงตามเวลา |
| TC-47 | บัญชีแอปแก้ audit ไม่ได้ | Security | FR-13 | listAuditLogs | พยายาม `UPDATE`/`DELETE` ตาราง `audit_log` ด้วยบัญชีแอป | ถูกปฏิเสธโดยฐานข้อมูล (NFR-02) |
| TC-48 | ออกเลขเอกสารพร้อมกัน | Concurrency | FR-14 | createPurchaseRequest | 20 เธรดสร้าง PR รวม 1,000 ใบ | เลข 1,000 ค่าไม่ซ้ำ ต่อเนื่อง (NFR-04) |
| TC-49 | token หมดอายุ | Security | FR-02 | listPurchaseRequests | เรียกด้วย token หมดอายุ | 401 `ERR-AUTH-001` |
| TC-50 | ดูรายละเอียด PR พร้อมสายอนุมัติ | Positive | FR-02 | getPurchaseRequest | เจ้าของ PR ที่ส่งแล้ว (วงเงิน 50,000) เรียกดู | 200 มี `items` ครบและ `approvals` 2 ขั้นตามลำดับ |
| TC-51 | ดู PR ของหน่วยงานอื่น | Security | FR-02 | getPurchaseRequest | ผู้อนุมัติหน่วยงาน A ขอดู PR ของหน่วยงาน B | 403 `ERR-AUTH-002` |

## 3. ผลการรันส่วนที่ทดสอบระดับฐานข้อมูล

กรณีทดสอบที่เป็นพฤติกรรมของฐานข้อมูลได้ถูกรันจริงบน SQL Server 2022 ด้วย `sql/tests.sql` และสคริปต์ภายใน (ไม่เผยแพร่) ผลดิบและสภาพแวดล้อมอยู่ใน [`tests/db/RESULTS.md`](../tests/db/RESULTS.md)

| กรณีทดสอบ | สิ่งที่รันจริงที่ระดับฐานข้อมูล | ผล |
|---|---|---|
| TC-03 | `CHECK (quantity > 0)` ปฏิเสธจำนวนศูนย์ | ผ่าน |
| TC-04 | `ROWVERSION` เปลี่ยนทุกครั้งที่แก้ (พื้นฐานของ `If-Match`; ตรรกะ 409 ใน API ยังไม่ได้ทดสอบ) | ผ่าน |
| TC-24 | ใบเสนอราคาที่ใช้งานได้ฉบับเดียวต่อผู้ขายต่อ RFQ และเก็บประวัติฉบับเดิม | ผ่าน |
| TC-40 | `tax_id` ซ้ำถูกปฏิเสธ (error 2627) | ผ่าน |
| TC-22 (ส่วนฐานข้อมูล) | ใบเสนอราคาจากผู้ขายที่ไม่ได้รับเชิญถูกปฏิเสธด้วย foreign key (error 547) | ผ่าน |
| TC-47 | บัญชีแอปที่ได้รับสิทธิ์กว้างยัง `UPDATE`/`DELETE` ตาราง `audit_log` ไม่ได้ (error 229) แต่ `INSERT` ได้ | ผ่าน |
| TC-48 | 20 เธรด × 50 เลข ได้ 1,000 เลขไม่ซ้ำและต่อเนื่อง ไม่มีเธรดล้มเหลว | ผ่าน |
| ตัวควบคุมของ TC-48 | วิธี `MAX()+1` แบบไม่ล็อกรันภายใต้ภาระเดียวกันได้ 1,000 แถวแต่เลขไม่ซ้ำเพียงส่วนน้อย (ตัวเลขแต่ละรอบต่างกัน อยู่ในผลดิบ) | ยืนยันว่าตัวทดสอบจับความผิดได้ |

## 4. ข้อจำกัดของชุดทดสอบนี้

- กรณีทดสอบระดับ API (ส่วนใหญ่ของ TC-01 ถึง TC-51) **ยังไม่มีผลการรัน** เพราะยังไม่มีระบบที่ implement API ตามสัญญา ส่วนที่รันแล้วคือพฤติกรรมของฐานข้อมูลตามตารางข้างบนเท่านั้น
- TC-48 ใช้ 20 การเชื่อมต่อที่ฝั่งเดียวกับเซิร์ฟเวอร์ ไม่ใช่ภาระจากเครือข่ายจริง และรันบน SQL Server ภายใต้การจำลอง amd64 บนเครื่องพัฒนา ผลแสดงว่าตรรกะล็อกถูกต้อง ไม่ใช่ตัวเลขประสิทธิภาพ
- ไม่มีกรณีทดสอบประสิทธิภาพ (NFR-01) ในชุดนี้ ต้องวัดบนข้อมูล 100,000 PR
