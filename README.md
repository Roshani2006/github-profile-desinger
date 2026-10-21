# Profile Atelier

A private-by-default GitHub profile design studio. Build a tailored profile README and SVG suite, preview it live, and publish it to your GitHub profile repository.

## Run locally

1. Install dependencies with `npm install`.
2. Create a GitHub OAuth App with callback URL `http://localhost:3000/api/auth/callback/github`.
3. Copy `.env.example` to `.env.local` and set `GITHUB_ID`, `GITHUB_SECRET`, and a random `NEXTAUTH_SECRET`.
4. Start the app with `npm run dev`.

The app requests `read:user` and `repo` access. GitHub tokens are stored in the encrypted NextAuth JWT and are only read by server routes; they are never returned in the session or browser bundle. Publishing creates or updates a public repository under the authenticated account.

## Build

Run `npm run typecheck` and `npm run build` before deployment. Set `NEXTAUTH_URL` to the deployed origin and configure the matching GitHub OAuth callback URL.