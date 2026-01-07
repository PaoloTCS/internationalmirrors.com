# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

International Mirrors is a spy-themed simulation game website featuring AI-generated espionage scenarios. It's a pure HTML/CSS/JavaScript static site (no framework) hosted on GitHub Pages with a humorous, tongue-in-cheek spy theme.

**Live Site**: https://internationalmirrors.com

## Architecture

### Project Structure

This is a static website with inline styles and scripts. All HTML files are self-contained with embedded CSS and JavaScript:

- `index.html` - Main landing page with email subscription form, FAQ, and equipment ratings
- `recruitment-techniques.html` - Humorous spy recruitment guide
- `unfriendly-interrogation.html` - Satirical interrogation survival guide
- `privacy-policy.html` - Privacy policy page
- `OLD_Index.html` - Backup/archive of previous version

**No separate CSS or JS files** - all styling and scripts are embedded directly in the HTML files using `<style>` and `<script>` tags.

### Key Patterns

- **Inline everything**: CSS in `<style>` tags, JavaScript in `<script>` tags within each HTML file
- **No build step for development**: HTML files are served directly
- **Form handling**: Forms are present but submission logic is in inline scripts (check `<script>` sections in HTML files)
- **Theme consistency**: Uses consistent color palette (`#2c3e50`, `#3498db`, `#2980b9`) and highlight boxes across all pages

## Development Commands

### Start Development Server

```bash
npm run dev
```

Starts live-server on port 8080 with auto-reload. Opens to `index.html` by default.

### Code Quality

```bash
# Format all HTML, CSS, JS, JSON, and MD files with Prettier
npm run format

# Check formatting without making changes
npm run format -- --check

# Lint HTML files (uses HTMLHint with .htmlhintrc config)
npm run lint:html

# Lint inline CSS (uses Stylelint with .stylelintrc.json config)
npm run lint:css
```

### Build & Deploy

```bash
# Build production-ready minified assets (creates dist/ folder)
npm run build

# Deploy to GitHub Pages manually
npm run deploy
```

**Note**: Automatic deployment occurs on push to `main` branch via GitHub Actions (`.github/workflows/deploy.yml`). Manual deployment via `npm run deploy` uses the `gh-pages` package.

## Code Style & Formatting

### Prettier Configuration (`.prettierrc`)

- **Semi-colons**: Required
- **Quotes**: Double quotes
- **Line length**: 100 characters
- **Indentation**: 2 spaces (no tabs)

### HTML Linting (`.htmlhintrc`)

Key rules enforced:

- Lowercase tag and attribute names
- Double-quoted attribute values
- DOCTYPE must be first
- Unique IDs
- Title required

### CSS Linting (`.stylelintrc.json`)

- Extends `stylelint-config-standard`
- Short hex colors preferred
- Descending specificity warnings disabled (common with inline styles)

### VS Code Integration

The `.vscode/settings.json` configures:

- Format on save (enabled)
- Default formatter: Prettier
- Live Server port: 8080

## Testing Before Commits

When making changes, run this sequence:

```bash
# 1. Test locally
npm run dev

# 2. Format code
npm run format

# 3. Lint HTML and CSS
npm run lint:html
npm run lint:css
```

The GitHub Actions workflow runs format and lint checks automatically, but they're set to `|| true` (non-blocking) to allow deployment even with warnings.

## Content & Theme Guidelines

- **Tone**: Humorous, self-aware spy/espionage theme with satirical edge
- **References**: The site acknowledges it was created with AI assistance (specifically Claude)
- **Highlight boxes**: Use `.highlight` class (yellow background) for important/humorous callouts
- **Warning highlights**: Use `.warning-highlight` class for inline emphasis
- **Gradient dividers**: Use `.gradient-divider` class for visual separation
- **Links**: Internal navigation between recruitment-techniques.html, unfriendly-interrogation.html, and back to index

## Deployment Information

- **Hosting**: GitHub Pages
- **Custom Domain**: internationalmirrors.com (configured via CNAME file)
- **Auto-deploy**: Push to `main` branch triggers `.github/workflows/deploy.yml`
- **Node version in CI**: 18
- **Manual deploy**: `npm run deploy` (uses gh-pages package)

## Dependencies

All dependencies are dev dependencies (this is a static site):

- `live-server` - Local development server
- `prettier` - Code formatting
- `htmlhint` - HTML linting
- `stylelint` + `stylelint-config-standard` - CSS linting
- `clean-css-cli` + `html-minifier` - Production build tools
- `gh-pages` - Manual deployment helper

## Working with Forms

Both forms in `index.html` (email subscription and message forms) have inline JavaScript handlers. Check the `<script>` section at the bottom of `index.html` for form submission logic.

## Repository

- **GitHub**: https://github.com/PaoloTCS/internationalmirrors.com.git
- **Main branch**: `main`
- **License**: MIT
- **Author**: Paolo Pignatelli
