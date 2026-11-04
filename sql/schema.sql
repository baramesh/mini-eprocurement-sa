-- Mini e-Procurement : Microsoft SQL Server (T-SQL) schema
-- Column comments use the form  "-- description"  and feed the generated data dictionary
-- (docs/03a-data-dictionary.md). Keep one column per line.

-- Filtered indexes require these session options. sqlcmd defaults QUOTED_IDENTIFIER to OFF, so set them explicitly.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE department (
    department_id   INT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสหน่วยงาน
    code            VARCHAR(10)   NOT NULL UNIQUE,          -- รหัสย่อหน่วยงาน
    name_th         NVARCHAR(100) NOT NULL,                 -- ชื่อหน่วยงาน
    is_active       BIT           NOT NULL DEFAULT 1        -- สถานะใช้งาน
);

CREATE TABLE app_user (
    user_id         INT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสผู้ใช้
    department_id   INT           NOT NULL REFERENCES department(department_id), -- หน่วยงานสังกัด
    full_name       NVARCHAR(150) NOT NULL,                 -- ชื่อ-นามสกุล
    email           VARCHAR(150)  NOT NULL UNIQUE,          -- อีเมลที่ตรงกับ SSO
    role_code       VARCHAR(20)   NOT NULL
        CHECK (role_code IN ('REQUESTER','DEPT_APPROVER','PROCUREMENT','PROCUREMENT_HEAD','COMMITTEE','RECEIVER','ADMIN')), -- บทบาท
    is_active       BIT           NOT NULL DEFAULT 1        -- สถานะใช้งาน
);

CREATE TABLE vendor (
    vendor_id       INT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสผู้ขาย
    vendor_code     VARCHAR(15)   NOT NULL UNIQUE,          -- รหัสผู้ขายที่ระบบออก
    name_th         NVARCHAR(200) NOT NULL,                 -- ชื่อผู้ขาย
    tax_id          CHAR(13)      NOT NULL UNIQUE,          -- เลขประจำตัวผู้เสียภาษี 13 หลัก
    email           VARCHAR(150)  NULL,                     -- อีเมลติดต่อ
    status          VARCHAR(10)   NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','SUSPENDED')),           -- สถานะ (SUSPENDED เชิญหรือออก PO ไม่ได้)
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME() -- เวลาสร้าง (UTC)
);

CREATE TABLE doc_sequence (
    doc_type        VARCHAR(3)    NOT NULL,                 -- ชนิดเอกสาร PR RFQ PO GR
    doc_year        SMALLINT      NOT NULL,                 -- ปี ค.ศ.
    last_no         INT           NOT NULL DEFAULT 0,       -- เลขลำดับล่าสุดที่ออก
    CONSTRAINT pk_doc_sequence PRIMARY KEY (doc_type, doc_year)
);

CREATE TABLE purchase_request (
    pr_id           BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสใบขอซื้อ
    pr_no           VARCHAR(20)   NOT NULL UNIQUE,          -- เลขที่ PR รูปแบบ PR-YYYY-NNNNN
    requester_id    INT           NOT NULL REFERENCES app_user(user_id), -- ผู้ขอซื้อ
    department_id   INT           NOT NULL REFERENCES department(department_id), -- หน่วยงานผู้ขอ
    title           NVARCHAR(200) NOT NULL,                 -- หัวข้อ
    justification   NVARCHAR(1000) NOT NULL,                -- เหตุผลความจำเป็น
    needed_by_date  DATE          NOT NULL,                 -- วันที่ต้องการใช้
    total_estimated DECIMAL(14,2) NOT NULL DEFAULT 0,       -- วงเงินรวมประมาณการ (บาท)
    status          VARCHAR(15)   NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','IN_SOURCING','ORDERED','CLOSED','CANCELLED')), -- สถานะ
    row_version     ROWVERSION    NOT NULL,                 -- ตัวตรวจการแก้ไขซ้อน (optimistic lock)
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(), -- เวลาสร้าง (UTC)
    submitted_at    DATETIME2(0)  NULL                      -- เวลาส่งอนุมัติ (UTC)
);

CREATE TABLE pr_item (
    pr_item_id      BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสรายการ
    pr_id           BIGINT        NOT NULL REFERENCES purchase_request(pr_id), -- ใบขอซื้อ
    line_no         SMALLINT      NOT NULL,                 -- ลำดับบรรทัด
    description     NVARCHAR(300) NOT NULL,                 -- รายการสินค้าหรือบริการ
    quantity        DECIMAL(12,3) NOT NULL CHECK (quantity > 0), -- จำนวน
    unit            NVARCHAR(30)  NOT NULL,                 -- หน่วยนับ
    est_unit_price  DECIMAL(14,2) NOT NULL CHECK (est_unit_price >= 0), -- ราคาต่อหน่วยประมาณการ
    CONSTRAINT uq_pr_item_line UNIQUE (pr_id, line_no)
);

