# Vercel deployment

This app uses React, Vite and Tailwind with TanStack Start for secure server functions. It is not a static SPA: do not add a catch-all rewrite to index.html.

Import the repository into Vercel. The Vercel-specific Nitro preset is selected when VERCEL is set by Vercel; Lovable preview and publishing retain their existing target.

Configure the public VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY using your project's available public configuration. Server functionality also requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and a securely provisioned SUPABASE_SERVICE_ROLE_KEY. Lovable Cloud does not expose its privileged key for export, so externally hosted admin creation requires a separately provisioned backend/server credential arrangement. Never put privileged credentials in VITE_ variables.

Add the deployed origin and /reset-password callback to the auth redirect allow-list. Vercel deployment and external credentials have not been verified by this change.