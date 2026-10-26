# Deluxe Culture Store

React, Vite, Tailwind CSS, React Router Hash Routing, and the hosted DC Management Express API.

This repository remains connected to [Lovable](https://lovable.dev); its editor
project is available at
[Deluxe Culture Store](https://lovable.dev/projects/8a1e7518-03d4-4e1b-ab6a-0c3f1d368ffb).

## Development

Requires Node.js 20.19+ and npm.

```sh
npm ci
npm run dev
```

Set `VITE_API_URL` to change the hosted API base URL. The default is
`https://dc-management-nine.vercel.app`. This is a public API URL, not a secret;
admin authorization and privileged writes remain enforced by the backend.

## Validation and web deployment

```sh
npm test
npm run lint
npm run build
```

The Vite production output is `dist/`. `vercel.json` deploys that static output.
Hash-based routes (for example `/#/invoices`) work without server-side routing
or a frontend server function.

## Windows desktop packaging

In one terminal, start Vite with `npm run dev`; in another, run
`npm run desktop:dev`. For a Windows NSIS installer, run
`npm run desktop:dist` on Windows. The Electron shell is under [`winrap`](./winrap)
and uses a restricted renderer without Node integration or a preload bridge.
The generated installer is unsigned because no signing certificate is configured.

The packaged renderer has the origin `dcstore://app`. The hosted API must allow
that origin in its CORS policy, including preflight requests with the
`Authorization` and `Content-Type` headers. The development renderer uses
`http://127.0.0.1:5173`. This repository cannot change or verify the hosted
backend's CORS allowlist.
