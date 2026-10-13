<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep TanStack Start routing and server functions alongside React/Vite/Tailwind because secure admin operations require the existing server boundary.
- Keep admin permissions in user_roles and verify them before privileged account creation; ordinary shop access uses role-scoped RLS.
- Invoice writes and stock changes use transactional database functions so edits and cancellation cannot desynchronize inventory.
- Use a shared authenticated workspace with named section URLs; public sign-in and recovery remain outside the gate.
- Select the Vercel Nitro target only on Vercel to preserve Lovable's preview and publishing target.
- Shop data and admin login currently live in browser storage (src/lib/local-db.ts) because the owner asked for frontend-only until they connect a backend.

- Reuse the shared shop logo asset in login and workspace branding, and derive public browser icons from it so the identity remains consistent.
