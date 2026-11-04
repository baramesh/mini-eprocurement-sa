<!-- table: การตัดการ์ดและเหตุผล -->
| การ์ด | ประเภท | หน้าจอ | API ที่เป็นเจ้าของ | AC | เหตุผลการตัด |
|-------|----------|-------|----------------------------|---|--------------------|
| `PRC-S1` | supporting | – | – | 6 | งานไม่มีหน้าจอ ต้องเสร็จก่อนทุก Journey |
| `PRC-S2` | supporting | – | – | 2 | งานข้ามส่วนที่ทุก endpoint ใช้ ไม่ผูกกับหน้าจอใด |
| `PRC-S3` | supporting | – | – | 8 | ตรรกะที่ใช้ร่วมระหว่างอนุมัติ PR และผลเลือกผู้ชนะ จึงแยกเป็นการ์ดสนับสนุน |
| `PRC-01` | screen | SCR-01 | listPurchaseRequests | 2 | หนึ่งหน้าจอ หนึ่งการ์ด |
| `PRC-02` | screen | SCR-02 | createPurchaseRequest, getPurchaseRequest, updatePurchaseRequest, submitPurchaseRequest | 14 | หนึ่งหน้าจอ หนึ่งการ์ด ฟอร์มนี้เป็นเจ้าของ API ฝั่งเขียนของ PR |
| `PRC-03` | screen | SCR-03 | listMyApprovals, decideApproval | 6 | หน้าจอที่สองจาก Journey ใช้ร่วมกับ JNY-02 (ผลเลือกผู้ชนะ) จึงมีการ์ดเดียวและระบุ `supports_journeys` |
| `PRC-08` | screen | SCR-08 | listVendors, createVendor, setVendorStatus | 4 | เป็นข้อมูลตั้งต้นที่ RFQ ต้องใช้ จึงเป็น phase แรกของ JNY-02 |
| `PRC-04` | screen | SCR-04 | createRfq | 5 | หนึ่งหน้าจอ หนึ่งการ์ด |
| `PRC-05` | screen | SCR-05 | getRfq, recordQuotation, getQuotationComparison, awardRfq | 10 | หน้าจอเดียวที่รวมการบันทึก เปรียบเทียบ และเสนอผล เพราะแยกส่งมอบไม่ได้ |
| `PRC-06` | screen | SCR-06 | createPurchaseOrder, getPurchaseOrder, issuePurchaseOrder | 7 | หนึ่งหน้าจอ หนึ่งการ์ด |
| `PRC-07` | screen | SCR-07 | recordGoodsReceipt | 4 | หนึ่งหน้าจอ หนึ่งการ์ด |
| `PRC-09` | screen | SCR-09 | getSpendSummary | 2 | หนึ่งหน้าจอ หนึ่งการ์ด |
| `PRC-10` | screen | SCR-10 | listAuditLogs | 2 | หนึ่งหน้าจอ หนึ่งการ์ด |
