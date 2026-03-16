# Blokos

Design System as Catalog — create, publish, and consume component registries with AI skills built-in.

Blokos lets you define a typed component catalog (Zod schemas), distribute components via CLI (like shadcn — source code copied, zero runtime), and auto-generate Claude Code skills so AI knows exactly how to use your components.

## Quick Start

### For Design System Authors

```bash
# Initialize a registry
npx blokos init

# Create components
npx blokos create hero-section
npx blokos create blog-card

# Edit the generated files:
#   components/hero-section/schema.ts   — Zod props schema
#   components/hero-section/hero-section.tsx — React component
#   components/hero-section/meta.json   — metadata, examples, dependencies

# Publish registry + AI skill
npx blokos publish
```

This generates:
- `registry.json` — component index with JSON Schemas
- `skill/blokos-skill.md` — Claude Code skill auto-generated from your catalog

Push to GitHub (public or private) and consumers can install your components.

### For Consumers

```bash
# Connect to a registry
npx blokos connect https://github.com/your-org/your-design-system

# List available components
npx blokos list

# Install a component (copies source code to your project)
npx blokos add hero-section

# Install all components
npx blokos add --all
```

When you install components:
- Source code is copied to your project (default: `components/ui/`)
- npm dependencies are installed automatically
- A Claude Code skill is generated at `.claude/skills/` so AI uses your components correctly

## How It Works

```
Author                          Consumer
┌──────────────┐               ┌──────────────┐
│ blokos init  │               │blokos connect│
│ blokos create│               │ blokos add   │
│blokos publish│──registry──▶  │ blokos list  │
└──────────────┘   .json       └──────────────┘
       │                              │
       ▼                              ▼
  registry.json              components/ui/*.tsx
  skill/blokos-skill.md      .claude/skills/*.md
```

**No runtime dependency.** Components are plain source code. Delete blokos after setup and everything still works.

## CLI Reference

| Command | Role | Description |
|---------|------|-------------|
| `blokos init` | Author | Initialize a component registry |
| `blokos create <name>` | Author | Scaffold a new component (TSX + Zod schema + metadata) |
| `blokos publish` | Author | Build registry.json and generate AI skill |
| `blokos connect <url>` | Consumer | Connect project to a registry |
| `blokos add <name>` | Consumer | Install a component from the registry |
| `blokos add --all` | Consumer | Install all components |
| `blokos list` | Consumer | List available vs installed components |

## Component Structure

Each component in a registry has three files:

```
components/hero-section/
├── hero-section.tsx    # React component
├── schema.ts           # Zod schema with .describe() on each prop
└── meta.json           # name, description, category, dependencies, examples
```

The schema defines the contract:

```typescript
import { z } from 'zod'

export const heroSectionSchema = z.object({
  title: z.string().describe('Main headline'),
  description: z.string().describe('Supporting text'),
  ctaText: z.string().describe('Call to action button text'),
  ctaLink: z.string().describe('CTA destination URL'),
})
```

## AI Skill Generation

`blokos publish` auto-generates a Claude Code skill that:
- Lists all components with their props, types, and descriptions
- Includes usage examples from `meta.json`
- Enforces rules: only use catalog components, follow prop types, output native TSX
- Merges custom composition rules from `skill-overrides.md` if present

## Private Registries

For private GitHub repos, provide a token:

```bash
npx blokos connect https://github.com/your-org/private-ds --token ghp_your_token
```

The token is stored in `.env.local` and used for all fetches.

## License

MIT
