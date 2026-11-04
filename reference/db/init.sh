#!/bin/bash
# One-shot database initialisation: creates the database, applies sql/schema.sql and sql/seed-data.sql, creates the app account.
set -e
Q="/opt/mssql-tools18/bin/sqlcmd -C -S db -U sa -P ${SA_PASSWORD} -f 65001 -b"
$Q -Q "IF DB_ID('eproc') IS NULL CREATE DATABASE eproc"
HAVE=$($Q -h -1 -W -d eproc -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables WHERE name='app_user'" | tr -d '[:space:]')
if [ "$HAVE" = "0" ]; then
  $Q -d eproc -i /sql/schema.sql
  $Q -d eproc -i /sql/seed-data.sql
  $Q -d eproc -v APP_PASSWORD="${APP_PASSWORD}" -i /db/app-user.sql
fi
echo "database ready"
