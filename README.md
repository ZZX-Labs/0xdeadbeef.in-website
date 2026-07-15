

# https://0xdeadbeef.in

## Repository Architecture

The repository is intentionally organized as a static website rather than a
dynamic application. Every page can be opened independently while still sharing
a common visual language through reusable HTML components, JavaScript modules,
stylesheets, and design assets.

```
0xdeadbeef.in/
├── about/
├── bio/
├── blog/
├── consulting/
├── contact/
├── contracting/
├── coversheet/
├── credits/
├── cv/
├── home/
├── landing-page/
├── legal/
├── licenses/
├── mission/
├── motto/
├── philosophy/
├── portfolio/
├── principles/
├── projects/
├── research/
├── resume/
├── static/
├── tools/
├── ventures/
├── writing/
├── 404.html
├── index.html
├── nginx.conf
├── robots.txt
├── site.webmanifest
└── README.md
```

The majority of pages are ordinary static HTML documents. Dynamic behavior is
provided through small JavaScript modules rather than server-side rendering or
large frontend frameworks.

---

# Static Design Philosophy

Several architectural decisions guide the development of the repository.

- Static HTML first
- Progressive enhancement
- Minimal JavaScript
- No database
- No CMS
- No build framework
- No unnecessary dependencies
- Long-term maintainability
- Plaintext-first publishing
- Git-friendly organization
- Portable deployment
- Local assets whenever practical

The repository is designed so that decades from now it should still be possible
to clone the repository and immediately understand how everything works.

---

# Shared Components

Every page loads the same shared navigation and footer.

```
static/html/

    header.html

    footer.html
```

These components are loaded dynamically by

```
static/js/include.js
```

allowing navigation updates to propagate across the entire website without
editing every page individually.

Every page therefore follows approximately the same structure:

```html
<body>

<div data-include="/static/html/header.html"></div>

<main>

    ...

</main>

<div data-include="/static/html/footer.html"></div>

<script src="/static/js/include.js" defer></script>
<script src="/static/script.js" defer></script>

</body>
```

This dramatically reduces maintenance as the website grows.

---

# Static Assets

The shared asset hierarchy is intentionally centralized.

```
static/

    audio/
    fonts/
    html/
    images/
    js/

    colors.json

    styles.css

    script.js
```

Each directory serves a specific purpose.

## audio/

Background music, ambience, narration, and other sound assets.

## fonts/

Typography used throughout the site.

IBM Plex Mono serves as the primary typeface.

Additional locally hosted fonts may be included when appropriate.

## html/

Reusable HTML fragments.

These currently include:

- header.html
- footer.html

Future reusable fragments may include:

- notices
- dialogs
- publication metadata
- project cards

## images/

Site graphics including:

- branding
- photography
- artwork
- icons
- banners
- project imagery

## js/

Site JavaScript modules.

Examples include:

```
include.js

projects-manifest.js

blog.js

blog-post.js
```

Each module performs one specific task.

---

# Design System

The visual design is centralized into

```
static/colors.json
```

rather than scattering color values throughout CSS.

This allows the website to maintain one canonical color system for:

- backgrounds
- typography
- buttons
- borders
- charts
- status indicators
- Bitcoin colors
- cyber colors
- navigation
- code blocks
- focus outlines
- gradients
- shadows

The stylesheet references these values to ensure visual consistency across every
page.

Future themes may be generated directly from the color system without modifying
individual page layouts.

---

# CSS

The repository uses one primary stylesheet.

```
static/styles.css
```

The stylesheet provides:

- layout
- typography
- grids
- navigation
- cards
- buttons
- forms
- publication layouts
- project layouts
- responsive design
- accessibility styling
- print styling

Additional stylesheets may be introduced only when they substantially reduce
complexity.

---

# JavaScript

JavaScript is intentionally modular.

The current architecture consists of:

```
include.js
```

Loads shared HTML fragments.

```
script.js
```

Provides common website behavior.

```
projects-manifest.js
```

Builds the Projects and Portfolio pages from manifest data.

```
blog.js
```

Builds the blog archive from blog.json.

```
blog-post.js
```

Loads metadata.json and post.txt for each blog article and renders supported
plaintext formatting.

Each module has one clearly defined responsibility.

No frontend framework is required.

---

# Project Architecture

Projects are no longer hardcoded into HTML.

Instead they are generated from manifest files maintained by the companion
ZZX-Labs repository.

Each project category maintains its own manifest.

Example:

```
projects/

    ai/
        manifest.json

    bitcoin/
        manifest.json

    engineering/
        manifest.json

    hardware/
        manifest.json

    software/
        manifest.json

    web/
        manifest.json
```

Each manifest contains structured project records.

The website loads these manifests dynamically.

This architecture greatly reduces maintenance while making it possible to add,
remove, or modify projects without editing HTML pages.

---

# Master Project Manifest

The individual category manifests are combined into a single master file.

```
projects/

    manifest.json
```

The master manifest contains:

- schema version
- generation timestamp
- category listing
- project count
- complete project records

Pages such as

```
/projects/

/portfolio/
```

consume this master manifest rather than reading each category individually.

This minimizes network requests while simplifying client-side rendering.

---

# Project Tooling

Repository tooling automates project management.

Current tools include:

```
tools/

    add-featured-projects.py

    build-projects-manifest.py
```

These scripts provide automated workflows for creating project entries and
rebuilding the master manifest.

Future tooling will expand this automation further while maintaining compatibility
with existing manifest formats.

