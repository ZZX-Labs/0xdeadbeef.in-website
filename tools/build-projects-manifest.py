#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

CATEGORY_DIRS=(
    "adult","ai","apps","bitcoin","cyber-investigation","cyber-security",
    "cyber-warfare","firmware","hardware","ml","osint","software","web"
)

def load_json(path:Path)->dict[str,Any]:
    with path.open("r",encoding="utf-8") as handle:
        data=json.load(handle)
    if not isinstance(data,dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data

def extract_projects(data:dict[str,Any])->list[dict[str,Any]]:
    for key in ("projects","items","entries","data","records"):
        value=data.get(key)
        if isinstance(value,list):
            return [item for item in value if isinstance(item,dict)]
        if isinstance(value,dict):
            return [item for item in value.values() if isinstance(item,dict)]
    return []

def normalize_project(project:dict[str,Any],category:str)->dict[str,Any]:
    normalized=dict(project)
    normalized.setdefault("category",category)
    return normalized

def build_master(projects_root:Path)->dict[str,Any]:
    categories=[]
    projects=[]
    seen=set()

    for category in CATEGORY_DIRS:
        manifest_path=projects_root/category/"manifest.json"
        if not manifest_path.is_file():
            print(f"warning: missing {manifest_path}")
            continue

        data=load_json(manifest_path)
        category_projects=extract_projects(data)

        categories.append({
            "name":category,
            "manifest":f"/projects/{category}/manifest.json",
            "count":len(category_projects)
        })

        for project in category_projects:
            normalized=normalize_project(project,category)
            key=(
                str(normalized.get("href") or ""),
                str(normalized.get("slug") or ""),
                category
            )
            if key in seen:
                continue
            seen.add(key)
            projects.append(normalized)

    projects.sort(key=lambda item:(
        str(item.get("category","")).lower(),
        str(item.get("title") or item.get("name") or "").lower()
    ))

    return{
        "schema_version":"1.0",
        "generated_from":"projects/*/manifest.json",
        "categories":categories,
        "project_count":len(projects),
        "projects":projects
    }

def main()->int:
    parser=argparse.ArgumentParser(
        description="Build projects/manifest.json from category manifests."
    )
    parser.add_argument(
        "projects_root",
        nargs="?",
        type=Path,
        default=Path("projects"),
        help="Path to the projects directory."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output file. Defaults to <projects_root>/manifest.json."
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indentation."
    )
    args=parser.parse_args()

    root=args.projects_root.resolve()
    output=(args.output or root/"manifest.json").resolve()
    master=build_master(root)

    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(
        json.dumps(master,ensure_ascii=False,indent=args.indent)+"\n",
        encoding="utf-8"
    )

    print(f"wrote {output}")
    print(f"categories: {len(master['categories'])}")
    print(f"projects: {master['project_count']}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
