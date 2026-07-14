#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CATEGORY_DIRS=(
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

PROJECT_KEYS=(
    "projects",
    "items",
    "entries",
    "data",
    "records",
)

DEFAULT_STATUS="Active"
DEFAULT_LICENSE="Project-specific"
DEFAULT_SCHEMA_VERSION="1.0"

CATEGORY_ALIASES={
    "app":"apps",
    "application":"apps",
    "applications":"apps",
    "mobile":"apps",
    "artificial-intelligence":"ai",
    "artificialintelligence":"ai",
    "machine-learning":"ml",
    "machinelearning":"ml",
    "cybersecurity":"cyber-security",
    "security":"cyber-security",
    "investigation":"cyber-investigation",
    "cyberwarfare":"cyber-warfare",
    "cyber-conflict":"cyber-warfare",
    "embedded":"firmware",
    "embedded-systems":"firmware",
    "electronics":"hardware",
    "website":"web",
    "websites":"web",
    "web-development":"web",
}

CATEGORY_LABELS={
    "adult":"Adult",
    "ai":"AI",
    "apps":"Applications",
    "bitcoin":"Bitcoin",
    "cyber-investigation":"Cyber Investigation",
    "cyber-security":"Cyber Security",
    "cyber-warfare":"Cyber Warfare",
    "firmware":"Firmware",
    "hardware":"Hardware",
    "ml":"Machine Learning",
    "osint":"OSINT",
    "software":"Software",
    "web":"Web",
}


def utc_now()->str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00","Z")


def slugify(value:str)->str:
    result=[]
    previous_dash=False

    for char in value.strip().lower():
        if char.isalnum():
            result.append(char)
            previous_dash=False
        elif not previous_dash:
            result.append("-")
            previous_dash=True

    return "".join(result).strip("-") or "project"


def normalize_category(value:str)->str:
    category=slugify(value)
    category=CATEGORY_ALIASES.get(category,category)

    if category not in CATEGORY_DIRS:
        raise ValueError(
            f"Unsupported category: {value}. "
            f"Valid categories: {', '.join(CATEGORY_DIRS)}"
        )

    return category


def parse_csv(value:str|None)->list[str]:
    if not value:
        return []

    values=[]
    seen=set()

    for item in value.split(","):
        item=item.strip()

        if not item:
            continue

        key=item.casefold()

        if key in seen:
            continue

        seen.add(key)
        values.append(item)

    return values


def unique_strings(values:list[Any])->list[str]:
    result=[]
    seen=set()

    for value in values:
        if isinstance(value,dict):
            value=(
                value.get("name")
                or value.get("label")
                or value.get("title")
                or value.get("value")
                or ""
            )

        value=str(value).strip()

        if not value:
            continue

        key=value.casefold()

        if key in seen:
            continue

        seen.add(key)
        result.append(value)

    return result


def load_json(path:Path)->dict[str,Any]:
    if not path.exists():
        return {
            "schema_version":DEFAULT_SCHEMA_VERSION,
            "projects":[],
        }

    try:
        with path.open("r",encoding="utf-8") as handle:
            data=json.load(handle)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Invalid JSON in {path}: "
            f"line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc

    if not isinstance(data,dict):
        raise ValueError(f"{path} must contain a JSON object")

    return data


def extract_projects(
    manifest:dict[str,Any],
)->tuple[str,list[dict[str,Any]]]:
    for key in PROJECT_KEYS:
        value=manifest.get(key)

        if isinstance(value,list):
            return key,[
                item
                for item in value
                if isinstance(item,dict)
            ]

        if isinstance(value,dict):
            return key,[
                item
                for item in value.values()
                if isinstance(item,dict)
            ]

    return "projects",[]


def project_identity(project:dict[str,Any])->str:
    for key in (
        "slug",
        "href",
        "github",
        "download",
        "title",
        "name",
    ):
        value=project.get(key)

        if value:
            return str(value).strip().casefold()

    return json.dumps(
        project,
        ensure_ascii=False,
        sort_keys=True,
    )


def sort_projects(
    projects:list[dict[str,Any]],
)->list[dict[str,Any]]:
    return sorted(
        projects,
        key=lambda item:(
            not bool(item.get("featured")),
            str(
                item.get("title")
                or item.get("name")
                or item.get("slug")
                or ""
            ).casefold(),
        ),
    )


