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

- Keep the frontend as React + Vite with React Router Hash Routing; shop data and admin authentication go through `src/lib/api.ts` to the hosted DC Management Express API.
- Keep admin authorization, account creation, invoice writes, and stock changes enforced by the hosted backend; never move privileged operations or secrets into the frontend.
- Keep the shared authenticated workspace and its named section URLs; public sign-in remains outside the authenticated route loader.
- Keep Vercel deployment static (`dist`) and use npm; do not reintroduce TanStack Start or Nitro.
- Keep Electron Builder configuration and the hardened Electron main process in `winrap`; the packaged app origin is `dcstore://app` and must be allowlisted by the hosted API's CORS policy.

- Reuse the shared shop logo asset in login and workspace branding, and derive public browser icons from it so the identity remains consistent.

- Portal motion is CSS-only and disabled for reduced-motion preferences and print; keep animations short and avoid layout shifts during shop tasks.
