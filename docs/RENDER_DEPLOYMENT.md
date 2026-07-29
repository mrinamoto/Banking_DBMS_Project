# Render Deployment

Deploy only the Express backend to Render.

## Steps

1. Push the repository to GitHub.
2. Open Render and create a new Web Service.
3. Connect the GitHub repository.
4. Set Root Directory to `server`.
5. Set Build Command to `npm install`.
6. Set Start Command to `npm start`.
7. Choose a free instance type if available.
8. Add environment variables:

```env
NODE_ENV=production
PORT=10000
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
DB_USER=BANK_APP
DB_PASSWORD=your_oracle_cloud_password
DB_CONNECT_STRING=your_oracle_cloud_connection_string
DB_POOL_MIN=1
DB_POOL_MAX=5
SESSION_SECRET=random_32_plus_character_secret
```

9. Deploy the service.
10. Open `https://your-render-service.onrender.com/api/health`.

## Oracle Wallet Note

If your Autonomous Database requires mTLS, upload the wallet securely as Render secret files and set `TNS_ADMIN` to that folder. If mTLS is disabled, use the cloud connection string directly.

## Troubleshooting

- `503 database disconnected`: check `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, wallet, and database allowlist settings.
- Browser CORS error: set `CLIENT_ORIGIN` to the exact Vercel URL.
- Login fails for all users: run `npm run seed:demo-users -- YourPassword123` after installing the database schema.

## Screenshot Placeholders

- `Optional evidence screenshot (if captured): Render web service settings`
- `Optional evidence screenshot (if captured): Render environment variables`
- `Optional evidence screenshot (if captured): Render deploy logs`
- `Optional evidence screenshot (if captured): /api/health response`
