#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

CATEGORY_DIRS = (
    "adult",
    "ai",
    "apps",
    "bitcoin",
    "cyber-investigation",
    "cyber-security",
    "cyber-warfare",
    "firmware",
    "hardware",
    "ml",
    "osint",
    "software",
    "web",
)

SOURCE_CATEGORY = "software"

CATEGORY_PRIORITY = (
    "adult",
    "cyber-warfare",
    "cyber-investigation",
    "cyber-security",
    "osint",
    "bitcoin",
    "firmware",
    "hardware",
    "apps",
    "web",
    "ml",
    "ai",
    "software",
)

CATEGORY_TAGS: dict[str, set[str]] = {
    "adult": {
        "adult",
        "nsfw",
        "bdsm",
        "kink",
        "fetish",
        "sexual-health",
        "sex",
        "dating",
        "relationship",
        "relationships",
        "intimacy",
        "pornography",
        "erotic",
    },
    "ai": {
        "ai",
        "artificial-intelligence",
        "llm",
        "gpt",
        "agent",
        "agents",
        "assistant",
        "rag",
        "retrieval-augmented-generation",
        "generative-ai",
        "multimodal",
        "transformers",
        "inference",
        "language-model",
        "language-models",
        "nlp",
        "computer-vision",
        "vision-model",
        "voice-ai",
        "tts",
        "stt",
    },
    "apps": {
        "android",
        "apk",
        "ios",
        "mobile",
        "mobile-app",
        "application",
        "applications",
        "desktop-app",
        "desktop-application",
        "pwa",
        "electron",
        "kotlin",
        "android-sdk",
        "swift",
        "react-native",
        "flutter",
    },
    "bitcoin": {
        "bitcoin",
        "btc",
        "bitcoin-core",
        "bitcoin-knots",
        "bitcoind",
        "bitcoin-cli",
        "lightning",
        "lightning-network",
        "ln",
        "lnd",
        "wallet",
        "wallets",
        "utxo",
        "mempool",
        "blockchain",
        "block-explorer",
        "mining",
        "miner",
        "miners",
        "multisig",
        "psbt",
        "dlc",
        "htlc",
        "sats",
        "satoshi",
        "satoshis",
        "on-chain",
        "onchain",
        "block-height",
        "halving",
        "node",
        "full-node",
        "cold-storage",
        "custody",
    },
    "cyber-investigation": {
        "cyber-investigation",
        "investigation",
        "investigations",
        "forensics",
        "digital-forensics",
        "financial-forensics",
        "blockchain-forensics",
        "fraud",
        "fraud-analysis",
        "attribution",
        "evidence",
        "timeline",
        "case-management",
        "incident-analysis",
        "trace-analysis",
        "recovery",
        "wallet-recovery",
        "disk-forensics",
        "memory-forensics",
        "artifact-analysis",
    },
    "cyber-security": {
        "cybersecurity",
        "cyber-security",
        "security",
        "infosec",
        "opsec",
        "operational-security",
        "malware",
        "malware-analysis",
        "reverse-engineering",
        "threat-intelligence",
        "threat-analysis",
        "vulnerability",
        "vulnerabilities",
        "pentesting",
        "penetration-testing",
        "red-team",
        "blue-team",
        "incident-response",
        "ids",
        "ips",
        "firewall",
        "encryption",
        "cryptography",
        "secure-storage",
        "hardening",
        "zero-trust",
        "authentication",
        "authorization",
        "hsm",
        "vault",
        "secure-boot",
        "secure-element",
        "network-security",
    },
    "cyber-warfare": {
        "cyber-warfare",
        "cyberwarfare",
        "cyber-conflict",
        "electronic-warfare",
        "information-warfare",
        "information-operations",
        "critical-infrastructure",
        "national-security",
        "defense",
        "defence",
        "military",
        "deterrence",
        "strategic-communications",
        "signals-intelligence",
        "sigint",
        "counterintelligence",
        "c4isr",
        "c5isr",
    },
    "firmware": {
        "firmware",
        "embedded",
        "embedded-systems",
        "microcontroller",
        "microcontrollers",
        "mcu",
        "esp32",
        "esp8266",
        "arduino",
        "stm32",
        "rp2040",
        "raspberry-pi-pico",
        "freertos",
        "rtos",
        "bare-metal",
        "i2c",
        "spi",
        "uart",
        "gpio",
        "bootloader",
        "device-driver",
        "device-drivers",
    },
    "hardware": {
        "hardware",
        "electronics",
        "pcb",
        "pcb-design",
        "schematic",
        "schematics",
        "sensor",
        "sensors",
        "robotics",
        "robot",
        "robots",
        "uav",
        "drone",
        "drones",
        "ugv",
        "umv",
        "rov",
        "droid",
        "droids",
        "droed",
        "droeds",
        "detector",
        "detectors",
        "deterrent",
        "deterrents",
        "interceptor",
        "interceptors",
        "jammer",
        "jammers",
        "sdr",
        "lora",
        "radio",
        "rf",
        "enclosure",
        "enclosures",
        "power-system",
        "battery",
        "batteries",
        "solar",
        "mechanical",
        "manufacturing",
        "fabrication",
    },
    "ml": {
        "ml",
        "machine-learning",
        "deep-learning",
        "neural-network",
        "neural-networks",
        "tensorflow",
        "pytorch",
        "torch",
        "keras",
        "classification",
        "clustering",
        "regression",
        "forecasting",
        "anomaly-detection",
        "feature-engineering",
        "training",
        "fine-tuning",
        "finetuning",
        "embeddings",
        "dataset",
        "datasets",
        "model-evaluation",
        "computer-vision",
    },
    "osint": {
        "osint",
        "open-source-intelligence",
        "public-records",
        "public-data",
        "entity-resolution",
        "entity-analysis",
        "geospatial",
        "gis",
        "mapping",
        "social-media",
        "socmint",
        "web-intelligence",
        "web-scraping",
        "scraping",
        "crawler",
        "crawling",
        "data-collection",
        "source-verification",
        "skip-tracing",
        "skiptrace",
        "people-search",
        "corporate-records",
        "records-search",
    },
    "web": {
        "website",
        "websites",
        "web-site",
        "web-development",
        "frontend",
        "front-end",
        "backend",
        "back-end",
        "full-stack",
        "html",
        "css",
        "javascript",
        "typescript",
        "php",
        "nginx",
        "apache",
        "flask",
        "django",
        "fastapi",
        "gunicorn",
        "uvicorn",
        "web-app",
        "web-application",
        "web-interface",
        "web-platform",
        "browser",
        "browser-extension",
        "api-server",
        "rest-api",
        "graphql",
    },
    "software": {
        "software",
        "cli",
        "gui",
        "pyqt5",
        "qt",
        "python",
        "c",
        "cpp",
        "c++",
        "csharp",
        "go",
        "rust",
        "java",
        "bash",
        "perl",
        "ruby",
        "lua",
        "automation",
        "utility",
        "tool",
        "tools",
        "desktop",
        "cross-platform",
        "library",
        "framework",
    },
}

