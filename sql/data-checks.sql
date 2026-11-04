-- Checks on the loaded seed + sample data: the numbers and states the sample claims are consistent with each other and with the business rules.
-- Run after schema.sql and the loaded data:  sqlcmd -b -d <db> -i sql/data-checks.sql   (a failing check raises error 50000 and stops)
SET NOCOUNT ON;
GO
DECLARE @v INT;

SELECT @v = COUNT(*) FROM purchase_request p WHERE p.total_estimated <> (SELECT SUM(quantity * est_unit_price) FROM pr_item i WHERE i.pr_id = p.pr_id);
IF @v > 0 THROW 50000, 'DATA-01 FAIL: PR total_estimated differs from the sum of its items', 1; PRINT 'PASS DATA-01 PR total equals the sum of its items';

SELECT @v = COUNT(*) FROM quotation q WHERE q.total_amount <> (SELECT SUM(qi.unit_price * pi.quantity) FROM quotation_item qi JOIN pr_item pi ON pi.pr_item_id = qi.pr_item_id WHERE qi.quotation_id = q.quotation_id);
IF @v > 0 THROW 50000, 'DATA-02 FAIL: quotation total differs from unit prices x quantities', 1; PRINT 'PASS DATA-02 quotation total equals unit prices x quantities';

SELECT @v = COUNT(*) FROM purchase_order o WHERE o.total_amount <> (SELECT SUM(quantity * unit_price) FROM po_item i WHERE i.po_id = o.po_id);
IF @v > 0 THROW 50000, 'DATA-03 FAIL: PO total differs from the sum of its items', 1; PRINT 'PASS DATA-03 PO total equals the sum of its items';

-- BR-01 / BR-02: a PR above 5,000 that was ordered went through an RFQ with at least 3 invited vendors; up to 5,000 may be bought directly
SELECT @v = COUNT(*) FROM purchase_request p JOIN purchase_order o ON o.pr_id = p.pr_id
 WHERE p.total_estimated > 5000 AND (o.rfq_id IS NULL OR (SELECT COUNT(*) FROM rfq_vendor v WHERE v.rfq_id = o.rfq_id) < 3);
IF @v > 0 THROW 50000, 'DATA-04 FAIL: BR-01/BR-02 violated by sample data', 1; PRINT 'PASS DATA-04 BR-01 and BR-02 hold in the sample';

-- BR-03: approval chain length by amount (<=20,000: 1 step; <=200,000: 2 steps; above: 3 steps)
SELECT @v = COUNT(*) FROM purchase_request p JOIN (SELECT doc_id, COUNT(*) n FROM approval WHERE doc_type = 'PR' GROUP BY doc_id) a ON a.doc_id = p.pr_id
 WHERE p.status IN ('SUBMITTED','APPROVED','IN_SOURCING','ORDERED','CLOSED')
   AND a.n <> CASE WHEN p.total_estimated <= 20000 THEN 1 WHEN p.total_estimated <= 200000 THEN 2 ELSE 3 END;
IF @v > 0 THROW 50000, 'DATA-05 FAIL: BR-03 approval chain length', 1; PRINT 'PASS DATA-05 BR-03 chain length matches the amount';

-- BR-04: nobody approves their own PR
SELECT @v = COUNT(*) FROM approval a JOIN purchase_request p ON a.doc_type = 'PR' AND a.doc_id = p.pr_id WHERE a.approver_id = p.requester_id;
IF @v > 0 THROW 50000, 'DATA-06 FAIL: BR-04 self approval', 1; PRINT 'PASS DATA-06 BR-04 no self approval';

-- approver role matches the step's required role
SELECT @v = COUNT(*) FROM approval a JOIN app_user u ON u.user_id = a.approver_id WHERE u.role_code <> a.required_role;
IF @v > 0 THROW 50000, 'DATA-07 FAIL: approver does not hold the required role', 1; PRINT 'PASS DATA-07 approvers hold the required role';

-- BR-06: a winner that is not the lowest active quotation needs a reason of at least 20 characters
SELECT @v = COUNT(*) FROM award w JOIN quotation q ON q.quotation_id = w.quotation_id
 WHERE q.total_amount > (SELECT MIN(total_amount) FROM quotation WHERE rfq_id = w.rfq_id AND is_active = 1) AND LEN(ISNULL(w.reason, '')) < 20;
IF @v > 0 THROW 50000, 'DATA-08 FAIL: BR-06 non-lowest winner without reason', 1; PRINT 'PASS DATA-08 BR-06 reason present for non-lowest winners';

-- BR-02: each RFQ that was awarded had at least 3 active quotations
SELECT @v = COUNT(*) FROM rfq r WHERE r.status = 'AWARDED' AND (SELECT COUNT(*) FROM quotation WHERE rfq_id = r.rfq_id AND is_active = 1) < 3;
IF @v > 0 THROW 50000, 'DATA-09 FAIL: awarded RFQ with fewer than 3 active quotations', 1; PRINT 'PASS DATA-09 awarded RFQs have at least 3 active quotations';

-- no invitation or order to a suspended vendor
SELECT @v = (SELECT COUNT(*) FROM rfq_vendor rv JOIN vendor v ON v.vendor_id = rv.vendor_id WHERE v.status = 'SUSPENDED')
          + (SELECT COUNT(*) FROM purchase_order o JOIN vendor v ON v.vendor_id = o.vendor_id WHERE v.status = 'SUSPENDED');
IF @v > 0 THROW 50000, 'DATA-10 FAIL: suspended vendor invited or ordered from', 1; PRINT 'PASS DATA-10 suspended vendors are not used';

-- received quantity (net of rejects) never exceeds ordered quantity; PO status follows it
SELECT @v = COUNT(*) FROM po_item i WHERE (SELECT ISNULL(SUM(qty_received), 0) FROM gr_item g WHERE g.po_item_id = i.po_item_id) > i.quantity;
IF @v > 0 THROW 50000, 'DATA-11 FAIL: received more than ordered', 1; PRINT 'PASS DATA-11 received quantity within ordered quantity';

SELECT @v = COUNT(*) FROM purchase_order o
 WHERE o.status = 'RECEIVED' AND EXISTS (SELECT 1 FROM po_item i WHERE i.po_id = o.po_id AND i.quantity > (SELECT ISNULL(SUM(qty_received), 0) FROM gr_item g WHERE g.po_item_id = i.po_item_id));
IF @v > 0 THROW 50000, 'DATA-12 FAIL: PO marked RECEIVED but not fully received', 1; PRINT 'PASS DATA-12 RECEIVED POs are fully received';

-- document numbers follow the counter: doc_sequence.last_no is the highest number issued
SELECT @v = (SELECT COUNT(*) FROM doc_sequence WHERE doc_type = 'PR' AND last_no <> (SELECT COUNT(*) FROM purchase_request))
          + (SELECT COUNT(*) FROM doc_sequence WHERE doc_type = 'RFQ' AND last_no <> (SELECT COUNT(*) FROM rfq))
          + (SELECT COUNT(*) FROM doc_sequence WHERE doc_type = 'PO' AND last_no <> (SELECT COUNT(*) FROM purchase_order))
          + (SELECT COUNT(*) FROM doc_sequence WHERE doc_type = 'GR' AND last_no <> (SELECT COUNT(*) FROM goods_receipt));
IF @v > 0 THROW 50000, 'DATA-13 FAIL: doc_sequence does not match issued documents', 1; PRINT 'PASS DATA-13 document counters match issued documents';
GO
