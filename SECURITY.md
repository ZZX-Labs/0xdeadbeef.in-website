# SECURITY

The security of users, contributors, and the integrity of this repository are
taken seriously.

This document describes how to responsibly report potential security issues,
what types of reports are helpful, and what to expect during the disclosure
process.

---

# Supported Repository

At present, security reports are accepted only for the current development
version of the repository.

Repository

https://github.com/ZZX-Labs/0xdeadbeef.in

Website

https://0xdeadbeef.in

---

# Reporting a Security Issue

Please **do not publicly disclose** suspected security vulnerabilities before
they have been reviewed.

Instead, report them privately.

Email

0xdeadbeeftechconsulting [at] protonmail [dot] com

Subject

```
SECURITY REPORT
```

Please include as much information as possible.

---

# Helpful Information

Include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser
- Operating system
- Version numbers
- Relevant URLs
- Screenshots
- Console output
- Proof-of-concept code (if appropriate)

The more reproducible a report is, the faster it can be investigated.

---

# What To Report

Examples include:

## Website

- Cross-site scripting (XSS)
- HTML injection
- Content injection
- Clickjacking
- Open redirects
- CSP bypasses
- Mixed-content issues
- Information disclosure

---

## JavaScript

- DOM-based XSS
- Prototype pollution
- Manifest parsing vulnerabilities
- Unsafe rendering
- Resource loading vulnerabilities

---

## Repository

- Accidental secrets
- Credentials
- Tokens
- Private keys
- Sensitive files
- Dangerous dependencies

---

## Infrastructure

- HTTPS issues
- TLS configuration
- Security headers
- Cookie security
- Cache poisoning
- MIME confusion

---

## Supply Chain

Please report concerns involving:

- Malicious dependencies
- Dependency confusion
- Typosquatting
- Build compromise
- Repository compromise

---

# What Is Probably Not A Security Issue

Examples include:

- Typographical errors
- CSS layout issues
- Broken links
- Missing images
- Browser compatibility bugs
- Minor accessibility issues

These should instead be reported through the normal issue tracker.

---

# Disclosure Process

Typical workflow:

```
Private report

↓

Acknowledgement

↓

Investigation

↓

Fix

↓

Verification

↓

Public disclosure (when appropriate)
```

Every report is reviewed individually.

---

# Response Goals

While no guarantees can be made, the general goal is:

Initial acknowledgement

Within seven days.

Status updates

As investigation progresses.

Resolution

As quickly as practical.

Complex issues naturally require more time.

---

# Responsible Disclosure

Please:

- Allow time for investigation.
- Avoid public disclosure before a fix is available.
- Avoid unnecessary risk to users.
- Avoid exploiting vulnerabilities beyond what is reasonably necessary to
  demonstrate the issue.

Responsible disclosure helps protect everyone.

---

# Safe Harbor

We support good-faith security research.

If your research:

- Avoids privacy violations
- Avoids service disruption
- Avoids data destruction
- Avoids unauthorized access beyond demonstrating the issue

we will view the work as responsible security research.

---

# Privacy

Please do not include:

- Personal information
- Passwords
- API keys
- Private keys
- Authentication cookies

unless absolutely necessary for reproducing a vulnerability.

If sensitive information must be shared, clearly identify it.

---

# Cryptography

Where cryptographic verification is used within this repository, we encourage
responsible review of:

- Hash generation
- Signature verification
- Manifest integrity
- Publication verification

Constructive feedback is welcomed.

---

# Dependencies

The repository intentionally minimizes external dependencies.

When reporting dependency-related issues, please include:

- Package name
- Version
- Advisory identifier (if available)
- Upstream reference
- Recommended mitigation

---

# Security Philosophy

The repository favors:

- Static deployment
- Minimal dependencies
- Local assets
- Progressive enhancement
- Small JavaScript modules
- Human-readable data formats
- Reproducible builds
- Privacy-first design

Reducing complexity generally improves security.

---

# Scope

This policy applies to:

- Website source
- JavaScript
- Python tooling
- HTML
- CSS
- JSON manifests
- Documentation

Individual third-party projects incorporated into the repository remain governed
by their own security policies.

---

# Acknowledgements

Researchers who responsibly disclose significant verified vulnerabilities may,
with their permission, be acknowledged in future repository credits.

Anonymous disclosure requests will be respected.

---

# Contact

Security reports

0xdeadbeeftechconsulting [at] protonmail [dot] com

Website

https://0xdeadbeef.in

Repository

https://github.com/ZZX-Labs/0xdeadbeef.in

---

Thank you for helping improve the security of this repository and the safety of
its users.