def merge_project(
    existing:dict[str,Any],
    incoming:dict[str,Any],
)->dict[str,Any]:
    merged=dict(existing)

    for key,value in incoming.items():
        if value not in (None,"",[],{}):
            merged[key]=value

    for key in (
        "tags",
        "platforms",
        "frameworks",
        "dependencies",
        "keywords",
        "technologies",
        "stack",
    ):
        if key in existing or key in incoming:
            merged[key]=unique_strings(
                list(existing.get(key,[]) or [])
                +list(incoming.get(key,[]) or [])
            )

    return merged


def backup_file(path:Path,backup_dir:Path)->None:
    if not path.exists():
        return

    backup_dir.mkdir(parents=True,exist_ok=True)
    shutil.copy2(path,backup_dir/path.name)


def install_logo(
    source:Path,
    repo_root:Path,
    category:str,
    project_slug:str,
    logo_dir:Path|None,
)->str:
    if not source.is_file():
        raise FileNotFoundError(f"Logo image not found: {source}")

    extension=source.suffix.lower()

    if extension not in {
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
    }:
        raise ValueError(
            "Logo image must use PNG, JPG, JPEG, WEBP, or GIF."
        )

    destination_root=(
        logo_dir.resolve()
        if logo_dir
        else repo_root/"static"/"images"/"projects"/category/project_slug
    )

    destination_root.mkdir(parents=True,exist_ok=True)

    destination=destination_root/f"{project_slug}{extension}"
    shutil.copy2(source,destination)

    try:
        relative=destination.relative_to(repo_root)
    except ValueError:
        return destination.as_posix()

    return f"/{relative.as_posix()}"


def prompt(
    label:str,
    default:str|None=None,
    required:bool=False,
)->str:
    suffix=f" [{default}]" if default else ""

    while True:
        value=input(f"{label}{suffix}: ").strip()

        if value:
            return value

        if default is not None:
            return default

        if not required:
            return ""

        print(f"{label} is required.",file=sys.stderr)


def prompt_boolean(
    label:str,
    default:bool=False,
)->bool:
    default_text="Y/n" if default else "y/N"
    value=input(f"{label} [{default_text}]: ").strip().lower()

    if not value:
        return default

    return value in {"y","yes","true","1","on"}


def interactive_values(
    args:argparse.Namespace,
)->argparse.Namespace:
    if not args.category:
        print("Available categories:")

        for category in CATEGORY_DIRS:
            print(f"  {category:<22} {CATEGORY_LABELS[category]}")

        args.category=prompt(
            "Category",
            required=True,
        )

    args.category=normalize_category(args.category)

    if not args.title:
        args.title=prompt(
            "Project title",
            required=True,
        )

    if not args.slug:
        args.slug=prompt(
            "Slug",
            default=slugify(args.title),
        )

    if not args.description:
        args.description=prompt(
            "Description",
            required=True,
        )

    if args.href is None:
        args.href=prompt(
            "Project page URL",
            default=f"/projects/{args.category}/{args.slug}/",
        )

    if args.github is None:
        args.github=prompt("GitHub URL")

    if args.download is None:
        args.download=prompt("Download URL")

    if args.version is None:
        args.version=prompt("Version")

    if args.status is None:
        args.status=prompt(
            "Status",
            default=DEFAULT_STATUS,
        )

    if args.license is None:
        args.license=prompt(
            "License",
            default=DEFAULT_LICENSE,
        )

    if args.tags is None:
        args.tags=prompt(
            "Tags, comma separated",
        )

    if args.platforms is None:
        args.platforms=prompt(
            "Platforms, comma separated",
        )

    if args.frameworks is None:
        args.frameworks=prompt(
            "Frameworks, comma separated",
        )

    if args.dependencies is None:
        args.dependencies=prompt(
            "Dependencies, comma separated",
        )

    if args.note is None:
        args.note=prompt("Note")

    if args.logo is None:
        logo_value=prompt("Logo image path")
        args.logo=Path(logo_value) if logo_value else None

    if args.featured is None:
        args.featured=prompt_boolean(
            "Featured project",
            default=False,
        )

    return args


