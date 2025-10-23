## Overview

Customer-facing frontend powered by Next.js App Router, Tailwind CSS v4, TanStack Query/Form, and Zod.  
Design tokens are split into **primitive** (raw values) and **semantic** (usage-oriented) layers and exposed to Tailwind via CSS variables.

```
src/
├─ app/                      # Next.js routes
├─ design-system/
│  ├─ primitive/             # Raw tokens (colors, spacing, radius, etc.)
│  ├─ semantic/              # Mappings to usage contexts
│  └─ theme.css              # CSS variables + Tailwind @theme definitions
└─ ui/
   └─ atoms/                 # Baseline reusable UI components
```

## Local Development

```bash
npm install
npm run dev
```

The playground page at `/` demonstrates the current atom components with TanStack Form validation.

## Figma Token Sync (optional)

Tokens can be pulled from Figma variables using the Variables API. Copy `.env.local.example` to `.env.local`, fill the values, then run:

```bash
npm run tokens:pull
```

Environment variables supported (read from `.env.local` and `.env`):

```
# OAuth token (preferred – enables Variables API)
FIGMA_ACCESS_TOKEN=xxx

# or legacy PAT (limited, Variables API requires OAuth scope)
FIGMA_PERSONAL_ACCESS_TOKEN=xxx

FIGMA_FILE_KEY=yyyy
# Optional: FIGMA_VARIABLE_COLLECTION_ID=zzzz
```

The script writes the raw payload to `src/design-system/primitive/generated/figma-variables.json`.  
Map the values into the TypeScript primitive layer to keep the theme in sync.

### Local OAuth helper

When running locally, the callback endpoint `http://localhost:3000/api/figma/oauth/callback` exchanges the authorization code for tokens and echoes the JSON response.  
Configure `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`, and `FIGMA_REDIRECT_URI` (defaults to the URL above) in `.env.local`, then:

1. Open  
   ```
   https://www.figma.com/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Ffigma%2Foauth%2Fcallback&scope=file_variables%3Aread&state=figma-tokens&response_type=code
   ```
2. Approve access → you will be redirected back to the callback route and see the access / refresh tokens.
3. Copy the `access_token` into `FIGMA_ACCESS_TOKEN` and, if required, store the `refresh_token` securely for future refreshes.

### File snapshot (non-Enterprise fallback)

For plans without Variables API access, you can still capture the document, components, and styles using:

```bash
npm run figma:snapshot
```

This script calls regular Figma REST endpoints (document/components/styles) and saves the result to `src/design-system/primitive/generated/figma-file-snapshot.json`. Use it to inspect template structure or as a starting point for manual token extraction.

## Linting

```bash
npm run lint
```
