# Tools

This directory contains the maintenance and automation utilities used to manage the public project catalog for **0xdeadbeef.in** and **ZZX-Labs.io**.

The overall design goal is to maintain a **single source of truth** for every public project.

Instead of manually editing multiple HTML pages, manifests, and project listings, project information is stored in JSON manifests and automatically propagated throughout both websites.

---

# Directory

```text
tools/
├── README.md
├── add-featured-projects.py
└── build-projects-manifest.py
```

---

# Repository Layout

These tools operate on the following directory structure.

```text
projects/

├── manifest.json                 <-- generated master manifest

├── adult/
│   ├── index.html
│   └── manifest.json

├── ai/
│   ├── index.html
│   └── manifest.json

├── apps/
│   ├── index.html
│   └── manifest.json

├── bitcoin/
│   ├── index.html
│   └── manifest.json

├── cyber-investigation/
│   ├── index.html
│   └── manifest.json

├── cyber-security/
│   ├── index.html
│   └── manifest.json

├── cyber-warfare/
│   ├── index.html
│   └── manifest.json

├── firmware/
│   ├── index.html
│   └── manifest.json

├── hardware/
│   ├── index.html
│   └── manifest.json

├── ml/
│   ├── index.html
│   └── manifest.json

├── osint/
│   ├── index.html
│   └── manifest.json

├── software/
│   ├── index.html
│   └── manifest.json

└── web/
    ├── index.html
    └── manifest.json
```

Every category owns its own manifest.

The root `projects/manifest.json` is **never edited manually.**

It is automatically generated.

---

# Overall Workflow

The intended workflow is:

```text
Create Project
        │
        ▼
add-featured-projects.py
        │
updates category manifest
        │
        ▼
build-projects-manifest.py
        │
builds projects/manifest.json
        │
        ▼
projects-manifest.js
        │
loads JSON
        │
        ▼
Projects Page
Portfolio Page
Category Pages
```

No HTML editing is required when adding projects.

---

# add-featured-projects.py

Purpose:

Add, update, or replace projects inside the appropriate category manifest.

This is the primary tool used whenever a new public project is created.

It can also:

- copy project logos
- normalize slugs
- normalize categories
- validate manifests
- merge tags
- rebuild the master manifest

---

## Interactive Mode

The easiest workflow.

```bash
python tools/add-featured-projects.py --interactive
```

The script will prompt for:

```
Category

Project title

Slug

Description

Project URL

GitHub URL

Download URL

Version

Status

License

Tags

Platforms

Frameworks

Dependencies

Logo

Featured
```

---

## Example

```bash
python tools/add-featured-projects.py \
    --category bitcoin \
    --title "BitNode Explorer" \
    --slug bitnode-explorer \
    --description "Bitcoin network explorer." \
    --tags "bitcoin,node,network" \
    --featured
```

---

## Updating Existing Entries

Merge new fields into an existing entry.

```bash
python tools/add-featured-projects.py \
    --category bitcoin \
    --slug bitnode-explorer \
    --description "Updated description." \
    --update
```

---

## Replacing Existing Entries

Overwrite an existing record.

```bash
python tools/add-featured-projects.py \
    --category bitcoin \
    --slug bitnode-explorer \
    --replace
```

---

## Logo Handling

A logo may be copied directly into the repository.

Example:

```bash
--logo artwork/logo.png
```

The tool automatically copies it to

```text
static/images/projects/

    category/

        slug/

            slug.png
```

The manifest entry is updated automatically.

---

## Category Validation

Projects may only belong to one of the following categories.

```
adult

ai

apps

bitcoin

cyber-investigation

cyber-security

cyber-warfare

firmware

hardware

ml

osint

software

web
```

Unknown categories are rejected.

---

## Automatic Slug Generation

Titles automatically become URL-safe slugs.

Example

```
Bitcoin Node Explorer
```

becomes

```
bitcoin-node-explorer
```

---

## Duplicate Detection

Projects are uniquely identified using

```
slug

href

github

download

title
```

Duplicate entries are automatically detected.

---

## Automatic Manifest Rebuild

After adding a project, the script automatically runs

```bash
build-projects-manifest.py
```

unless disabled.

---

# build-projects-manifest.py

Purpose:

Generate the master manifest.

This tool scans every category manifest and combines them into one unified project catalog.

Output:

```text
projects/

    manifest.json
```

---

## Build Only

```bash
python tools/build-projects-manifest.py \
    projects \
    --build-only
```

Result

```
projects/manifest.json
```

is regenerated.

---

## Classification Mode

The builder can also redistribute projects that currently live inside

```
projects/software/manifest.json
```

into their proper category manifests.

Example

```
Bitcoin

↓

bitcoin/

manifest.json
```

```
Android

↓

apps/

manifest.json
```

```
ESP32

↓

firmware/

manifest.json
```

```
OSINT

↓

osint/

manifest.json
```

etc.

---

## Classification

The classifier examines

- title
- slug
- description
- tags
- technologies
- frameworks
- dependencies
- platforms
- href
- explicit category

Every project receives a score for each category.

The highest score wins.

---

## Category Priority

When scores tie, the following priority is used.

```
adult

cyber-warfare

cyber-investigation

cyber-security

osint

bitcoin

firmware

hardware

apps

web

ml

ai

software
```

---

## Dry Run

See where projects would be classified.

```bash
python tools/build-projects-manifest.py \
    --dry-run
```

Nothing is modified.

---

## Verbose Mode

Print category scores.

```bash
python tools/build-projects-manifest.py \
    --verbose
```

Example

```
BitNode Explorer

bitcoin

(bitcoin=48 software=10 web=6)
```

---

## Manifest Backups

Before modifying manifests, timestamped backups are created.

Example

```text
projects/

.manifest-backups/

20260714T182301Z/

bitcoin/

manifest.json

software/

manifest.json
```

Disable with

```bash
--no-backup
```

---

# Master Manifest

The generated master manifest contains

```json
{
    "schema_version":"1.0",

    "generated_at":"...",

    "generated_from":"projects/*/manifest.json",

    "categories":[...],

    "project_count":123,

    "projects":[...]
}
```

This file is consumed directly by

```
static/js/projects-manifest.js
```

---

# Website Integration

The following pages consume the master manifest.

```
/projects/

/portfolio/

/projects/software/

/projects/bitcoin/

/projects/ai/

/projects/osint/

/projects/web/

/projects/apps/

...
```

No hardcoded project cards should exist.

Everything should be generated from JSON.

---

# Recommended Workflow

Whenever a new public project is ready:

1.

Create the project logo.

2.

Create the project page.

3.

Run

```bash
add-featured-projects.py
```

4.

Verify the category manifest.

5.

Allow the tool to regenerate

```
projects/manifest.json
```

6.

Refresh the website.

The new project will automatically appear everywhere it belongs.

---

# Design Philosophy

The objective is to maintain **one canonical definition** of every public project.

Rather than maintaining multiple copies across numerous HTML pages, every project exists exactly once inside a category manifest.

All project listings, portfolio pages, category pages, and search interfaces consume those manifests dynamically.

This minimizes duplication, reduces maintenance overhead, prevents inconsistent project descriptions, and allows new projects to be published with a single command while keeping both **0xdeadbeef.in** and **ZZX-Labs.io** synchronized.
