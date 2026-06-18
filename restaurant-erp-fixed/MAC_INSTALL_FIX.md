# Mac install fix

If npm tries to download from `packages.applied-caas-gateway1.internal.api.openai.org`, the package lock files were generated in the build environment and should not be used on your Mac.

This ZIP removes those lock files and pins npm to the public registry.

From the project root, run:

```bash
npm config set registry https://registry.npmjs.org/
npm cache clean --force
rm -rf node_modules backend/node_modules frontend/node_modules
rm -f package-lock.json backend/package-lock.json frontend/package-lock.json
npm install
npm run install:all
```

Then continue with:

```bash
cd backend
cp .env.example .env
cd ..
npm run seed
npm run dev
```
