# Banking Database Management System
## Database Schema Design

Version: 1.0

---

# 1. CUSTOMERS

Description:
Stores customer information.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| CUSTOMER_ID | NUMBER | Primary Key |
| FIRST_NAME | VARCHAR2(50) | NOT NULL |
| LAST_NAME | VARCHAR2(50) | NOT NULL |
| DATE_OF_BIRTH | DATE | NOT NULL |
| GENDER | CHAR(1) | CHECK ('M','F','O') |
| PHONE | VARCHAR2(15) | UNIQUE |
| EMAIL | VARCHAR2(100) | UNIQUE |
| NATIONAL_ID | VARCHAR2(20) | UNIQUE |
| ADDRESS | VARCHAR2(200) | NOT NULL |
| CREATED_AT | DATE | DEFAULT SYSDATE |

---

# 2. BRANCHES

Description:
Stores branch information.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| BRANCH_ID | NUMBER | Primary Key |
| BRANCH_NAME | VARCHAR2(100) | NOT NULL |
| CITY | VARCHAR2(50) | NOT NULL |
| ADDRESS | VARCHAR2(200) | NOT NULL |
| PHONE | VARCHAR2(15) | UNIQUE |

---

# 3. ACCOUNT_TYPES

Description:
Stores available account types.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| ACCOUNT_TYPE_ID | NUMBER | Primary Key |
| TYPE_NAME | VARCHAR2(30) | UNIQUE |
| MIN_BALANCE | NUMBER(12,2) | CHECK (MIN_BALANCE >= 0) |

---

# 4. ACCOUNTS

Description:
Stores bank account information.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| ACCOUNT_ID | NUMBER | Primary Key |
| ACCOUNT_NUMBER | VARCHAR2(20) | UNIQUE |
| CUSTOMER_ID | NUMBER | Foreign Key |
| BRANCH_ID | NUMBER | Foreign Key |
| ACCOUNT_TYPE_ID | NUMBER | Foreign Key |
| BALANCE | NUMBER(12,2) | CHECK (BALANCE >= 0) |
| STATUS | VARCHAR2(20) | CHECK ('ACTIVE','INACTIVE','CLOSED') |
| OPEN_DATE | DATE | DEFAULT SYSDATE |

---

# 5. EMPLOYEES

Description:
Stores employee information.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| EMPLOYEE_ID | NUMBER | Primary Key |
| BRANCH_ID | NUMBER | Foreign Key |
| FIRST_NAME | VARCHAR2(50) | NOT NULL |
| LAST_NAME | VARCHAR2(50) | NOT NULL |
| POSITION | VARCHAR2(50) | NOT NULL |
| SALARY | NUMBER(10,2) | CHECK (SALARY > 0) |
| HIRE_DATE | DATE | DEFAULT SYSDATE |

---

# 6. TRANSACTIONS

Description:
Stores all banking transactions.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| TRANSACTION_ID | NUMBER | Primary Key |
| ACCOUNT_ID | NUMBER | Foreign Key |
| TRANSACTION_TYPE | VARCHAR2(20) | CHECK ('DEPOSIT','WITHDRAW','TRANSFER') |
| AMOUNT | NUMBER(12,2) | CHECK (AMOUNT > 0) |
| TRANSACTION_DATE | DATE | DEFAULT SYSDATE |
| DESCRIPTION | VARCHAR2(200) | NULL |

---

# 7. LOANS

Description:
Stores customer loans.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| LOAN_ID | NUMBER | Primary Key |
| CUSTOMER_ID | NUMBER | Foreign Key |
| LOAN_AMOUNT | NUMBER(12,2) | CHECK (LOAN_AMOUNT > 0) |
| INTEREST_RATE | NUMBER(5,2) | CHECK (INTEREST_RATE >= 0) |
| STATUS | VARCHAR2(20) | CHECK ('PENDING','APPROVED','REJECTED') |
| APPLY_DATE | DATE | DEFAULT SYSDATE |

---

# 8. USERS

Description:
Stores login information.

| Column Name | Data Type | Constraint |
|-------------|-----------|------------|
| USER_ID | NUMBER | Primary Key |
| CUSTOMER_ID | NUMBER | Foreign Key UNIQUE |
| USERNAME | VARCHAR2(50) | UNIQUE |
| PASSWORD_HASH | VARCHAR2(255) | NOT NULL |
| ROLE | VARCHAR2(20) | CHECK ('CUSTOMER','ADMIN') |
| CREATED_AT | DATE | DEFAULT SYSDATE |

---

# Foreign Key Relationships

CUSTOMERS
    |
    +---- ACCOUNTS

CUSTOMERS
    |
    +---- LOANS

CUSTOMERS
    |
    +---- USERS

BRANCHES
    |
    +---- ACCOUNTS

BRANCHES
    |
    +---- EMPLOYEES

ACCOUNT_TYPES
    |
    +---- ACCOUNTS

ACCOUNTS
    |
    +---- TRANSACTIONS