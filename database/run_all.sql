WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
@sql/01_create_tables.sql
@sql/02_constraints.sql
@sql/05_indexes.sql
@sql/07_functions.sql
@sql/11_packages.sql
@sql/08_procedures.sql
@sql/04_views.sql
@sql/10_triggers.sql
@sql/03_insert_sample_data.sql
PROMPT Smart Banking schema installed. Review USER_ERRORS before granting privileges.
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
