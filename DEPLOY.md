# GitHub Pages Deployment Guide

This project is configured for automatic deployment to GitHub Pages.

## Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages when you push to the `main` branch.

### Setup Steps:

1. **Push the code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/jamalxcode/cube.git
   git push -u origin main
   ```

2. **Enable GitHub Pages in repository settings:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: Select **GitHub Actions**
   - Save the settings

3. **Wait for deployment:**
   - The workflow will automatically run on push
   - Check the **Actions** tab to monitor progress
   - Once complete, your site will be live at: `https://jamalxcode.github.io/cube/`

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Install dependencies
pnpm install

# Build and deploy
pnpm run deploy
```

This will build the project with the correct base path and push to the `gh-pages` branch.

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

The dev server runs without the `/cube/` base path for easier local development.

## Key Configuration Changes for GitHub Pages

1. **Hash-based routing**: Uses `#` in URLs (e.g., `https://jamalxcode.github.io/cube/#/`) to work with GitHub Pages
2. **Base path**: Configured as `/cube/` in production builds
3. **Static-only build**: Removes server dependencies for GitHub Pages compatibility
4. **.nojekyll file**: Ensures Vite's build artifacts are served correctly

## Troubleshooting

- **404 errors**: Make sure GitHub Pages is set to use **GitHub Actions** as the source
- **Blank page**: Check browser console for base path issues
- **Build failures**: Review the Actions tab for error logs