CATEGORY_TITLE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "adult": (
        "adult",
        "nsfw",
        "bdsm",
        "kink",
        "fetish",
    ),
    "ai": (
        " ai ",
        "ai-",
        "-ai",
        "gpt",
        "llm",
        "assistant",
        "language model",
        "neural",
    ),
    "apps": (
        "android",
        "apk",
        "mobile app",
        "ios app",
    ),
    "bitcoin": (
        "bitcoin",
        "btc",
        "lightning",
        "mempool",
        "utxo",
        "blockchain",
        "bit-",
        "bit ",
    ),
    "cyber-investigation": (
        "forensic",
        "investigation",
        "evidence",
        "fraud",
        "attribution",
        "recovery",
    ),
    "cyber-security": (
        "security",
        "secure",
        "malware",
        "firewall",
        "vulnerability",
        "encryption",
        "vault",
        "armor",
    ),
    "cyber-warfare": (
        "cyber warfare",
        "cyber conflict",
        "electronic warfare",
        "defense",
        "defence",
    ),
    "firmware": (
        "firmware",
        "esp32",
        "arduino",
        "embedded",
        "microcontroller",
    ),
    "hardware": (
        "hardware",
        "drone",
        "uav",
        "ugv",
        "umv",
        "rov",
        "robot",
        "droid",
        "detector",
        "jammer",
        "interceptor",
    ),
    "ml": (
        "machine learning",
        "deep learning",
        "neural network",
        "classifier",
        "model training",
    ),
    "osint": (
        "osint",
        "public records",
        "entity lookup",
        "entity index",
        "geo mapper",
        "skip trace",
    ),
    "web": (
        "website",
        "web site",
        "web platform",
        "web portal",
        "web interface",
    ),
}