CREATE TABLE approval (
    approval_id     BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสงานอนุมัติ
    doc_type        VARCHAR(5)    NOT NULL CHECK (doc_type IN ('PR','AWARD')), -- ชนิดงาน (PR หรือผลเลือกผู้ชนะ)
    doc_id          BIGINT        NOT NULL,                 -- รหัสเอกสาร (pr_id หรือ rfq_id ตามชนิด)
    step_no         TINYINT       NOT NULL,                 -- ขั้นอนุมัติ เริ่มที่ 1
    required_role   VARCHAR(20)   NOT NULL,                 -- บทบาทที่ต้องอนุมัติในขั้นนี้
    approver_id     INT           NULL REFERENCES app_user(user_id), -- ผู้ตัดสินจริง
    decision        VARCHAR(10)   NOT NULL DEFAULT 'PENDING'
        CHECK (decision IN ('PENDING','APPROVED','REJECTED')), -- ผลการตัดสิน
    comment         NVARCHAR(500) NULL,                     -- ความเห็นหรือเหตุผลปฏิเสธ
    decided_at      DATETIME2(0)  NULL,                     -- เวลาตัดสิน (UTC)
    CONSTRAINT uq_approval_step UNIQUE (doc_type, doc_id, step_no)
);

CREATE TABLE rfq (
    rfq_id          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัส RFQ
    rfq_no          VARCHAR(20)   NOT NULL UNIQUE,          -- เลขที่ RFQ รูปแบบ RFQ-YYYY-NNNNN
    pr_id           BIGINT        NOT NULL REFERENCES purchase_request(pr_id), -- ใบขอซื้อต้นทาง
    status          VARCHAR(15)   NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN','AWARD_PENDING','AWARDED')), -- สถานะ
    due_at          DATETIME2(0)  NOT NULL,                 -- เวลาปิดรับใบเสนอราคา (UTC)
    created_by      INT           NOT NULL REFERENCES app_user(user_id), -- ผู้สร้าง
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME() -- เวลาสร้าง (UTC)
);

CREATE TABLE rfq_vendor (
    rfq_id          BIGINT        NOT NULL REFERENCES rfq(rfq_id), -- RFQ
    vendor_id       INT           NOT NULL REFERENCES vendor(vendor_id), -- ผู้ขายที่ได้รับเชิญ
    invited_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(), -- เวลาเชิญ (UTC)
    CONSTRAINT pk_rfq_vendor PRIMARY KEY (rfq_id, vendor_id)
);

CREATE TABLE quotation (
    quotation_id    BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสใบเสนอราคา
    rfq_id          BIGINT        NOT NULL,                 -- RFQ
    vendor_id       INT           NOT NULL,                 -- ผู้ขาย
    total_amount    DECIMAL(14,2) NOT NULL,                 -- ราคารวม (บาท)
    lead_time_days  SMALLINT      NOT NULL CHECK (lead_time_days >= 0), -- ระยะเวลาส่งมอบ (วัน)
    is_active       BIT           NOT NULL DEFAULT 1,       -- ฉบับที่ใช้งาน (ฉบับเก่าถูกแทนที่เป็น 0)
    submitted_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(), -- เวลาบันทึก (UTC)
    CONSTRAINT fk_quotation_invited FOREIGN KEY (rfq_id, vendor_id) REFERENCES rfq_vendor(rfq_id, vendor_id)
);
-- หนึ่งผู้ขายมีใบเสนอราคาที่ใช้งานได้ 1 ฉบับต่อ RFQ (BR-08)
CREATE UNIQUE INDEX ux_quotation_active ON quotation (rfq_id, vendor_id) WHERE is_active = 1;

CREATE TABLE quotation_item (
    quotation_item_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสรายการเสนอราคา
    quotation_id    BIGINT        NOT NULL REFERENCES quotation(quotation_id), -- ใบเสนอราคา
    pr_item_id      BIGINT        NOT NULL REFERENCES pr_item(pr_item_id), -- รายการ PR ที่เสนอ
    unit_price      DECIMAL(14,2) NOT NULL CHECK (unit_price >= 0), -- ราคาต่อหน่วยที่เสนอ
    CONSTRAINT uq_quotation_item UNIQUE (quotation_id, pr_item_id)
);

CREATE TABLE award (
    rfq_id          BIGINT        NOT NULL PRIMARY KEY REFERENCES rfq(rfq_id), -- RFQ ที่เลือกผู้ชนะ
    quotation_id    BIGINT        NOT NULL REFERENCES quotation(quotation_id), -- ใบเสนอราคาที่ชนะ
    reason          NVARCHAR(500) NULL,                     -- เหตุผล (บังคับเมื่อไม่ใช่ราคาต่ำสุด)
    awarded_by      INT           NOT NULL REFERENCES app_user(user_id), -- ผู้เสนอผล
    awarded_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME() -- เวลาเสนอผล (UTC)
);

