# Editorial Content

Put new MDX files in the folder that matches the section:

- `content/photo/` for photo pieces
- `content/essays/` for essays
- `content/interviews/` for interviews

Each file should include frontmatter like this:

```yaml
---
title: "Your Title"
publishedAt: "2026-04-16"
type: "photo" # or "essay" or "interview"
status: "draft" # change to "published" when ready
description: "Optional short summary."
---
```

Preview locally by running:

```bash
npm run dev
```

Then open the section index or entry URL in the browser, for example:

- `/photo`
- `/essays`
- `/interviews`
- `/photo/your-slug`

Publishing is controlled by frontmatter:

- `status: "published"` means the entry appears in index pages and production builds
- anything else is treated as a draft

Image paths should point to files inside `public/`, using site-root paths in MDX:

- file on disk: `public/race-track.png`
- use in MDX: `![Alt text](/race-track.png)`

For nested files:

- file on disk: `public/images/my-photo.jpg`
- use in MDX: `![Alt text](/images/my-photo.jpg)`