EXPLICIT_CATEGORY_ALIASES = {
    "application": "apps",
    "applications": "apps",
    "app": "apps",
    "mobile": "apps",
    "artificial-intelligence": "ai",
    "machine-learning": "ml",
    "cybersecurity": "cyber-security",
    "security": "cyber-security",
    "investigation": "cyber-investigation",
    "cyberwarfare": "cyber-warfare",
    "cyber-conflict": "cyber-warfare",
    "embedded": "firmware",
    "embedded-systems": "firmware",
    "electronics": "hardware",
    "website": "web",
    "web-development": "web",
}

WEB_ONLY_KEYS = {
    "website",
    "websites",
    "web-site",
    "frontend",
    "front-end",
    "html",
    "css",
    "javascript",
    "typescript",
    "php",
    "nginx",
    "apache",
    "browser-extension",
    "static-site",
}

SOFTWARE_WEB_KEYS = {
    "flask",
    "django",
    "fastapi",
    "gunicorn",
    "uvicorn",
    "api",
    "rest-api",
    "graphql",
    "backend",
    "back-end",
    "websocket",
    "server",
}

MANIFEST_PROJECT_KEYS = (
    "projects",
    "items",
    "entries",
    "data",
    "records",
)


def canonical_token(value: Any) -> str:
    return (
        str(value)
        .strip()
        .lower()
        .replace("_", "-")
        .replace(" ", "-")
    )


def unique_strings(values: Iterable[Any]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()

    for value in values:
        if value is None:
            continue

        if isinstance(value, dict):
            value = (
                value.get("name")
                or value.get("label")
                or value.get("title")
                or ""
            )

        string = str(value).strip()
        if not string:
            continue

        key = string.casefold()
        if key in seen:
            continue

        seen.add(key)
        result.append(string)

    return result


def load_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Invalid JSON in {path}: line {exc.lineno}, "
            f"column {exc.colno}: {exc.msg}"
        ) from exc

    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")

    return data


def extract_projects(data: dict[str, Any]) -> list[dict[str, Any]]:
    for key in MANIFEST_PROJECT_KEYS:
        value = data.get(key)

        if isinstance(value, list):
            return [
                item
                for item in value
                if isinstance(item, dict)
            ]

        if isinstance(value, dict):
            return [
                item
                for item in value.values()
                if isinstance(item, dict)
            ]

    return []


def manifest_container(
    original: dict[str, Any],
    projects: list[dict[str, Any]],
) -> dict[str, Any]:
    result = dict(original)

    target_key = next(
        (
            key
            for key in MANIFEST_PROJECT_KEYS
            if key in result
        ),
        "projects",
    )

    for key in MANIFEST_PROJECT_KEYS:
        if key != target_key:
            result.pop(key, None)

    result[target_key] = projects
    result["project_count"] = len(projects)

    return result


