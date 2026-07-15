

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


---

# Blog Architecture

The repository contains a complete static publishing system.

Unlike traditional blogging platforms, posts are stored as ordinary files inside
the repository.

No database is required.

No server-side rendering is required.

No CMS is required.

Every post remains independently readable.

---

## Directory Layout

```
blog/

    blog.json

    index.html

    blog_posts/

        post_template/

        post_0001/

        post_0002/

        post_0003/
```

Every post resides within its own directory.

For example:

```
blog/blog_posts/post_0001/

    index.html

    metadata.json

    post.txt
```

Additional publication formats may exist alongside the canonical plaintext
article.

Examples include:

```
post.md

post.pdf

post.epub

post.docx

signature.asc
```

The rendering system automatically advertises these files only when they exist.

---

# blog.json

The master publication index is

```
blog/blog.json
```

This file contains every published article.

Typical fields include:

- post number
- slug
- title
- subtitle
- summary
- publication date
- update date
- author
- category
- tags
- publication status
- URLs
- metadata location
- plaintext location

The blog archive loads this manifest to build the publication listing.

---

# metadata.json

Each post directory contains

```
metadata.json
```

This file contains publication metadata specific to the article.

Typical metadata includes:

- title
- subtitle
- summary
- revision
- publication timestamps
- category
- tags
- license
- copyright
- cryptographic hashes
- signatures
- source repository
- canonical URLs

The metadata remains separate from the article body.

---

# post.txt

Every article is authored in

```
post.txt
```

This plaintext document is considered the canonical publication.

The renderer transforms supported formatting into HTML while preserving the
original source document.

Keeping the canonical publication as plaintext provides:

- maximum portability
- long-term preservation
- easy version control
- minimal tooling
- straightforward verification
- human readability

---

# Plaintext Renderer

The renderer currently supports:

```
# Heading

## Heading

### Heading
```

unordered lists

```
- item
```

ordered lists

```
1. item
```

block quotations

```
> quotation
```

inline code

```
`code`
```

code fences

````text
```text
example
```
`````

horizontal rules

```
---
```

Markdown-style links

```
[text](url)
```

bold

```
**bold**
```

italic

```
*italic*
```

strikethrough

```
~~removed~~
```

Additional formatting may be added over time while preserving compatibility with
existing articles.

---

# Automatic Blog Generation

The archive page does not contain hardcoded articles.

Instead it loads

```
blog.json
```

and automatically builds:

* article cards
* publication dates
* categories
* tags
* search index
* filter buttons

Adding a new article requires only:

1. Create the post directory.
2. Write metadata.json.
3. Write post.txt.
4. Add one record to blog.json.

The archive updates automatically.

---

# Search

The blog includes client-side search.

Search currently indexes:

* title
* subtitle
* summary
* category
* author
* tags
* publication metadata

No external indexing service is required.

No user data leaves the browser.

---

# Publication Workflow

The recommended workflow is:

```
Create post directory

↓

Write post.txt

↓

Create metadata.json

↓

Preview locally

↓

Add record to blog.json

↓

Commit

↓

Push

↓

Deploy
```

Future tooling will automate most of this workflow.

---

# Future Blog Tooling

The repository is expected to gain additional helper utilities including:

```
tools/

    add-blog-post.py

    build-blog.py

    export-blog.py

    verify-blog.py

    publish-blog.py
```

These utilities will automate:

* directory creation
* numbering
* metadata generation
* publication records
* cryptographic hashes
* OpenPGP signatures
* manifest rebuilding
* validation

---

# Repository Tooling

The repository intentionally keeps tooling small, portable, and dependency-light.

Current tooling includes:

```
tools/

    add-featured-projects.py

    build-projects-manifest.py
```

Both scripts are documented independently within

```
tools/README.md
```

---

# build-projects-manifest.py

This utility combines every individual project manifest into one master
manifest.

It scans category manifests including:

```
adult/

ai/

apps/

bitcoin/

cyber-investigation/

cyber-security/

cyber-warfare/

engineering/

firmware/

hardware/

ml/

osint/

software/

web/
```

The resulting output is

```
projects/manifest.json
```

This master manifest is consumed by:

```
/projects/

/portfolio/
```

---

# add-featured-projects.py

This tool standardizes project creation.

Rather than manually editing JSON, it prompts for project information and inserts
properly formatted entries into the correct category manifest.

Typical information includes:

* title
* subtitle
* slug
* description
* status
* tags
* image
* links
* project URLs

This keeps every manifest internally consistent.

---

# Deployment

The repository is designed for deployment on a standard web server.

Primary deployment target:

```
nginx
```

Configuration is documented in

```
nginx.conf
```

The website functions correctly without:

* PHP
* Node.js
* Python
* databases
* application servers

Only static file serving is required.

---

# Browser Compatibility

Development targets current versions of:

* Firefox
* Chromium
* Google Chrome
* Brave
* Microsoft Edge
* Safari

Progressive enhancement ensures that core content remains accessible even if
JavaScript is unavailable.

---

# Accessibility

Accessibility is considered throughout the repository.

Features include:

* semantic HTML
* keyboard navigation
* focus indicators
* skip links
* responsive layouts
* descriptive alternative text
* accessible form controls
* scalable typography
* reduced visual clutter
* high contrast color palette

Accessibility improvements remain an ongoing effort.

# Privacy

Privacy is a design requirement rather than an optional feature.

The website intentionally minimizes data collection.

Goals include:

- no advertising
- no analytics platforms
- no behavioral tracking
- no third-party cookies
- no social media tracking pixels
- no fingerprinting
- no unnecessary JavaScript
- no telemetry
- no user profiling

Visitors should be able to browse the website without becoming a product.

---

# Search Engine Policy

This repository is intentionally **not** designed for broad search-engine
indexing.

The deployed site includes directives intended to discourage indexing and
automated archival, including restrictive `robots.txt` rules and `noindex`
metadata on pages where appropriate.

This repository exists primarily as a public source repository and publication
archive rather than a search-engine optimized website.

---

# Security

Security influences every aspect of repository design.

Current goals include:

- static deployment
- minimal attack surface
- HTTPS deployment
- Content Security Policy
- secure response headers
- least privilege
- dependency minimization
- supply-chain awareness
- reproducible builds
- cryptographic verification where practical

Future improvements will continue to strengthen deployment security while
maintaining portability.

---

# Content Security

Whenever possible the repository prefers:

- locally hosted assets
- locally hosted fonts
- locally hosted JavaScript
- locally hosted images

Reducing external dependencies improves:

- privacy
- availability
- reproducibility
- long-term preservation

---

# Repository Workflow

Development generally follows the same workflow regardless of project.

```
Design

