<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1iSY1-SzZoHLWR8KIX7ENwg1UDUUc_3KX

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy

Two deployment options are provided: Vercel (recommended) and GitHub Pages (CI).

- Vercel (quick, automatic previews):

   - Connect the repository to Vercel via https://vercel.com/import.
   - Vercel reads `vercel.json` and will run `npm run build` and publish the `dist/` folder.
   - Or deploy from your machine with the Vercel CLI:

```bash
npx vercel login
npm run deploy
```

- GitHub Pages (via GitHub Actions):

   - A workflow is included at `.github/workflows/deploy.yml` that builds and publishes `dist/` on pushes to `main`.
   - Ensure GitHub Pages is enabled for the repository (Pages -> Deployment source uses GitHub Actions).

Environment notes:

- For Vercel CLI deployment, you can set `VERCEL_TOKEN` as an environment variable and run `npx vercel --token $VERCEL_TOKEN --prod`.
- The project uses `dist/` as the static output; both Vercel and the GH Actions workflow publish that folder.

### Firebase Hosting (alternative)

1. Create a CI token locally:

```bash
npm i -g firebase-tools
firebase login:ci
```

2. In your GitHub repo, add a secret named `FIREBASE_TOKEN` with the token value from `firebase login:ci`.

3. Deploy from CI (workflow is included) or locally:

```bash
npm run build-and-deploy:firebase
# or
npx firebase deploy --only hosting --token $FIREBASE_TOKEN
```

Files added:

- `firebase.json` — hosts `dist/` and rewrites all routes to `index.html`.
- `.firebaserc` — default project id.
- `.firebaseignore` — ignores node_modules and other files.

