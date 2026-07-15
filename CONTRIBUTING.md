# CONTRIBUTING

Thank you for your interest in contributing to **0xdeadbeef.in**.

This repository serves as the public source for the 0xdeadbeef website and its
associated documentation, publications, portfolio, research archive, and
engineering projects.

Whether you are fixing a typo, improving documentation, reporting a bug,
suggesting an enhancement, or contributing code, your time and effort are
appreciated.

---

# Philosophy

The primary goals of this repository are:

- Clarity
- Maintainability
- Simplicity
- Reproducibility
- Documentation
- Long-term preservation
- Accessibility
- Privacy
- Open collaboration

Every contribution should improve at least one of these goals.

---

# Code of Conduct

Contributors are expected to:

- Be respectful.
- Be constructive.
- Assume good faith.
- Discuss ideas rather than people.
- Welcome technical criticism.
- Accept corrections gracefully.
- Keep discussions professional.

Harassment, discrimination, personal attacks, threats, or abusive behavior will
not be tolerated.

---

# Before Contributing

Please read:

- README.md
- LICENSE
- SECURITY.md
- ATTRIBUTION.md
- CREDITS.md

before opening issues or submitting pull requests.

---

# Ways to Contribute

Contributions may include:

## Documentation

- Grammar
- Typographical corrections
- Clarifications
- Better examples
- Technical explanations
- API documentation
- Tutorials

---

## Website

- HTML improvements
- CSS improvements
- Accessibility
- Responsive layout
- Navigation
- User experience
- Performance

---

## JavaScript

- Bug fixes
- Performance improvements
- Accessibility
- Manifest rendering
- Browser compatibility
- Progressive enhancement

---

## Python

Repository tooling.

Examples include:

- Manifest generation
- Validation
- Automation
- Static analysis
- Build tooling
- Documentation tooling

---

## Research

Suggestions for:

- Publications
- References
- Citations
- Standards
- Technical papers

---

## Bug Reports

Good bug reports include:

- Clear description
- Expected behavior
- Actual behavior
- Browser
- Operating system
- Steps to reproduce
- Screenshots when appropriate

---

# Feature Requests

Feature requests should explain:

- The problem.
- Why the problem exists.
- A proposed solution.
- Alternative approaches considered.
- Potential drawbacks.

---

# Pull Requests

Please keep pull requests:

- Focused
- Small
- Self-contained
- Well documented

Large unrelated changes should be separated into multiple pull requests.

---

# Repository Style

## HTML

Use semantic HTML.

Prefer:

- `<main>`
- `<section>`
- `<article>`
- `<nav>`
- `<header>`
- `<footer>`

Avoid unnecessary wrapper elements.

---

## CSS

Prefer reusable classes over page-specific styling.

Avoid duplicated rules.

Maintain consistency with:

```
static/colors.json
```

and

```
static/styles.css
```

---

## JavaScript

Requirements:

- ES2020+
- Modular
- Framework independent
- Progressive enhancement
- No global namespace pollution
- Graceful failure

Keep functions focused.

---

## Python

Follow modern Python practices.

Prefer:

- pathlib
- argparse
- type hints
- descriptive names
- deterministic output

Avoid unnecessary dependencies.

---

## JSON

All JSON files should:

- Use UTF-8.
- Use two-space indentation.
- Be valid JSON.
- Be deterministic.
- Use stable key ordering.
- Be human readable.

---

# Project Manifests

Projects are maintained through manifest files.

Do not hardcode projects into HTML.

Instead update the appropriate category manifest.

After editing manifests run:

```bash
python tools/build-projects-manifest.py
```

This rebuilds:

```
projects/manifest.json
```

which is consumed by the website.

---

# Blog

Every blog post consists of:

```
post_xxxx/

    index.html

    metadata.json

    post.txt
```

The canonical publication is:

```
post.txt
```

Update:

```
blog/blog.json
```

when publishing a new article.

---

# Documentation

Documentation should be:

- Accurate
- Current
- Technically correct
- Concise
- Well organized

Documentation is considered part of the project rather than an afterthought.

---

# Commit Messages

Use clear commit messages.

Good examples:

```
Fix project manifest sorting

Update portfolio renderer

Add engineering project manifests

Correct footer navigation

Improve accessibility

Document blog workflow
```

Avoid messages such as:

```
update

fix

misc

changes
```

---

# Testing

Before submitting changes verify:

- HTML validates.
- JSON validates.
- JavaScript contains no console errors.
- Python executes successfully.
- Links function correctly.
- Shared navigation loads.
- Footer loads.
- Manifest rendering succeeds.

---

# Security

Do not introduce:

- Tracking
- Analytics
- Telemetry
- Advertising
- Fingerprinting
- Unnecessary third-party services

Privacy is a core design principle.

---

# Licensing

By submitting a contribution you represent that:

- You have the right to submit the work.
- The contribution is your own or appropriately licensed.
- The contribution may be distributed under this repository's licensing terms.

---

# Questions

Questions, suggestions, and constructive discussion are always welcome.

Website

https://0xdeadbeef.in

Repository

https://github.com/ZZX-Labs/0xdeadbeef.in

---

Thank you for helping improve the project.

