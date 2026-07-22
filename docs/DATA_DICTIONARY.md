# Data Dictionary

`NN` means NOT NULL, `PK` primary key, `FK` foreign key, and `UQ` unique candidate key. Money uses `NUMBER(15,2)`.

## BRANCHES

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| BRANCH_ID | NUMBER | NN PK identity | identity | Internal ID, `1` |
| BRANCH_CODE | VARCHAR2(12) | NN UQ | — | Business code, `DHK-001` |
| BRANCH_NAME | VARCHAR2(100) | NN | — | Display name |
| CITY | VARCHAR2(50) | NN | — | City, `Dhaka` |
| ADDRESS | VARCHAR2(200) | NN | — | Postal address |
| PHONE | VARCHAR2(20) | nullable | — | Branch phone |
| SWIFT_CODE | VARCHAR2(20) | nullable | — | Fictional classroom code |
| STATUS | VARCHAR2(12) | NN check ACTIVE/INACTIVE | `ACTIVE` | Operational state |
| CREATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | Creation time |

## ACCOUNT_TYPES

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| ACCOUNT_TYPE_ID | NUMBER | NN PK identity | identity | Product ID |
| TYPE_NAME | VARCHAR2(40) | NN UQ | — | `Savings` |
| DESCRIPTION | VARCHAR2(200) | nullable | — | Product description |
| MIN_BALANCE | NUMBER(15,2) | NN, >= 0 | `0` | Required remaining balance |
| ANNUAL_INTEREST_RATE | NUMBER(5,2) | NN, 0–100 | `0` | Annual rate percent |
| STATUS | VARCHAR2(12) | NN ACTIVE/INACTIVE | `ACTIVE` | Product state |
| CREATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | Creation time |

## CUSTOMERS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| CUSTOMER_ID | NUMBER | NN PK identity | identity | Internal customer ID |
| FIRST_NAME | VARCHAR2(50) | NN | — | Given name |
| LAST_NAME | VARCHAR2(50) | NN | — | Family name |
| DATE_OF_BIRTH | DATE | NN | — | Birth date |
| GENDER | CHAR(1) | M/F/O or null | — | Optional gender code |
| PHONE | VARCHAR2(20) | NN UQ | — | Contact number |
| EMAIL | VARCHAR2(100) | UQ nullable | — | Email |
| NATIONAL_ID | VARCHAR2(30) | NN UQ | — | Candidate identity key |
| ADDRESS | VARCHAR2(200) | NN | — | Current address |
| OCCUPATION | VARCHAR2(100) | nullable | — | Occupation |
| ANNUAL_INCOME | NUMBER(15,2) | >= 0 | `0` | Declared annual income |
| MARITAL_STATUS | VARCHAR2(20) | nullable | — | Optional profile value |
| STATUS | VARCHAR2(12) | NN ACTIVE/BLOCKED | `ACTIVE` | Customer access state |
| CREATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | Registration time |
| UPDATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | Last profile update |

## EMPLOYEES

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| EMPLOYEE_ID | NUMBER | NN PK identity | identity | Staff ID |
| BRANCH_ID | NUMBER | NN FK BRANCHES | — | Assigned branch/scope |
| EMPLOYEE_CODE | VARCHAR2(20) | NN UQ | — | `EMP-001` |
| FIRST_NAME / LAST_NAME | VARCHAR2(50) | NN | — | Staff name |
| NATIONAL_ID | VARCHAR2(30) | NN UQ | — | Staff national ID |
| JOB_TITLE | VARCHAR2(100) | NN | — | Designation |
| EMAIL | VARCHAR2(100) | NN UQ | — | Staff email |
| PHONE | VARCHAR2(20) | nullable | — | Staff phone |
| SALARY | NUMBER(15,2) | NN > 0 | — | Monthly salary |
| HIRE_DATE | DATE | NN | `SYSDATE` | Employment start |
| STATUS | VARCHAR2(12) | NN ACTIVE/INACTIVE | `ACTIVE` | Employment state |
| CREATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | Creation time |

