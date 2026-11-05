# Deployment checklist

1. Provision MongoDB Atlas or managed MongoDB and restrict network access.
2. Deploy the Express API with `NODE_ENV=production`, `MONGODB_URI`, a unique 32+ character `JWT_SECRET`, `CLIENT_URL`, and SMTP configuration if adding email delivery.
3. Build the client with `VITE_API_URL=https://your-api.example.com/api` and deploy `client/dist` to a static host.
4. Configure HTTPS, backups, monitoring, secret rotation, persistent private file storage and restrictive CORS.
5. Create the first admin using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` with `npm run seed:admin`.

Do not commit `.env` or real credentials. Verify `/api/health` and role permissions after deployment.