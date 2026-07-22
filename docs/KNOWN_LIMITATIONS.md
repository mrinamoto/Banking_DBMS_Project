# Known Limitations

1. Oracle installer/package compilation has not run in this Codex environment.
2. The 33 logical acceptance areas (34 printed checks because update/delete protection are separate) await Oracle output.
3. Four-role credential-backed tests and screenshots are pending.
4. Responsive Tailwind code builds, but desktop/tablet/mobile browser evidence is pending.
5. Logout removes local browser state but cannot revoke a copied token before its eight-hour expiry.
6. Tokens are stored in browser local storage for classroom simplicity; production banking would prefer hardened secure cookies and revocation/rotation.
7. Failed login count is recorded but automatic lockout/rate limiting is not implemented.
8. The system uses one currency per account and does not perform foreign exchange.
9. Reversal is documented but not implemented; transaction update/delete is blocked.
10. Charts, exports, notifications, cards, beneficiaries, real payment networks, OTP/SMS, and mobile applications are outside the implemented scope.
11. This is an academic simulation and must not handle real funds or identities.
