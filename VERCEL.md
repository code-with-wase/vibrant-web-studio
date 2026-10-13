# Vercel deployment

This app uses React, Vite and Tailwind with TanStack Start for secure server functions. It is not a static SPA: do not add a catch-all rewrite to index.html.

Import the repository into Vercel. The Vercel-specific Nitro preset is selected when VERCEL is set by Vercel; Lovable preview and publishing retain their existing target.


Add the deployed origin and /reset-password callback to the auth redirect allow-list. Vercel deployment and external credentials have not been verified by this change.