## USERS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| USER_ID | NUMBER | NN PK identity | identity | Application principal ID |
| CUSTOMER_ID | NUMBER | FK CUSTOMERS UQ nullable | — | Customer principal link |
| EMPLOYEE_ID | NUMBER | FK EMPLOYEES UQ nullable | — | Staff principal link |
| USERNAME | VARCHAR2(50) | NN UQ | — | Login name |
| PASSWORD_HASH | VARCHAR2(255) | NN | — | Salted `scrypt` string |
| ROLE | VARCHAR2(20) | NN ADMIN/MANAGER/EMPLOYEE/CUSTOMER | — | Authorization role |
| IS_ACTIVE | CHAR(1) | NN Y/N | `Y` | Login enabled flag |
| LAST_LOGIN | TIMESTAMP | nullable | — | Last successful login |
| FAILED_LOGIN_COUNT | NUMBER | NN >= 0 | `0` | Invalid-password count |
| CREATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | User creation time |

The principal check allows a customer link only for CUSTOMER, an employee link for MANAGER/EMPLOYEE, and no customer link for ADMIN.

## ACCOUNTS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| ACCOUNT_ID | NUMBER | NN PK identity | identity | Internal account ID |
| ACCOUNT_NUMBER | VARCHAR2(24) | NN UQ | generated | Human account number |
| CUSTOMER_ID | NUMBER | NN FK CUSTOMERS | — | Owner |
| BRANCH_ID | NUMBER | NN FK BRANCHES | — | Servicing branch |
| ACCOUNT_TYPE_ID | NUMBER | NN FK ACCOUNT_TYPES | — | Product/rules |
| BALANCE | NUMBER(15,2) | NN >= 0 | `0` | Ledger balance |
| CURRENCY | VARCHAR2(3) | NN BDT/USD/EUR | `BDT` | Currency code |
| STATUS | VARCHAR2(12) | NN ACTIVE/FROZEN/CLOSED | `ACTIVE` | Transaction state |
| OPEN_DATE | DATE | NN | `SYSDATE` | Opening date |
| CLOSE_DATE | DATE | nullable; required when CLOSED | — | Closing date |
| LAST_TRANSACTION_DATE | TIMESTAMP | nullable | — | Last financial activity |
| CREATED_AT | TIMESTAMP | NN | `SYSTIMESTAMP` | Row creation |

## TRANSACTIONS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| TRANSACTION_ID | NUMBER | NN PK identity | identity | Immutable ledger ID |
| ACCOUNT_ID | NUMBER | NN FK ACCOUNTS | — | Affected account |
| RELATED_ACCOUNT_ID | NUMBER | FK ACCOUNTS nullable | — | Transfer counterpart |
| TRANSACTION_TYPE | VARCHAR2(30) | NN allowed-type check | — | `TRANSFER_DEBIT` |
| AMOUNT | NUMBER(15,2) | NN > 0 | — | Operation amount |
| PREVIOUS_BALANCE | NUMBER(15,2) | NN >= 0 | — | Balance before |
| NEW_BALANCE | NUMBER(15,2) | NN >= 0 | — | Balance after |
| STATUS | VARCHAR2(12) | NN SUCCESS/REVERSED | `SUCCESS` | Ledger status |
| REFERENCE_NO | VARCHAR2(50) | NN UQ | generated | Receipt reference |
| DESCRIPTION | VARCHAR2(200) | nullable | — | Safe explanation |
| PROCESSED_BY | NUMBER | FK USERS nullable | — | Application user |
| TRANSACTION_DATE | TIMESTAMP | NN | `SYSTIMESTAMP` | Processing time |

## FUND_TRANSFERS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| TRANSFER_ID | NUMBER | NN PK identity | identity | Transfer ID |
| TRANSFER_REFERENCE | VARCHAR2(50) | NN UQ | generated | Shared transfer reference |
| FROM_ACCOUNT_ID / TO_ACCOUNT_ID | NUMBER | NN FK ACCOUNTS, must differ | — | Source/destination |
| AMOUNT | NUMBER(15,2) | NN > 0 | — | Single operational amount |
| DEBIT_TRANSACTION_ID | NUMBER | NN FK TRANSACTIONS UQ | — | Debit ledger link |
| CREDIT_TRANSACTION_ID | NUMBER | NN FK TRANSACTIONS UQ | — | Credit ledger link |
| INITIATED_BY | NUMBER | FK USERS nullable | — | Application user |
| TRANSFER_DATE | TIMESTAMP | NN | `SYSTIMESTAMP` | Transfer time |

