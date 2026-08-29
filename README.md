# International Mirrors

A research site for integrity, inheritance, provenance, and containment in experimental societies of AI agents.

## 🚀 Live Site

[https://internationalmirrors.com](https://internationalmirrors.com)

## Research focus

- Stigmergic propagation through persistent artifacts and modified environments
- Provenance and causal attribution across agent–artifact lineages
- Latent composition and integrity across transformation
- Sealed-simulation evaluation and containment
- Public FIL/SARAI framing without disclosing proprietary or unfiled mechanisms
- Dated research notes, beginning with SwarmWorld (29 August 2026)

The former spy-simulation site is preserved at `archive/spy-simulation/`.

## Development setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

```bash
# Install dependencies
npm install
```

### Development Commands

```bash
# Start local development server (with live reload)
npm run dev

# Format all files with Prettier
npm run format

# Lint HTML files
npm run lint:html

# Lint CSS files
npm run lint:css

# Build for production (minified assets)
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Project structure

```
internationalmirrors/
├── index.html                         # Research-first landing page
├── styles.css                         # Shared visual system
├── notes/                             # Dated research notes
├── archive/
│   └── spy-simulation/                # Preserved former site
├── scripts/build.mjs                  # Static production build
├── CNAME                              # Custom domain
└── .github/workflows/deploy.yml       # GitHub Pages deployment
```

## Tech stack

- Pure semantic HTML and CSS (no framework)
- Live Server for development
- Prettier for code formatting
- HTMLHint & Stylelint for linting
- GitHub Pages for hosting

## Deployment

The site is built into `dist/` and automatically deployed to GitHub Pages when changes reach `main`.

```bash
npm run deploy
```

Production deployment requires push access to `PaoloTCS/internationalmirrors.com`; do not push this redesign until the cutover is approved.

## 📝 License

MIT

## 👤 Author

Paolo Pignatelli
