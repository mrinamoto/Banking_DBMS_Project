-- Read-only FreeSQL verification for the final Phase 3 schema.
SELECT table_name FROM user_tables WHERE table_name IN ('USERS','CUSTOMERS','BRANCHES','ACCOUNTS','LOANS','TRANSACTIONS','AUDIT_LOG','DEPOSIT_SCHEMES','DEPOSIT_CERTIFICATES','BENEFICIARIES','CUSTOMER_KYC') ORDER BY table_name;
SELECT object_name,object_type,status FROM user_objects WHERE object_name IN ('PKG_BANKING_OPERATIONS','PKG_LOAN_OPERATIONS','VW_ACCOUNT_STATEMENT','VW_DEPOSIT_CERTIFICATE_REMINDERS') ORDER BY object_type,object_name;
SELECT object_type,status,COUNT(*) object_count FROM user_objects GROUP BY object_type,status ORDER BY object_type,status;
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
SELECT scheme_code,scheme_type,annual_profit_rate,calculation_method,status FROM deposit_schemes ORDER BY scheme_code;
SELECT status,COUNT(*) certificate_count FROM deposit_certificates GROUP BY status ORDER BY status;
SELECT index_name FROM user_indexes WHERE index_name IN ('IDX_DEPOSIT_SCHEME_STATUS','IDX_CERTIFICATE_CUSTOMER_STATUS','IDX_CERTIFICATE_ACCOUNT','IDX_CERTIFICATE_MATURITY') ORDER BY index_name;