↓

Research

↓

Prototype

↓

Implement

↓

Document

↓

Review

↓

Commit

↓

Publish
```

Documentation is treated as part of the engineering process rather than an
afterthought.

---

# Version Control

Git is considered the canonical history of the repository.

Commits should be:

- descriptive
- atomic
- logically grouped
- reviewable

Whenever practical, unrelated changes should be committed separately.

---

# Branch Strategy

Typical development follows:

```
main
```

Stable public branch.

Future development branches may include:

```
development

feature/*

bugfix/*

release/*
```

The branching strategy will evolve alongside repository growth.

---

# Coding Style

General preferences throughout the repository include:

- readable code
- descriptive names
- consistent formatting
- minimal abstraction
- documentation where useful
- deterministic behavior

Readability is generally preferred over cleverness.

---

# HTML Style

HTML emphasizes:

- semantic elements
- accessibility
- reusable layouts
- descriptive metadata
- progressive enhancement
- consistent formatting

Every page should resemble every other page structurally.

---

# CSS Style

CSS emphasizes:

- shared variables
- reusable classes
- responsive layouts
- centralized design
- minimal duplication

Visual consistency across the website is a priority.

---

# JavaScript Style

JavaScript follows several principles.

- modular design
- no global pollution
- progressive enhancement
- graceful failure
- small focused modules
- framework independence

Every script should have a clearly defined responsibility.

---

# JSON Style

Manifest files are intended to remain human readable.

General conventions include:

- UTF-8
- two-space indentation
- stable field ordering
- descriptive names
- alphabetical sorting where appropriate

Large manifests should remain suitable for version control.

---

# Documentation

Documentation is considered a first-class component of the repository.

Examples include:

- README.md
- CONTRIBUTING.md
- SECURITY.md
- CREDITS.md
- ATTRIBUTION.md
- tools/README.md

Individual projects may include their own documentation where appropriate.

---

# Licensing

Unless explicitly stated otherwise:

Source code is released under the MIT License.

Documentation, articles, photography, artwork, graphics, and other creative
works remain under their respective licenses as identified within the repository.

Individual directories may specify different licensing terms where necessary.

Always consult the local LICENSE file accompanying a project when redistributing
material.

---

# Attribution

Third-party software, libraries, fonts, icons, images, reference material, and
other incorporated works are credited whenever possible.

Repository-wide acknowledgements are maintained in:

```
ATTRIBUTION.md
```

Additional acknowledgements may appear within individual projects.

---

# Contributing

Contributions are welcome.

Prospective contributors are encouraged to read:

```
CONTRIBUTING.md
```

before opening issues or submitting pull requests.

Contribution guidelines exist to maintain consistency throughout the repository.

---

# Responsible Disclosure

Potential security issues should not be reported publicly before they can be
evaluated.

Please review:

```
SECURITY.md
```

for current disclosure procedures.

---

# Credits

The repository acknowledges the many open-source projects, researchers,
developers, artists, educators, standards organizations, and communities whose
work has contributed directly or indirectly to this project.

Repository-wide acknowledgements are maintained in:

```
CREDITS.md
```

---

# Contact

Professional enquiries, consulting requests, collaboration proposals, and other
correspondence should use the contact information published on:

```
https://0xdeadbeef.in/contact/
```

Additional information is available through:

- About
- Biography
- Curriculum Vitae
- Portfolio
- Projects
- Research
- Writing
- Consulting
- Contracting
- Ventures

---

# Repository Status

Current status:

```
Active Development
```

The repository continues to evolve as new research programs, engineering
projects, publications, software, firmware, hardware, and supporting
documentation are completed.

Backwards compatibility is maintained whenever practical, although internal
organization and tooling may improve over time.

---

# Acknowledgements

This repository would not exist without decades of work contributed by the
global free software, open-source software, scientific, engineering, academic,
Bitcoin, security, and standards communities.

Their publications, software, protocols, libraries, operating systems, research,
and educational materials have collectively made independent research and
engineering possible.

Thank you to everyone who has chosen to share their work openly.

---

# Final Notes

This repository is intended to remain understandable, maintainable, portable,
and useful for many years.

Rather than optimizing for novelty or complexity, the emphasis is placed on
clarity, documentation, reproducibility, and long-term stewardship.

Every improvement should leave the repository in a better state than it was
found.

---

© 2026 0xdeadbeef

Independent research, engineering, software development, hardware design,
technical writing, and open-source publication.

