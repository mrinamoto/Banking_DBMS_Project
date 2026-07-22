# Viva Questions and Simple Answers

1. What is a primary key? A unique, non-null row identifier.
2. What is a foreign key? A constraint linking a child value to a parent key.
3. Candidate key? Any minimal column set that can uniquely identify a row.
4. Why unique branch codes? They are stable human business identifiers.
5. Why checks? They reject invalid status, amount, rate, and range values at the database.
6. Why defaults? They give consistent initial status and timestamps.
7. What is 1NF? Atomic columns with no repeating groups.
8. What is 2NF? 1NF plus no partial dependency on a composite key.
9. What is 3NF? 2NF plus no non-key dependency on another non-key attribute.
10. Why separate account types? Product rules are not duplicated in every account.
11. Why separate loan payments? One loan has many historical repayments.
12. Why `FUND_TRANSFERS`? It links two accounts and their paired ledger entries.
13. Inner join? Returns rows matching on both sides.
14. Left join? Keeps every left row even without a match.
15. Aggregate? A summary such as COUNT, SUM, or AVG.
16. GROUP BY? Forms groups for aggregate calculation.
17. HAVING? Filters groups after aggregation.
18. Nested subquery? A query used inside another query.
19. Correlated subquery? It refers to the current outer row.
20. View? A stored query presenting reusable, restricted data.
21. Index? A structure that speeds reads with storage/write cost.
22. Procedure? Named PL/SQL operation that need not return a value.
23. Function? PL/SQL routine returning a value usable in SQL.
24. Package? A public specification and body grouping related routines/state.
25. Trigger? Code fired automatically by a database event.
26. Why few triggers? Hidden logic can conflict; packages are clearer for workflows.
27. ACID atomicity? All transfer steps succeed or none do.
28. Consistency? Constraints and package rules preserve valid state.
29. Isolation? Row locks protect concurrent balance decisions.
30. Durability? Committed Oracle changes survive failure.
31. COMMIT? Makes the current transaction permanent.
32. ROLLBACK? Undoes uncommitted changes.
33. SAVEPOINT? Marks a point for partial rollback inside a transaction.
34. Why `FOR UPDATE`? It locks rows used to decide and change balances.
35. Deadlock reduction? Lock both transfer accounts in ID order.
36. Who commits? Express after a complete package call.
37. SQL injection defense? Bind variables, never concatenate user values.
38. Password storage? Salted Node `scrypt` hashes, not plaintext.
39. Authentication vs authorization? Identity proof versus permission decision.
40. Customer ownership? The authenticated customer ID scopes queries and transfer source.
41. Manager scope? Their employee branch ID limits branch data.
42. Generic login errors? They do not reveal whether a username exists.
43. EMI formula? `P*r*(1+r)^n / ((1+r)^n-1)` with monthly rate.
44. Zero-interest EMI? Principal divided by months avoids division by zero.
45. Loan approval rule? Pending once, authorized reviewer, amount ≤ request.
46. Overpayment rule? Payment cannot exceed outstanding balance.
47. Why balance snapshots? Receipts/audits show exact before-and-after state.
48. Why no deletes? Financial history must remain traceable.
49. Audit log? Records entity, record, action, actor, time, old/new summary.
50. Biggest limitation? Oracle runtime, four-role E2E, and visual viewport evidence remain local verification tasks; the project is not claimed ready until those pass.
