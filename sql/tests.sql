-- Database tests for sql/schema.sql. Run on an empty database right after the schema:
--   sqlcmd -b -d <db> -i sql/tests.sql
-- Each "expect failure" block passes only when the statement is rejected by the database.
-- A failing test raises error 50000 and stops the run (-b).
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ---------- seed ----------
INSERT department (code, name_th) VALUES ('IT', N'ไอที'), ('OPS', N'ปฏิบัติการ');
INSERT app_user (department_id, full_name, email, role_code) VALUES
  (1, N'ผู้ขอซื้อ หนึ่ง', 'req1@example.test', 'REQUESTER'),
  (1, N'เจ้าหน้าที่จัดซื้อ', 'proc1@example.test', 'PROCUREMENT'),
  (1, N'ผู้รับของ', 'recv1@example.test', 'RECEIVER');
INSERT vendor (vendor_code, name_th, tax_id) VALUES
  ('V0001', N'ผู้ขาย ก', '0000000000001'),
  ('V0002', N'ผู้ขาย ข', '0000000000002'),
  ('V0003', N'ผู้ขาย ค', '0000000000003'),
  ('V0004', N'ผู้ขาย ง (ไม่ได้รับเชิญ)', '0000000000004');
INSERT purchase_request (pr_no, requester_id, department_id, title, justification, needed_by_date, total_estimated)
  VALUES ('PR-TEST-00001', 1, 1, N'ทดสอบ', N'ทดสอบ', '2030-01-01', 6000);
INSERT pr_item (pr_id, line_no, description, quantity, unit, est_unit_price) VALUES (1, 1, N'รายการ', 10, N'ชิ้น', 600);
INSERT rfq (rfq_no, pr_id, due_at, created_by) VALUES ('RFQ-TEST-00001', 1, '2030-01-01', 2);
INSERT rfq_vendor (rfq_id, vendor_id) VALUES (1, 1), (1, 2), (1, 3);
PRINT 'seed ok';
GO

-- ---------- BR-07: quotation only from an invited vendor (FK to rfq_vendor) ----------
BEGIN TRY
  INSERT quotation (rfq_id, vendor_id, total_amount, lead_time_days) VALUES (1, 4, 5000, 7);
  THROW 50000, 'FAIL BR-07: quotation from a vendor that was not invited was accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS BR-07 not-invited vendor rejected (error ' + CAST(ERROR_NUMBER() AS varchar) + ')';
END CATCH;
GO

-- ---------- BR-08: one active quotation per vendor per RFQ ----------
INSERT quotation (rfq_id, vendor_id, total_amount, lead_time_days, is_active) VALUES (1, 1, 5500, 7, 1);
BEGIN TRY
  INSERT quotation (rfq_id, vendor_id, total_amount, lead_time_days, is_active) VALUES (1, 1, 5400, 7, 1);
  THROW 50000, 'FAIL BR-08: second active quotation for the same vendor and RFQ was accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS BR-08 second active quotation rejected (error ' + CAST(ERROR_NUMBER() AS varchar) + ')';
END CATCH;
-- replacing: deactivate the old one, then the new active one is allowed (TC-24)
UPDATE quotation SET is_active = 0 WHERE rfq_id = 1 AND vendor_id = 1 AND is_active = 1;  -- by key, not by id: failed inserts above still consume identity values
INSERT quotation (rfq_id, vendor_id, total_amount, lead_time_days, is_active) VALUES (1, 1, 5400, 7, 1);
IF (SELECT COUNT(*) FROM quotation WHERE rfq_id = 1 AND vendor_id = 1 AND is_active = 1) <> 1
  THROW 50000, 'FAIL TC-24: expected exactly one active quotation after replacement', 1;
IF (SELECT COUNT(*) FROM quotation WHERE rfq_id = 1 AND vendor_id = 1) <> 2
  THROW 50000, 'FAIL TC-24: history of the replaced quotation was lost', 1;
PRINT 'PASS TC-24 replacement keeps history, one active';
GO

-- ---------- FR-11: vendor tax id unique ----------
BEGIN TRY
  INSERT vendor (vendor_code, name_th, tax_id) VALUES ('V0099', N'ซ้ำ', '0000000000001');
  THROW 50000, 'FAIL FR-11: duplicate tax id accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS FR-11 duplicate tax id rejected (error ' + CAST(ERROR_NUMBER() AS varchar) + ')';
END CATCH;
GO

-- ---------- CHECK constraints ----------
BEGIN TRY
  INSERT pr_item (pr_id, line_no, description, quantity, unit, est_unit_price) VALUES (1, 2, N'x', 0, N'ชิ้น', 1);
  THROW 50000, 'FAIL TC-03: quantity 0 accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS TC-03 quantity 0 rejected';