def build_project(
    args:argparse.Namespace,
    repo_root:Path,
)->dict[str,Any]:
    category=normalize_category(args.category)
    project_slug=slugify(args.slug or args.title)

    logo=""

    if args.logo:
        logo=install_logo(
            args.logo.resolve(),
            repo_root,
            category,
            project_slug,
            args.logo_dir,
        )
    elif args.logo_url:
        logo=args.logo_url.strip()

    project={
        "slug":project_slug,
        "title":args.title.strip(),
        "blurb":args.description.strip(),
        "href":(
            args.href.strip()
            if args.href
            else f"/projects/{category}/{project_slug}/"
        ),
        "category":category,
        "status":(
            args.status.strip()
            if args.status
            else DEFAULT_STATUS
        ),
        "featured":bool(args.featured),
        "license":(
            args.license.strip()
            if args.license
            else DEFAULT_LICENSE
        ),
        "platforms":parse_csv(args.platforms),
        "tags":parse_csv(args.tags),
        "frameworks":parse_csv(args.frameworks),
        "dependencies":parse_csv(args.dependencies),
        "created":args.created or utc_now(),
        "updated":utc_now(),
    }

    optional_fields={
        "github":args.github,
        "download":args.download,
        "version":args.version,
        "note":args.note,
        "logo":logo,
        "portfolio_href":args.portfolio_href,
    }

    for key,value in optional_fields.items():
        if value:
            project[key]=str(value).strip()

    return project


def add_or_update_project(
    manifest_path:Path,
    project:dict[str,Any],
    *,
    update_existing:bool,
    replace_existing:bool,
    backup:bool,
    indent:int,
)->str:
    manifest=load_json(manifest_path)
    project_key,projects=extract_projects(manifest)
    identity=project_identity(project)

    match_index=None

    for index,existing in enumerate(projects):
        if project_identity(existing)==identity:
            match_index=index
            break

    action="added"

    if match_index is not None:
        if not update_existing and not replace_existing:
            raise ValueError(
                f"Project already exists in {manifest_path}: "
                f"{project.get('title')}"
            )

        if replace_existing:
            projects[match_index]=project
            action="replaced"
        else:
            projects[match_index]=merge_project(
                projects[match_index],
                project,
            )
            action="updated"
    else:
        projects.append(project)

    projects=sort_projects(projects)

    for key in PROJECT_KEYS:
        if key!=project_key:
            manifest.pop(key,None)

    manifest["schema_version"]=str(
        manifest.get(
            "schema_version",
            DEFAULT_SCHEMA_VERSION,
        )
    )
    manifest["category"]=project["category"]
    manifest["project_count"]=len(projects)
    manifest["updated"]=utc_now()
    manifest[project_key]=projects

    if backup:
        timestamp=datetime.now(
            timezone.utc
        ).strftime("%Y%m%dT%H%M%SZ")

        backup_file(
            manifest_path,
            manifest_path.parent/".manifest-backups"/timestamp,
        )

    manifest_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    manifest_path.write_text(
        json.dumps(
            manifest,
            ensure_ascii=False,
            indent=indent,
        )
        +"\n",
        encoding="utf-8",
    )

    return action


def run_master_builder(
    repo_root:Path,
    projects_root:Path,
    builder_path:Path,
)->None:
    import subprocess

    if not builder_path.is_file():
        raise FileNotFoundError(
            f"Master-manifest builder not found: {builder_path}"
        )

    command=[
        sys.executable,
        str(builder_path),
        str(projects_root),
        "--build-only",
    ]

    result=subprocess.run(
        command,
        cwd=repo_root,
        check=False,
    )

    if result.returncode!=0:
        raise RuntimeError(
            f"Master-manifest builder failed with "
            f"exit code {result.returncode}"
        )


