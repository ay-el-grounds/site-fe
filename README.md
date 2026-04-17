# Aluminum Grounds Site

Public-facing website for Aluminum Grounds, built with Next.js.

The repo currently supports:

- a card-based homepage and project pages
- an editorial publishing system for essays, interviews, and photo stories
- lightweight interactive/community components
- newsletter signup through Airtable
- dynamic Open Graph image generation
- a small audio API for the site jukebox

## Stack

- Next.js 15
- React 19
- MDX for editorial content
- CSS Modules for page and component styling
- `gray-matter` for frontmatter parsing
- SVGR for importing SVGs as React components
- Vercel for deployment

## Local Development

Recommended Node version:

```bash
nvm use 22.22.0
```

Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm run build
npm run start
npm run lint
```

## Repository Shape

### Main App Routes

- `src/app/page.js`
  Homepage
- `src/app/read/page.tsx`
  Main editorial landing page
- `src/app/essays/page.tsx`
  Essays index
- `src/app/interviews/page.tsx`
  Interviews index
- `src/app/photo/page.tsx`
  Photo index
- `src/app/(editorial)/[type]/[slug]/page.tsx`
  Editorial detail pages
- `src/app/backlog/page.js`
- `src/app/clutch/page.js`
- `src/app/caracter/page.js`
- `src/app/third-place/page.js`

### Core Styling Files

- `src/app/globals.css`
  Shared design tokens and global defaults
- `src/app/page.module.css`
  Homepage-specific composition and some older shared styles
- `src/app/(editorial)/editorial.module.css`
  Editorial index/detail styling
- `src/app/(editorial)/section-page.module.css`
  Shared page shell for editorial index/detail routes
- `src/app/read/page.module.css`
  Read landing page composition
- `src/app/third-place/page.module.css`
  Wider presentation-style page for the Third Place project

### Shared Components

- `src/components/Navigation.js`
- `src/components/Community.js`
- `src/components/EmailSub.js`
- `src/components/FinePrint.js`
- `src/components/EditorialIndex.tsx`
- `src/components/ShareArticleActions.jsx`
- `src/components/Radio.js`
- `src/components/HoverBuy.js`
- `src/components/HoverCollab.js`

There are also feature-specific components for things like:

- `AG`
- `DirectoryTable`
- `GoogleCharts`
- `ThirdPlaceActions`

## Editorial System

Editorial content lives in:

- `content/essays/`
- `content/interviews/`
- `content/photo/`

Each piece is an `.mdx` file with frontmatter parsed by:

- `src/lib/mdx.ts`
- `src/mdx-components.tsx`

Editorial indices and article pages are rendered through:

- `src/components/EditorialIndex.tsx`
- `src/app/(editorial)/[type]/[slug]/page.tsx`

Publishing rules:

- `status: "published"` appears in editorial indexes and production content flows
- any other value is treated as draft-like and filtered from normal published indexes

Important build note:

- keep the three editorial content directories in the repo even when they are empty
- the MDX import layer expects those folders to exist at build time
- `.gitkeep` files are included for that reason

See [content/README.md](/Users/brian/Documents/01-ag/website/site-fe/content/README.md:1) for the content authoring guide and frontmatter example.

## Styling Philosophy

The current styling approach is built around a shared token layer in `src/app/globals.css`:

- semantic color variables
- spacing scale
- radius scale
- typography tokens
- motion/elevation tokens
- shared reading measures

Page and component CSS modules then compose those tokens into:

- standard centered site-frame pages
- wider presentation-frame pages like `third-place`
- quieter editorial reading surfaces

In practice:

- reusable visual language belongs in `globals.css`
- page composition stays in route-level CSS modules
- truly shared UI gets its own component CSS module

## API Routes

- `src/app/api/saveEmail/route.js`
  Saves newsletter signups to Airtable via environment variables
- `src/app/api/og/route.js`
  Generates simple dynamic Open Graph images
- `src/app/api/songs/route.js`
  Reads the `public/songs` directory and returns available `.mp3` filenames

### Environment Variables

The newsletter endpoint expects:

- `AIRTABLE_BASE_ID`
- `AIRTABLE_ACCESS_TOKEN`
- `AIRTABLE_USER_TABLE`

Without those, signup requests will return a server configuration error.

## Assets

The repo includes public assets in:

- `public/SVG/`
- `public/songs/`
- assorted images and gifs in `public/`

These support logos, editorial imagery, social/community visuals, and the jukebox/audio features.

## MDX and Next.js Configuration

`next.config.mjs` currently enables:

- MDX page extensions
- `remark-frontmatter`
- SVG loading through `@svgr/webpack`

## Farcaster Frame Notes

The repo contains early frame-related code:

- `src/lib/frame.js`
- `src/components/FrameInit.jsx`

At the moment this looks more like groundwork than a fully active feature:

- `FrameInit` is currently commented out in `src/app/layout.js`
- frame metadata is present in `layout.js`

So it is fair to think of frame support as experimental/in-progress rather than a core active product surface.

## Deployment

The site is intended to deploy on Vercel.

Before deploying:

```bash
nvm use 22.22.0
npm install
npm run build
```

Also verify:

- editorial content directories still exist
- required Airtable environment variables are configured if newsletter signup is expected to work

## Maintenance Notes

- If you change tokens in `globals.css`, review homepage, read/editorial pages, and `third-place` together.
- If you change the editorial file structure, review `src/lib/mdx.ts` and the content directories at the same time.
- If you remove content files, leave the section directories in place so production builds do not break.
- The main branch currently deploys directly, so changes there should be treated as production-facing.
