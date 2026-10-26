# Vercel deployment

This is a static React + Vite application. Vercel installs with `npm ci`, runs
`npm run build`, and publishes `dist/` as configured in `vercel.json`. Hash
routes (for example `/#/invoices`) are handled by React Router in the browser;
no server rewrite or Nitro function is required.

Set `VITE_API_URL` to the hosted DC Management Express API URL when it differs
from the default. Configure that backend to allow the deployed site's origin
and its `Authorization` and `Content-Type` preflight headers. Deployment and
the external backend's CORS settings must be verified in their respective
hosting accounts.