def create_parser()->argparse.ArgumentParser:
    parser=argparse.ArgumentParser(
        description=(
            "Add or update a project entry in a ZZX-Labs "
            "category manifest and optionally rebuild the "
            "unified projects/manifest.json."
        )
    )

    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path("."),
        help="Repository root. Default: current directory.",
    )

    parser.add_argument(
        "--projects-root",
        type=Path,
        default=Path("projects"),
        help="Projects directory relative to repository root.",
    )

    parser.add_argument(
        "--category",
        choices=CATEGORY_DIRS,
        help="Destination category manifest.",
    )

    parser.add_argument("--title")
    parser.add_argument("--slug")
    parser.add_argument("--description","--blurb",dest="description")
    parser.add_argument("--href")
    parser.add_argument("--portfolio-href")
    parser.add_argument("--github")
    parser.add_argument("--download")
    parser.add_argument("--version")
    parser.add_argument("--status")
    parser.add_argument("--license")
    parser.add_argument("--tags")
    parser.add_argument("--platforms")
    parser.add_argument("--frameworks")
    parser.add_argument("--dependencies")
    parser.add_argument("--note")
    parser.add_argument("--created")

    parser.add_argument(
        "--logo",
        type=Path,
        help="Local logo or cover image to copy into the repository.",
    )

    parser.add_argument(
        "--logo-url",
        help="Existing public logo URL or repository-relative path.",
    )

    parser.add_argument(
        "--logo-dir",
        type=Path,
        help=(
            "Custom logo destination directory. "
            "Default: static/images/projects/<category>/<slug>/"
        ),
    )

    featured=parser.add_mutually_exclusive_group()

    featured.add_argument(
        "--featured",
        dest="featured",
        action="store_true",
    )

    featured.add_argument(
        "--not-featured",
        dest="featured",
        action="store_false",
    )

    parser.set_defaults(featured=None)

    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Prompt for missing project fields.",
    )

    parser.add_argument(
        "--update",
        action="store_true",
        help="Merge values into an existing project entry.",
    )

    parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace an existing project entry entirely.",
    )

    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not back up the category manifest.",
    )

    parser.add_argument(
        "--no-build",
        action="store_true",
        help="Do not rebuild the unified master manifest.",
    )

    parser.add_argument(
        "--builder",
        type=Path,
        default=Path("tools/build-projects-manifest.py"),
        help="Path to the master-manifest builder.",
    )

    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indentation. Default: 2.",
    )

    parser.add_argument(
        "--print-entry",
        action="store_true",
        help="Print the generated project JSON entry.",
    )

    return parser


def validate_args(args:argparse.Namespace)->None:
    required={
        "--category":args.category,
        "--title":args.title,
        "--description":args.description,
    }

    missing=[
        name
        for name,value in required.items()
        if not value
    ]

    if missing:
        raise ValueError(
            "Missing required arguments: "
            +", ".join(missing)
            +". Use --interactive to be prompted."
        )

    if args.logo and args.logo_url:
        raise ValueError(
            "Use either --logo or --logo-url, not both."
        )

    if args.update and args.replace:
        raise ValueError(
            "Use either --update or --replace, not both."
        )


def main()->int:
    parser=create_parser()
    args=parser.parse_args()

    repo_root=args.repo_root.resolve()

    if not repo_root.is_dir():
        parser.error(
            f"Repository root does not exist: {repo_root}"
        )

    projects_root=(
        args.projects_root.resolve()
        if args.projects_root.is_absolute()
        else repo_root/args.projects_root
    )

    if args.logo_dir and not args.logo_dir.is_absolute():
        args.logo_dir=repo_root/args.logo_dir

    if args.interactive:
        args=interactive_values(args)

    try:
        validate_args(args)

        category=normalize_category(args.category)
        category_manifest=(
            projects_root
            /category
            /"manifest.json"
        )

        project=build_project(
            args,
            repo_root,
        )

        action=add_or_update_project(
            category_manifest,
            project,
            update_existing=args.update,
            replace_existing=args.replace,
            backup=not args.no_backup,
            indent=args.indent,
        )

        print(
            f"{action}: "
            f"{project['title']} "
            f"-> {category_manifest}"
        )

        if args.print_entry:
            print(
                json.dumps(
                    project,
                    ensure_ascii=False,
                    indent=args.indent,
                )
            )

        if not args.no_build:
            builder=(
                args.builder.resolve()
                if args.builder.is_absolute()
                else repo_root/args.builder
            )

            run_master_builder(
                repo_root,
                projects_root,
                builder,
            )

            print(
                f"rebuilt: "
                f"{projects_root/'manifest.json'}"
            )

        return 0

    except (
        ValueError,
        FileNotFoundError,
        RuntimeError,
        OSError,
    ) as exc:
        print(
            f"error: {exc}",
            file=sys.stderr,
        )
        return 1


if __name__=="__main__":
    raise SystemExit(main())