## LOAN_TYPES

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| LOAN_TYPE_ID | NUMBER | NN PK identity | identity | Product ID |
| TYPE_NAME | VARCHAR2(60) | NN UQ | — | `Personal Loan` |
| MIN_AMOUNT / MAX_AMOUNT | NUMBER(15,2) | NN coherent positive range | — | Allowed principal range |
| ANNUAL_INTEREST_RATE | NUMBER(5,2) | NN 0–100 | — | Annual percentage |
| MIN_TERM_MONTHS / MAX_TERM_MONTHS | NUMBER | NN coherent positive range | — | Allowed duration |
| STATUS | VARCHAR2(12) | NN ACTIVE/INACTIVE | `ACTIVE` | Product state |

## LOANS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| LOAN_ID | NUMBER | NN PK identity | identity | Loan ID |
| LOAN_NUMBER | VARCHAR2(30) | NN UQ | generated | Human loan number |
| CUSTOMER_ID | NUMBER | NN FK CUSTOMERS | — | Borrower |
| LOAN_TYPE_ID | NUMBER | NN FK LOAN_TYPES | — | Product rule source |
| DISBURSEMENT_ACCOUNT_ID | NUMBER | NN FK ACCOUNTS | — | Owned credit account |
| REQUESTED_AMOUNT | NUMBER(15,2) | NN > 0 | — | Application amount |
| APPROVED_AMOUNT | NUMBER(15,2) | nullable, >0 and <= requested | — | Reviewer amount |
| INTEREST_RATE | NUMBER(5,2) | NN 0–100 | — | Snapshotted product rate |
| TERM_MONTHS | NUMBER | NN > 0 | — | Duration |
| MONTHLY_INSTALLMENT | NUMBER(15,2) | nullable | — | Oracle EMI |
| TOTAL_REPAYABLE | NUMBER(15,2) | nullable/state check | — | EMI × term |
| OUTSTANDING_BALANCE | NUMBER(15,2) | nullable/state check | — | Remaining repayment |
| STATUS | VARCHAR2(20) | NN status check | `PENDING` | Lifecycle state |
| REVIEWED_BY | NUMBER | FK EMPLOYEES nullable | — | Manager/reviewer |
| REVIEWED_AT | TIMESTAMP | nullable | — | Decision time |
| REJECTION_REASON | VARCHAR2(500) | required for REJECTED | — | Decision reason |
| APPLICATION_DATE | TIMESTAMP | NN | `SYSTIMESTAMP` | Submission time |
| START_DATE / END_DATE | DATE | nullable | — | Active loan dates |

## LOAN_PAYMENTS

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| PAYMENT_ID | NUMBER | NN PK identity | identity | Payment ID |
| LOAN_ID | NUMBER | NN FK LOANS | — | Repaid loan |
| ACCOUNT_ID | NUMBER | NN FK ACCOUNTS | — | Borrower-owned debit account |
| TRANSACTION_ID | NUMBER | NN FK TRANSACTIONS UQ | — | Ledger link |
| AMOUNT | NUMBER(15,2) | NN > 0 | — | Payment amount |
| PREVIOUS_OUTSTANDING | NUMBER(15,2) | NN > 0 | — | Loan balance before |
| NEW_OUTSTANDING | NUMBER(15,2) | NN >= 0 | — | Loan balance after |
| RECEIVED_BY | NUMBER | FK USERS nullable | — | Processing user |
| PAYMENT_DATE | TIMESTAMP | NN | `SYSTIMESTAMP` | Payment time |

## AUDIT_LOG

| Column | Oracle type | Null/key/constraint | Default | Meaning / example |
|---|---|---|---|---|
| AUDIT_ID | NUMBER | NN PK identity | identity | Audit ID |
| TABLE_NAME | VARCHAR2(50) | NN | — | Changed entity |
| RECORD_ID | NUMBER | nullable | — | Changed row ID |
| ACTION_NAME | VARCHAR2(30) | NN | — | `STATUS_CHANGE` |
| ACTION_BY | VARCHAR2(100) | NN | session user fallback | `manager1:7` client identifier |
| OLD_SUMMARY / NEW_SUMMARY | CLOB | nullable | — | Before/after summary |
| ACTION_DATE | TIMESTAMP | NN | `SYSTIMESTAMP` | Change time |
