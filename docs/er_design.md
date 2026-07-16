# Banking Database Management System
## ER Design Document

---

# Project Name

Banking Database Management System

---

# Purpose

This document defines the Entity Relationship (ER) design of the Banking Database Management System. It describes the main entities, relationships, cardinalities, business rules, and business flow before implementation in Oracle Database.

---

# Entities

## 1. CUSTOMERS

Stores customer information.

---

## 2. ACCOUNTS

Stores bank account information.

---

## 3. BRANCHES

Stores branch information.

---

## 4. EMPLOYEES

Stores employee information.

---

## 5. TRANSACTIONS

Stores all deposit, withdrawal, and transfer records.

---

## 6. LOANS

Stores customer loan information.

---

## 7. USERS

Stores login credentials for customers.

---

## 8. ACCOUNT_TYPES

Stores different account types.

Examples:

- Savings
- Current
- Student
- Fixed Deposit

---

# Relationships

## CUSTOMER → ACCOUNT

One customer can own multiple accounts.

Relationship:

CUSTOMERS (1) -------- (N) ACCOUNTS

---

## ACCOUNT → TRANSACTION

One account can have multiple transactions.

Relationship:

ACCOUNTS (1) -------- (N) TRANSACTIONS

---

## BRANCH → ACCOUNT

One branch manages multiple accounts.

Relationship:

BRANCHES (1) -------- (N) ACCOUNTS

---

## BRANCH → EMPLOYEE

One branch has multiple employees.

Relationship:

BRANCHES (1) -------- (N) EMPLOYEES

---

## ACCOUNT_TYPE → ACCOUNT

One account type can be used by many accounts.

Relationship:

ACCOUNT_TYPES (1) -------- (N) ACCOUNTS

---

## CUSTOMER → LOAN

One customer can apply for multiple loans.

Relationship:

CUSTOMERS (1) -------- (N) LOANS

---

## CUSTOMER → USER

Each customer has one login account.

Relationship:

CUSTOMERS (1) -------- (1) USERS

---

# Cardinality Summary

| Parent Entity | Child Entity | Cardinality |
|---------------|-------------|-------------|
| CUSTOMERS | ACCOUNTS | 1 : N |
| ACCOUNTS | TRANSACTIONS | 1 : N |
| BRANCHES | ACCOUNTS | 1 : N |
| BRANCHES | EMPLOYEES | 1 : N |
| ACCOUNT_TYPES | ACCOUNTS | 1 : N |
| CUSTOMERS | LOANS | 1 : N |
| CUSTOMERS | USERS | 1 : 1 |

---

# Business Rules

## Customer Rules

- Every customer must have a unique Customer ID.
- A customer can have one or more bank accounts.
- A customer may have multiple loans.
- A customer must register before opening an account.

---

## Account Rules

- Every account belongs to one customer.
- Every account belongs to one branch.
- Every account has one account type.
- Account balance cannot be negative.
- Closed accounts cannot perform transactions.

---

## Transaction Rules

- Every transaction belongs to one account.
- Transaction amount must be greater than zero.
- Every transaction stores its date and type.
- Transaction history cannot be deleted.

---

## Branch Rules

- Every branch has a unique Branch ID.
- One branch manages many accounts.
- One branch employs many employees.

---

## Employee Rules

- Every employee belongs to one branch.
- Every employee has a unique Employee ID.

---

## Loan Rules

- Only existing customers can apply for loans.
- Every loan belongs to one customer.
- Every loan has a status.

Loan Status:

- Pending
- Approved
- Rejected

---

## User Rules

- Every customer has one login account.
- Username must be unique.
- Password will be stored securely (hashed in real systems).

---

# Business Flow

## Customer Registration

Customer
↓
Register
↓
CUSTOMERS
↓
Create Login
↓
USERS

---

## Open Account

Customer
↓
Request Account
↓
Select Branch
↓
Select Account Type
↓
Create Account
↓
ACCOUNTS

---

## Deposit

Customer
↓
Deposit Money
↓
Balance Updated
↓
TRANSACTIONS Record Created

---

## Withdraw

Customer
↓
Withdraw Money
↓
Check Balance
↓
Balance Updated
↓
TRANSACTIONS Record Created

---

## Money Transfer

Sender Account
↓
Validate Balance
↓
Deduct Amount
↓
Add Amount
↓
Create Transaction Records

---

## Loan Process

Customer
↓
Apply Loan
↓
Review
↓
Approve / Reject
↓
LOANS Updated

---

# ER Diagram (Text Version)

CUSTOMERS
│
├──< ACCOUNTS
│       │
│       └──< TRANSACTIONS
│
├──< LOANS
│
└──── USERS

BRANCHES
│
├──< ACCOUNTS
│
└──< EMPLOYEES

ACCOUNT_TYPES
│
└──< ACCOUNTS

---

# Current Project Status

✅ Requirement Analysis Completed

✅ ER Design Completed

⬜ Database Schema Design

⬜ Oracle Table Creation

⬜ Constraints

⬜ Sample Data

⬜ Views

⬜ PL/SQL

⬜ Triggers

⬜ Testing

⬜ Documentation

---

Version: 1.0

Prepared By:
Md Iftekhar Alam Asif