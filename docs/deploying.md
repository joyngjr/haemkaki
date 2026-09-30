# Deploying

Vercel builds `main` and gives every pull request its own preview URL.
`vercel.json` disables deployments for other branches and rewrites all routes to
`index.html`, so the app survives a refresh on any path. The backend deploys
separately to Railway.
