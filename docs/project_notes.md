# Banking Database Management System
## Project Notes

---

# Project Information

**Project Name:** Banking Database Management System

**Database:** Oracle Database 21c XE / Oracle Database Free

**Language:** SQL, PL/SQL

**Tool:** Oracle SQL Developer

**Version:** 1.0

---

# Project Objective

The objective of this project is to design and implement a Banking Database Management System using Oracle Database. The system will manage customers, bank accounts, branches, employees, transactions, loans, and user authentication while maintaining data integrity and supporting common banking operations.

---

# Project Scope

The system will support the following banking operations:

- Customer Registration
- Customer Information Management
- Account Opening
- Account Closing
- Deposit Money
- Withdraw Money
- Money Transfer
- Transaction History
- Branch Management
- Employee Management
- Loan Management
- User Login
- Banking Reports

---

# Modules

1. Customer Management
2. Account Management
3. Branch Management
4. Employee Management
5. Transaction Management
6. Loan Management
7. User Authentication

---

# Initial Database Tables

1. CUSTOMERS
2. ACCOUNTS
3. BRANCHES
4. EMPLOYEES
5. TRANSACTIONS
6. LOANS
7. USERS
8. ACCOUNT_TYPES

---

# Business Rules

### Customer

- One customer can have multiple bank accounts.
- Every customer must have a unique Customer ID.
- Every customer must provide a valid phone number.

### Account

- One account belongs to only one customer.
- Every account belongs to one branch.
- Balance cannot be negative.
- Every account has only one account type.

### Branch

- One branch can manage many accounts.
- One branch can have many employees.

### Employee

- One employee works in only one branch.

### Transaction

- One account can have many transactions.
- Every transaction belongs to one account.
- Every transaction records amount, date, and transaction type.

### Loan

- Only existing customers can apply for loans.
- One customer may have multiple loans.

---

# Future Features

- ATM Card Management
- Beneficiary Management
- Fixed Deposit
- Internet Banking
- Mobile Banking
- Audit Log
- SMS Notification

---

# Naming Convention

## Tables

- Use UPPERCASE
- Use plural names

Example:

CUSTOMERS
ACCOUNTS
TRANSACTIONS

## Columns

Use UPPERCASE with underscore.

Examples:

CUSTOMER_ID
ACCOUNT_ID
BRANCH_ID
FIRST_NAME
ACCOUNT_STATUS

---

# Development Workflow

Step 1
Requirement Analysis

✔ Completed

Step 2
ER Diagram

Pending

Step 3
Database Schema Design

Pending

Step 4
Oracle Table Creation

Pending

Step 5
Constraints

Pending

Step 6
Insert Sample Data

Pending

Step 7
Views

Pending

Step 8
PL/SQL Procedures

Pending

Step 9
Triggers

Pending

Step 10
Testing

Pending

Step 11
Documentation

Pending

---

# Project Status

Current Phase:
Requirement Analysis

Next Task:
Design the ER Diagram

Project Progress:
10%