def project_tokens(project: dict[str, Any]) -> set[str]:
    fields: list[Any] = []

    for key in (
        "tags",
        "keywords",
        "technologies",
        "stack",
        "platforms",
        "frameworks",
        "dependencies",
    ):
        value = project.get(key)

        if isinstance(value, list):
            fields.extend(value)
        elif value:
            fields.append(value)

    tokens: set[str] = set()

    for value in fields:
        if isinstance(value, dict):
            value = (
                value.get("name")
                or value.get("label")
                or value.get("title")
                or ""
            )

        token = canonical_token(value)

        if token:
            tokens.add(token)

    return tokens


def project_text(project: dict[str, Any]) -> str:
    values = (
        project.get("title"),
        project.get("name"),
        project.get("slug"),
        project.get("blurb"),
        project.get("summary"),
        project.get("description"),
        project.get("note"),
    )

    return " ".join(
        str(value)
        for value in values
        if value
    ).lower()


def normalize_explicit_category(value: Any) -> str | None:
    if not value:
        return None

    category = canonical_token(value)
    category = EXPLICIT_CATEGORY_ALIASES.get(
        category,
        category,
    )

    if category in CATEGORY_DIRS:
        return category

    return None


def score_categories(
    project: dict[str, Any],
) -> dict[str, int]:
    tokens = project_tokens(project)
    text = project_text(project)
    scores = {
        category: 0
        for category in CATEGORY_DIRS
    }

    for category, category_tags in CATEGORY_TAGS.items():
        matches = tokens.intersection(category_tags)
        scores[category] += len(matches) * 10

    for category, keywords in CATEGORY_TITLE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                scores[category] += 6

    explicit = normalize_explicit_category(
        project.get("category")
    )

    if explicit:
        scores[explicit] += 100

    href = canonical_token(project.get("href", ""))

    for category in CATEGORY_DIRS:
        if f"/projects/{category}/" in href:
            scores[category] += 200

    if tokens.intersection(WEB_ONLY_KEYS):
        scores["web"] += 35

    if (
        tokens.intersection(SOFTWARE_WEB_KEYS)
        and not tokens.intersection(WEB_ONLY_KEYS)
    ):
        scores["software"] += 12
        scores["web"] -= 5

    if "android" in tokens or "apk" in tokens:
        scores["apps"] += 40

    if "ios" in tokens or "swift" in tokens:
        scores["apps"] += 40

    if tokens.intersection(
        CATEGORY_TAGS["firmware"]
    ):
        scores["firmware"] += 20

    if tokens.intersection(
        CATEGORY_TAGS["hardware"]
    ):
        scores["hardware"] += 20

    if tokens.intersection(
        CATEGORY_TAGS["cyber-warfare"]
    ):
        scores["cyber-warfare"] += 30

    return scores


def classify_project(
    project: dict[str, Any],
) -> tuple[str, dict[str, int]]:
    scores = score_categories(project)

    highest = max(scores.values())

    if highest <= 0:
        return "software", scores

    candidates = [
        category
        for category, score in scores.items()
        if score == highest
    ]

    for category in CATEGORY_PRIORITY:
        if category in candidates:
            return category, scores

    return candidates[0], scores


def normalize_project(
    project: dict[str, Any],
    category: str,
) -> dict[str, Any]:
    normalized = dict(project)
    normalized["category"] = category

    if "tags" in normalized:
        normalized["tags"] = unique_strings(
            normalized.get("tags", [])
        )

    if "platforms" in normalized:
        normalized["platforms"] = unique_strings(
            normalized.get("platforms", [])
        )

    if "frameworks" in normalized:
        normalized["frameworks"] = unique_strings(
            normalized.get("frameworks", [])
        )

    if "dependencies" in normalized:
        normalized["dependencies"] = unique_strings(
            normalized.get("dependencies", [])
        )

    return normalized


def project_identity(
    project: dict[str, Any],
) -> str:
    for key in (
        "href",
        "slug",
        "github",
        "title",
        "name",
    ):
        value = project.get(key)

        if value:
            return canonical_token(value)

    return canonical_token(
        json.dumps(
            project,
            ensure_ascii=False,
            sort_keys=True,
        )
    )


