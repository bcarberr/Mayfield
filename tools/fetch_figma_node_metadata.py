#!/usr/bin/env python3
"""Print Figma node subtree (names, types, ids) for a file + node id.

Requires FIGMA_ACCESS_TOKEN or FIGMA_TOKEN (Personal access token from Figma settings).

Examples:
  export FIGMA_ACCESS_TOKEN=figd_...
  python3 tools/fetch_figma_node_metadata.py 3JF4LGSQMxhkqwMiCvJ8Ip 1175:3335

  python3 tools/fetch_figma_node_metadata.py 3JF4LGSQMxhkqwMiCvJ8Ip 1175:3335 \\
    --out .figma-batch-1175-3335-meta.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any, Optional


def get_token() -> Optional[str]:
    return os.environ.get("FIGMA_ACCESS_TOKEN") or os.environ.get("FIGMA_TOKEN")


def fetch_nodes(file_key: str, node_id: str) -> dict[str, Any]:
    tok = get_token()
    if not tok:
        print(
            "Missing FIGMA_ACCESS_TOKEN or FIGMA_TOKEN in the environment.",
            file=sys.stderr,
        )
        sys.exit(1)
    qid = node_id.replace(":", "%3A")
    url = f"https://api.figma.com/v1/files/{file_key}/nodes?ids={qid}&depth=10"
    req = urllib.request.Request(url, headers={"X-Figma-Token": tok})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(1)


def walk(node: dict[str, Any], depth: int = 0) -> None:
    nid = node.get("id", "")
    name = node.get("name", "")
    typ = node.get("type", "")
    indent = "  " * depth
    # Highlight likely icon leaves
    mark = "*" if typ in ("COMPONENT", "COMPONENT_SET", "VECTOR", "BOOLEAN_OPERATION") else " "
    print(f"{indent}{mark} [{typ}] {name}  ({nid})")
    for ch in node.get("children") or []:
        walk(ch, depth + 1)


def main() -> None:
    ap = argparse.ArgumentParser(description="Fetch Figma nodes JSON and print tree.")
    ap.add_argument("file_key", help="Figma file key from the URL")
    ap.add_argument("node_id", help='Node id, e.g. "1175:3335"')
    ap.add_argument(
        "--out",
        "-o",
        metavar="PATH",
        help="Write full API JSON response to this file",
    )
    args = ap.parse_args()

    data = fetch_nodes(args.file_key, args.node_id)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Wrote {args.out}", file=sys.stderr)

    nodes = data.get("nodes") or {}
    key = args.node_id.replace("-", ":")
    doc = nodes.get(key)
    if not doc:
        print("Node not in response. Keys:", list(nodes.keys()), file=sys.stderr)
        sys.exit(1)

    root = doc.get("document")
    if not root:
        print("No document on node entry", file=sys.stderr)
        sys.exit(1)

    print(f"Frame / root: [{root.get('type')}] {root.get('name')} ({root.get('id')})\n", file=sys.stderr)
    walk(root)


if __name__ == "__main__":
    main()
