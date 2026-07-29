# Vercel Deployment

Deploy only the React Vite frontend to Vercel.

## Steps

1. Push the repository to GitHub.
2. Open Vercel and click Add New Project.
3. Import the GitHub repository.
4. Set Root Directory to `client`.
5. Keep Framework Preset as Vite.
6. Set Build Command to `npm run build`.
7. Set Output Directory to `dist`.
8. Add Environment Variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

9. Click Deploy.
10. Open the deployed URL and visit `/login`.

## Verification

- Login page loads.
- Signup switches smoothly.
- Login calls the Render backend.
- Dashboard loads after a valid JWT is saved.

## Screenshot Placeholders

- `Optional evidence screenshot (if captured): Vercel import project`
- `Optional evidence screenshot (if captured): Vercel root directory set to client`
- `Optional evidence screenshot (if captured): Vercel VITE_API_URL variable`
- `Optional evidence screenshot (if captured): deployed login page`