END CATCH;
BEGIN TRY
  INSERT app_user (department_id, full_name, email, role_code) VALUES (1, N'x', 'bad@example.test', 'SUPERUSER');
  THROW 50000, 'FAIL: invalid role_code accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS invalid role_code rejected';
END CATCH;
BEGIN TRY
  UPDATE purchase_request SET status = 'WHATEVER' WHERE pr_id = 1;
  THROW 50000, 'FAIL: invalid PR status accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS invalid PR status rejected';
END CATCH;
GO

-- ---------- approval: one row per (doc, step) ----------
INSERT approval (doc_type, doc_id, step_no, required_role) VALUES ('PR', 1, 1, 'DEPT_APPROVER');
BEGIN TRY
  INSERT approval (doc_type, doc_id, step_no, required_role) VALUES ('PR', 1, 1, 'DEPT_APPROVER');
  THROW 50000, 'FAIL: duplicate approval step accepted', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 50000 THROW;
  PRINT 'PASS duplicate approval step rejected';
END CATCH;
GO

-- ---------- optimistic lock: ROWVERSION changes on every update ----------
DECLARE @v1 BINARY(8) = (SELECT row_version FROM purchase_request WHERE pr_id = 1);
UPDATE purchase_request SET title = N'แก้ไข' WHERE pr_id = 1;
DECLARE @v2 BINARY(8) = (SELECT row_version FROM purchase_request WHERE pr_id = 1);
IF @v1 = @v2 THROW 50000, 'FAIL TC-04: row_version did not change after update', 1;
PRINT 'PASS TC-04 row_version changes on update';
GO

-- ---------- NFR-02 / TC-47: application account cannot UPDATE or DELETE audit_log ----------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'app_runtime')
  CREATE USER app_runtime WITHOUT LOGIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_log TO app_runtime;   -- broad grant; the DENY on PUBLIC must still win
INSERT audit_log (entity, entity_id, action, actor_id, detail) VALUES ('PR', 1, 'SUBMIT', 1, N'seed');
EXECUTE AS USER = 'app_runtime';
  BEGIN TRY
    INSERT audit_log (entity, entity_id, action, actor_id) VALUES ('PR', 1, 'APPROVE', 1);
    PRINT 'PASS TC-47 app account can INSERT audit rows';
  END TRY
  BEGIN CATCH
    REVERT;
    THROW 50000, 'FAIL TC-47: app account could not INSERT into audit_log', 1;
  END CATCH;
  BEGIN TRY
    UPDATE audit_log SET detail = N'tampered' WHERE audit_id = 1;
    REVERT;
    THROW 50000, 'FAIL TC-47: app account could UPDATE audit_log', 1;
  END TRY
  BEGIN CATCH
    IF ERROR_NUMBER() = 50000 THROW;
    PRINT 'PASS TC-47 UPDATE denied (error ' + CAST(ERROR_NUMBER() AS varchar) + ')';
  END CATCH;
  BEGIN TRY
    DELETE audit_log WHERE audit_id = 1;
    REVERT;
    THROW 50000, 'FAIL TC-47: app account could DELETE from audit_log', 1;
  END TRY
  BEGIN CATCH
    IF ERROR_NUMBER() = 50000 THROW;
    PRINT 'PASS TC-47 DELETE denied (error ' + CAST(ERROR_NUMBER() AS varchar) + ')';
  END CATCH;
REVERT;
GO

-- ---------- FR-14: document numbering, single session ----------
DECLARE @a VARCHAR(20), @b VARCHAR(20), @c VARCHAR(20), @y VARCHAR(4) = CAST(YEAR(SYSUTCDATETIME()) AS VARCHAR(4));
EXEC usp_next_doc_no 'RFQ', @a OUTPUT;
EXEC usp_next_doc_no 'RFQ', @b OUTPUT;
EXEC usp_next_doc_no 'PO',  @c OUTPUT;
DECLARE @rfq1 VARCHAR(20) = CONCAT('RFQ-', @y, '-00001');
IF @a <> @rfq1 THROW 50000, 'FAIL FR-14: first RFQ number has the wrong format or value', 1;
IF @b <> CONCAT('RFQ-', @y, '-00002') THROW 50000, 'FAIL FR-14: second RFQ number is not sequential', 1;
IF @c <> CONCAT('PO-', @y, '-00001') THROW 50000, 'FAIL FR-14: PO sequence is not independent of RFQ', 1;
PRINT 'PASS FR-14 format PREFIX-YYYY-NNNNN, sequential, independent per document type';
GO

-- table used by the concurrency test (run separately, see tests/db/RESULTS.md)
CREATE TABLE numtest (doc_no VARCHAR(20) NOT NULL);
GO
PRINT 'DB TESTS DONE';
GO
