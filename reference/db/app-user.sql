-- Application account: reads and writes data, executes procedures, cannot change audit_log
-- (sql/schema.sql denies UPDATE and DELETE on audit_log to PUBLIC).
CREATE LOGIN app WITH PASSWORD = '$(APP_PASSWORD)', CHECK_POLICY = OFF;
GO
USE eproc;
CREATE USER app FOR LOGIN app;
ALTER ROLE db_datareader ADD MEMBER app;
ALTER ROLE db_datawriter ADD MEMBER app;
GRANT EXECUTE TO app;
GO