CREATE TABLE purchase_order (
    po_id           BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสใบสั่งซื้อ
    po_no           VARCHAR(20)   NOT NULL UNIQUE,          -- เลขที่ PO รูปแบบ PO-YYYY-NNNNN
    pr_id           BIGINT        NOT NULL REFERENCES purchase_request(pr_id), -- ใบขอซื้อต้นทาง
    rfq_id          BIGINT        NULL REFERENCES rfq(rfq_id), -- RFQ (ว่างเมื่อซื้อตรง)
    vendor_id       INT           NOT NULL REFERENCES vendor(vendor_id), -- ผู้ขาย
    total_amount    DECIMAL(14,2) NOT NULL,                 -- มูลค่ารวม (บาท)
    status          VARCHAR(18)   NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','ISSUED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')), -- สถานะ
    issued_at       DATETIME2(0)  NULL,                     -- เวลาออก PO (UTC)
    created_by      INT           NOT NULL REFERENCES app_user(user_id) -- ผู้สร้าง
);

CREATE TABLE po_item (
    po_item_id      BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสรายการสั่งซื้อ
    po_id           BIGINT        NOT NULL REFERENCES purchase_order(po_id), -- ใบสั่งซื้อ
    pr_item_id      BIGINT        NOT NULL REFERENCES pr_item(pr_item_id), -- รายการ PR ต้นทาง
    quantity        DECIMAL(12,3) NOT NULL CHECK (quantity > 0), -- จำนวนที่สั่ง
    unit_price      DECIMAL(14,2) NOT NULL CHECK (unit_price >= 0), -- ราคาต่อหน่วย
    CONSTRAINT uq_po_item UNIQUE (po_id, pr_item_id)
);

CREATE TABLE goods_receipt (
    gr_id           BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสใบรับของ
    gr_no           VARCHAR(20)   NOT NULL UNIQUE,          -- เลขที่ GR รูปแบบ GR-YYYY-NNNNN
    po_id           BIGINT        NOT NULL REFERENCES purchase_order(po_id), -- ใบสั่งซื้อ
    received_by     INT           NOT NULL REFERENCES app_user(user_id), -- ผู้รับของ
    received_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(), -- เวลารับของ (UTC)
    note            NVARCHAR(500) NULL                      -- หมายเหตุ
);

CREATE TABLE gr_item (
    gr_item_id      BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสรายการรับของ
    gr_id           BIGINT        NOT NULL REFERENCES goods_receipt(gr_id), -- ใบรับของ
    po_item_id      BIGINT        NOT NULL REFERENCES po_item(po_item_id), -- รายการสั่งซื้อ
    qty_received    DECIMAL(12,3) NOT NULL CHECK (qty_received >= 0), -- จำนวนรับ
    qty_rejected    DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (qty_rejected >= 0), -- จำนวนปฏิเสธ (ไม่นับเป็นรับ)
    CONSTRAINT uq_gr_item UNIQUE (gr_id, po_item_id)
);

CREATE TABLE audit_log (
    audit_id        BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, -- รหัสบันทึก
    entity          VARCHAR(30)   NOT NULL,                 -- ชนิดเอกสาร เช่น PR RFQ PO
    entity_id       BIGINT        NOT NULL,                 -- รหัสเอกสาร
    action          VARCHAR(30)   NOT NULL,                 -- การกระทำ เช่น SUBMIT APPROVE REJECT
    actor_id        INT           NOT NULL REFERENCES app_user(user_id), -- ผู้กระทำ
    detail          NVARCHAR(1000) NULL,                    -- รายละเอียดก่อน-หลัง
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME() -- เวลา (UTC)
);

-- Supporting indexes
CREATE INDEX ix_pr_status_created   ON purchase_request (status, created_at DESC) INCLUDE (pr_no, department_id, total_estimated);
CREATE INDEX ix_pr_requester        ON purchase_request (requester_id, created_at DESC);
CREATE INDEX ix_approval_pending    ON approval (required_role, decision) INCLUDE (doc_type, doc_id, step_no);
CREATE INDEX ix_audit_entity        ON audit_log (entity, entity_id, created_at);
GO

-- Atomic document numbering (FR-14, NFR-04): one row lock per (type, year)
CREATE PROCEDURE usp_next_doc_no
    @doc_type VARCHAR(3),
    @doc_no   VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @y SMALLINT = YEAR(SYSUTCDATETIME()), @n INT;
    BEGIN TRAN;
    MERGE doc_sequence WITH (HOLDLOCK) AS t
    USING (SELECT @doc_type AS doc_type, @y AS doc_year) AS s
       ON t.doc_type = s.doc_type AND t.doc_year = s.doc_year
    WHEN NOT MATCHED THEN INSERT (doc_type, doc_year, last_no) VALUES (s.doc_type, s.doc_year, 0);
    UPDATE doc_sequence SET @n = last_no = last_no + 1 WHERE doc_type = @doc_type AND doc_year = @y;
    COMMIT;
    SET @doc_no = CONCAT(@doc_type, '-', @y, '-', RIGHT(CONCAT('00000', @n), 5));
END;
GO

-- audit_log is append-only for the application account (NFR-02)
DENY UPDATE, DELETE ON audit_log TO PUBLIC;
GO
