# CARD-SLICING — PRC

> สร้างอัตโนมัติจาก `plan/cards/*.md` ห้ามแก้ไฟล์นี้ด้วยมือ ให้แก้ที่การ์ดต้นทาง

| การ์ด | ประเภท | Journey | Phase | หน้าจอ | API ที่เป็นเจ้าของ | AC | SP dev/qa | เหตุผลการตัด |
|---|---|---|---:|---|---|---:|---|---|
| [PRC-S1](cards/prc-s1-database-and-numbering.md) | supporting | JNY-01 | 0 | – | – | 6 | 8/3 | งานไม่มีหน้าจอ ต้องเสร็จก่อนทุก Journey |
| [PRC-S2](cards/prc-s2-api-foundation.md) | supporting | JNY-01 | 0 | – | – | 2 | 8/5 | งานข้ามส่วนที่ทุก endpoint ใช้ ไม่ผูกกับหน้าจอใด |
| [PRC-S3](cards/prc-s3-approval-chain-and-audit.md) | supporting | JNY-01 | 0 | – | – | 8 | 5/3 | ตรรกะที่ใช้ร่วมระหว่างอนุมัติ PR และผลเลือกผู้ชนะ จึงแยกเป็นการ์ดสนับสนุน |
| [PRC-01](cards/prc-01-pr-list.md) | screen | JNY-01 | 1 | SCR-01 | listPurchaseRequests | 2 | 3/2 | หนึ่งหน้าจอ หนึ่งการ์ด |
| [PRC-02](cards/prc-02-pr-form.md) | screen | JNY-01 | 2 | SCR-02 | createPurchaseRequest, getPurchaseRequest, updatePurchaseRequest, submitPurchaseRequest | 14 | 8/5 | หนึ่งหน้าจอ หนึ่งการ์ด ฟอร์มนี้เป็นเจ้าของ API ฝั่งเขียนของ PR |
| [PRC-03](cards/prc-03-approval-inbox.md) | screen | JNY-01 | 3 | SCR-03 | listMyApprovals, decideApproval | 6 | 5/3 | หน้าจอที่สองจาก Journey ใช้ร่วมกับ JNY-02 (ผลเลือกผู้ชนะ) จึงมีการ์ดเดียวและระบุ `supports_journeys` |
| [PRC-08](cards/prc-08-vendor-master.md) | screen | JNY-02 | 1 | SCR-08 | listVendors, createVendor, setVendorStatus | 4 | 3/2 | เป็นข้อมูลตั้งต้นที่ RFQ ต้องใช้ จึงเป็น phase แรกของ JNY-02 |
| [PRC-04](cards/prc-04-rfq-create.md) | screen | JNY-02 | 2 | SCR-04 | createRfq | 5 | 5/3 | หนึ่งหน้าจอ หนึ่งการ์ด |
| [PRC-05](cards/prc-05-quotation-compare.md) | screen | JNY-02 | 3 | SCR-05 | recordQuotation, getQuotationComparison, awardRfq | 8 | 8/5 | หน้าจอเดียวที่รวมการบันทึก เปรียบเทียบ และเสนอผล เพราะแยกส่งมอบไม่ได้ |
| [PRC-06](cards/prc-06-purchase-order.md) | screen | JNY-03 | 1 | SCR-06 | createPurchaseOrder, issuePurchaseOrder | 5 | 5/3 | หนึ่งหน้าจอ หนึ่งการ์ด |
| [PRC-07](cards/prc-07-goods-receipt.md) | screen | JNY-03 | 2 | SCR-07 | recordGoodsReceipt | 4 | 5/3 | หนึ่งหน้าจอ หนึ่งการ์ด |
| [PRC-09](cards/prc-09-spend-report.md) | screen | JNY-04 | 1 | SCR-09 | getSpendSummary | 2 | 5/3 | หนึ่งหน้าจอ หนึ่งการ์ด |
| [PRC-10](cards/prc-10-audit-trail.md) | screen | JNY-04 | 2 | SCR-10 | listAuditLogs | 2 | 2/2 | หนึ่งหน้าจอ หนึ่งการ์ด |