def merge_projects(
    existing: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}

    for project in existing:
        merged[project_identity(project)] = project

    for project in incoming:
        merged[project_identity(project)] = project

    return sorted(
        merged.values(),
        key=lambda item: (
            str(
                item.get("title")
                or item.get("name")
                or ""
            ).casefold(),
            str(
                item.get("slug")
                or item.get("href")
                or ""
            ).casefold(),
        ),
    )


def ensure_category_manifests(
    projects_root: Path,
) -> None:
    for category in CATEGORY_DIRS:
        category_dir = projects_root / category
        manifest_path = category_dir / "manifest.json"

        category_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        if manifest_path.exists():
            continue

        manifest_path.write_text(
            json.dumps(
                {
                    "schema_version": "1.0",
                    "category": category,
                    "project_count": 0,
                    "projects": [],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )


def backup_file(
    path: Path,
    backup_root: Path,
    projects_root: Path,
) -> None:
    if not path.exists():
        return

    relative = path.relative_to(projects_root)
    destination = backup_root / relative

    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    shutil.copy2(
        path,
        destination,
    )


def classify_source_manifest(
    projects_root: Path,
    *,
    dry_run: bool,
    backup: bool,
    verbose: bool,
) -> dict[str, int]:
    source_path = (
        projects_root
        / SOURCE_CATEGORY
        / "manifest.json"
    )

    if not source_path.is_file():
        raise FileNotFoundError(
            f"Source manifest not found: {source_path}"
        )

    source_data = load_json(source_path)
    source_projects = extract_projects(source_data)

    classified: dict[str, list[dict[str, Any]]] = {
        category: []
        for category in CATEGORY_DIRS
    }

    for project in source_projects:
        category, scores = classify_project(project)
        normalized = normalize_project(
            project,
            category,
        )
        classified[category].append(normalized)

        if verbose:
            title = (
                project.get("title")
                or project.get("name")
                or project.get("slug")
                or "Untitled Project"
            )

            best_scores = sorted(
                (
                    (name, score)
                    for name, score in scores.items()
                    if score > 0
                ),
                key=lambda item: (
                    -item[1],
                    item[0],
                ),
            )[:4]

            print(
                f"{title} -> {category}"
                f" {best_scores}"
            )

    counts = {
        category: len(projects)
        for category, projects in classified.items()
    }

    if dry_run:
        return counts

    timestamp = datetime.now(
        timezone.utc
    ).strftime("%Y%m%dT%H%M%SZ")

    backup_root = (
        projects_root
        / ".manifest-backups"
        / timestamp
    )

    ensure_category_manifests(projects_root)

    if backup:
        for category in CATEGORY_DIRS:
            backup_file(
                projects_root
                / category
                / "manifest.json",
                backup_root,
                projects_root,
            )

        backup_file(
            projects_root / "manifest.json",
            backup_root,
            projects_root,
        )

    for category in CATEGORY_DIRS:
        manifest_path = (
            projects_root
            / category
            / "manifest.json"
        )

        current_data = load_json(manifest_path)
        current_projects = extract_projects(current_data)

        if category == SOURCE_CATEGORY:
            retained_existing = [
                normalize_project(project, category)
                for project in current_projects
                if classify_project(project)[0]
                == SOURCE_CATEGORY
            ]

            final_projects = merge_projects(
                retained_existing,
                classified[category],
            )
        else:
            source_ids = {
                project_identity(project)
                for project in source_projects
            }

            retained_existing = [
                project
                for project in current_projects
                if project_identity(project)
                not in source_ids
            ]

            final_projects = merge_projects(
                retained_existing,
                classified[category],
            )

        output_data = manifest_container(
            current_data,
            final_projects,
        )

        output_data["schema_version"] = str(
            output_data.get(
                "schema_version",
                "1.0",
            )
        )
        output_data["category"] = category
        output_data["generated_at"] = (
            datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )

        manifest_path.write_text(
            json.dumps(
                output_data,
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    return counts


def build_master(
    projects_root: Path,
) -> dict[str, Any]:
    categories: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []
    seen: set[str] = set()

    for category in CATEGORY_DIRS:
        manifest_path = (
            projects_root
            / category
            / "manifest.json"
        )

        if not manifest_path.is_file():
            print(
                f"warning: missing {manifest_path}",
                file=sys.stderr,
            )
            continue

        data = load_json(manifest_path)
        category_projects = extract_projects(data)

        normalized_projects = [
            normalize_project(
                project,
                category,
            )
            for project in category_projects
        ]

        categories.append(
            {
                "name": category,
                "manifest": (
                    f"/projects/{category}/"
                    "manifest.json"
                ),
                "count": len(normalized_projects),
            }
        )

        for project in normalized_projects:
            key = project_identity(project)

            if key in seen:
                continue

            seen.add(key)
            projects.append(project)

    projects.sort(
        key=lambda item: (
            str(
                item.get("category", "")
            ).casefold(),
            str(
                item.get("title")
                or item.get("name")
                or ""
            ).casefold(),
        )
    )

    return {
        "schema_version": "1.0",
        "generated_at": (
            datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        ),
        "generated_from": (
            "projects/*/manifest.json"
        ),
        "categories": categories,
        "project_count": len(projects),
        "projects": projects,
    }


def write_master(
    projects_root: Path,
    output: Path,
    indent: int,
) -> dict[str, Any]:
    master = build_master(projects_root)

    output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output.write_text(
        json.dumps(
            master,
            ensure_ascii=False,
            indent=indent,
        )
        + "\n",
        encoding="utf-8",
    )

    return master


def print_counts(
    counts: dict[str, int],
) -> None:
    width = max(
        len(category)
        for category in CATEGORY_DIRS
    )

    for category in CATEGORY_DIRS:
        print(
            f"{category:<{width}} : "
            f"{counts.get(category, 0)}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Classify projects from "
            "projects/software/manifest.json "
            "into category manifests and build "
            "projects/manifest.json."
        )
    )

    parser.add_argument(
        "projects_root",
        nargs="?",
        type=Path,
        default=Path("projects"),
        help=(
            "Path to the projects directory. "
            "Defaults to ./projects."
        ),
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=(
            "Master manifest output path. "
            "Defaults to "
            "<projects_root>/manifest.json."
        ),
    )

    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indentation. Default: 2.",
    )

    parser.add_argument(
        "--classify",
        action="store_true",
        help=(
            "Classify and redistribute projects "
            "from software/manifest.json."
        ),
    )

    parser.add_argument(
        "--build-only",
        action="store_true",
        help=(
            "Only rebuild the unified master "
            "manifest."
        ),
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Show classification counts without "
            "modifying manifests."
        ),
    )

    parser.add_argument(
        "--no-backup",
        action="store_true",
        help=(
            "Do not create timestamped manifest "
            "backups."
        ),
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help=(
            "Print each project's selected "
            "category and score."
        ),
    )

    args = parser.parse_args()

    root = args.projects_root.resolve()

    if not root.is_dir():
        parser.error(
            f"Projects directory does not exist: "
            f"{root}"
        )

    output = (
        args.output.resolve()
        if args.output
        else root / "manifest.json"
    )

    classify = (
        args.classify
        or not args.build_only
    )

    if classify:
        counts = classify_source_manifest(
            root,
            dry_run=args.dry_run,
            backup=not args.no_backup,
            verbose=args.verbose,
        )

        print("Classification results:")
        print_counts(counts)

        if args.dry_run:
            print(
                "Dry run complete. "
                "No manifests were modified."
            )
            return 0

    master = write_master(
        root,
        output,
        args.indent,
    )

    print(f"Wrote: {output}")
    print(
        f"Categories: "
        f"{len(master['categories'])}"
    )
    print(
        f"Projects: "
        f"{master['project_count']}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
