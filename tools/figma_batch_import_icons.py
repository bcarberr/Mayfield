#!/usr/bin/env python3
"""Import saved Figma MCP design dumps → src/assets/icons + registry .ts files."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path
from typing import Callable, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "src/assets/icons"

MISC_SCHEMA_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <g fill="currentColor">
    <rect x="4" y="3" width="6" height="6" />
    <rect x="14" y="3" width="6" height="6" />
    <rect x="14" y="14" width="6" height="6" />
    <rect x="9" y="5" width="9" height="2" />
    <rect x="7" y="16" width="11" height="2" />
    <rect x="6" y="9" width="2" height="9" />
  </g>
</svg>
"""


def fetch(url: str) -> str:
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read().decode("utf-8")


def normalize_svg(s: str) -> str:
    s = s.replace('fill="var(--fill-0, black)"', 'fill="currentColor"')
    s = s.replace("fill='var(--fill-0, black)'", 'fill="currentColor"')
    s = re.sub(r'stroke="var\(--stroke-0, black\)"', 'stroke="currentColor"', s)
    return s


def parse_urls(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for m in re.finditer(
        r'const (img\w+) = "(https?://(?:127\.0\.0\.1|localhost):3845/assets/[a-f0-9]+\.svg)";',
        text,
    ):
        if m.group(1) not in out:
            out[m.group(1)] = m.group(2)
    return out


def split_functions(text: str) -> list[tuple[str, str]]:
    cut = re.search(r"\nexport default function", text)
    if cut:
        text = text[: cut.start()]
    parts = re.split(r"\nfunction (\w+)\(", text)
    out: list[tuple[str, str]] = []
    for i in range(1, len(parts), 2):
        out.append((parts[i], parts[i + 1]))
    return out


def first_data_name(body: str) -> Optional[str]:
    m = re.search(r'data-name="([^"]+)"', body)
    return m.group(1) if m else None


def all_img_vars(body: str) -> list[str]:
    return re.findall(r"src=\{(img\w+)\}", body)


def slug(s: str) -> str:
    s = s.replace("&amp;", "and").replace("&", " and ")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-+", "-", s)


def extract_svg_inner(svg: str) -> tuple[str, float, float]:
    m = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S)
    inner = m.group(1).strip() if m else svg.strip()
    vb = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', svg)
    if vb:
        return inner, float(vb.group(1)), float(vb.group(2))
    return inner, 24.0, 24.0


def ensure_download(url: str, tmp: Path) -> None:
    h = url.split("/")[-1]
    p = tmp / h
    if not p.exists():
        p.write_text(fetch(url))


def bookmark_composite(urls: dict[str, str], tmp: Path) -> str:
    u0 = urls["imgBookmark"]
    u1 = urls.get("imgVector14") or urls.get("imgVector")
    ensure_download(u0, tmp)
    ensure_download(u1, tmp)
    h0 = u0.split("/")[-1]
    h1 = u1.split("/")[-1]
    s0 = normalize_svg((tmp / h0).read_text())
    s1 = normalize_svg((tmp / h1).read_text())
    i0, w0, h0_ = extract_svg_inner(s0)
    i1, w1, h1_ = extract_svg_inner(s1)
    x, y, bw, bh = 5.0, 3.0, 14.0, 18.0
    sc = min(bw / w1, bh / h1_)
    tx = x + (bw - w1 * sc) / 2
    ty = y + (bh - h1_ * sc) / 2
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">'
        f"<g>{i0}</g>"
        f'<g transform="translate({tx:.2f} {ty:.2f}) scale({sc:.4f})">{i1}</g>'
        "</svg>"
    )


IconFn = Callable[..., Tuple[Optional[str], str]]

snooze_counter = 0


def process_frame(
    design_path: Path,
    tmp: Path,
    icon_key_fn: IconFn,
    *,
    is_nav4932: bool = False,
) -> list[tuple[str, str]]:
    text = design_path.read_text()
    urls = parse_urls(text)
    for u in urls.values():
        ensure_download(u, tmp)
    rows: list[tuple[str, str]] = []
    for func_name, body in split_functions(text):
        imgs = all_img_vars(body)
        dname = first_data_name(body) or func_name
        if not imgs:
            if func_name == "Schema" or dname == "Schema":
                key, fname = icon_key_fn(func_name, dname, body, [], urls, tmp)
                if key and fname:
                    dest = ICONS / fname
                    dest.write_text(MISC_SCHEMA_SVG)
                    rows.append((key, fname))
            continue
        key, fname = icon_key_fn(func_name, dname, body, imgs, urls, tmp)
        if not key or not fname:
            continue
        dest = ICONS / fname
        if fname == "extra-bookmark.svg":
            dest.write_text(bookmark_composite(urls, tmp))
        elif is_nav4932 and func_name == "Expand":
            h = urls[imgs[0]].split("/")[-1]
            svg = normalize_svg((tmp / h).read_text())
            inner, w, h_ = extract_svg_inner(svg)
            sc = 20 / max(w, h_)
            ox = (24 - w * sc) / 2
            oy = (24 - h_ * sc) / 2
            dest.write_text(
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">'
                f'<g transform="translate(12 12) rotate(180) translate(-12 -12)">'
                f'<g transform="translate({ox:.2f} {oy:.2f}) scale({sc:.4f})">{inner}</g></g></svg>'
            )
        else:
            h = urls[imgs[0]].split("/")[-1]
            dest.write_text(normalize_svg((tmp / h).read_text()))
        rows.append((key, fname))
    return rows


def emit_ts(fname: str, pairs: list[tuple[str, str]], const: str, typ: str, raw: str) -> None:
    pairs = sorted(set(pairs), key=lambda x: x[0])
    lines: list[str] = [
        "// AUTO-GENERATED by tools/figma_batch_import_icons.py",
        "",
    ]
    for key, rel in pairs:
        var = re.sub(r"[^a-zA-Z0-9]", "_", key).strip("_")
        lines.append(f'import {var} from "./{rel}?raw";')
    lines.append("")
    lines.append(f"export const {const} = {json.dumps([k for k, _ in pairs])} as const;")
    lines.append("")
    lines.append(f"export type {typ} = (typeof {const})[number];")
    lines.append("")
    lines.append(f"export const {raw}: Record<{typ}, string> = {{")
    for key, rel in pairs:
        var = re.sub(r"[^a-zA-Z0-9]", "_", key).strip("_")
        lines.append(f'  "{key}": {var},')
    lines.append("};")
    lines.append("")
    (ICONS / fname).write_text("\n".join(lines))


def main() -> None:
    tmp = ROOT / ".tmp-figma-icons"
    tmp.mkdir(exist_ok=True)
    ICONS.mkdir(exist_ok=True)

    slug_map = {
        "PlaylistAdd": "playlist-add",
        "PlayArrowOutline": "play-arrow-outline",
        "PlayArrow": "play-arrow",
        "Map": "map",
        "Flag": "flag",
        "Dns": "dns",
        "DeviceHub": "device-hub",
        "Category": "category",
        "EmailOpen": "email-open",
        "SwapHoriz": "swap-horiz",
        "Repeat": "repeat",
    }

    def misc_fn(func_name: str, dname: str, body: str, imgs: list[str], urls: dict, tmp: Path):
        if func_name == "Schema" or dname == "Schema":
            return "schema", "misc-schema.svg"
        key = slug_map.get(func_name, slug(dname))
        return key, f"misc-{key}.svg"

    nav_seen: dict[str, int] = {}

    def nav_fn(func_name: str, dname: str, body: str, imgs: list[str], urls: dict, tmp: Path):
        special = {
            "Applications1": "nav-applications-stacked",
            "Applications": "nav-applications-horizontal",
        }
        if func_name in special:
            k = special[func_name]
            return k, f"{k}.svg"
        base = slug(dname)
        key = f"nav-{base}"
        if key in nav_seen:
            nav_seen[key] += 1
            key = f"{key}-{nav_seen[key]}"
        else:
            nav_seen[key] = 0
        return key, f"{key}.svg"

    navi_seen: dict[str, int] = {}

    def navi_fn(func_name: str, dname: str, body: str, imgs: list[str], urls: dict, tmp: Path):
        if dname == "Double-Arrow":
            return None, ""
        base = slug(dname)
        key = f"navi-{base}"
        if key in navi_seen:
            navi_seen[key] += 1
            key = f"{key}-{navi_seen[key]}"
        else:
            navi_seen[key] = 0
        return key, f"{key}.svg"

    snooze_state = {"n": 0}

    def extra_fn(func_name: str, dname: str, body: str, imgs: list[str], urls: dict, tmp: Path):
        if func_name == "Bookmark" or dname == "Bookmark":
            return "extra-bookmark", "extra-bookmark.svg"
        if dname == "Snooze":
            snooze_state["n"] += 1
            if snooze_state["n"] == 1:
                return "extra-snooze", "extra-snooze.svg"
            return "extra-snooze-alt", "extra-snooze-alt.svg"
        return "extra-" + slug(dname), f"extra-{slug(dname)}.svg"

    jobs = [
        (ROOT / ".figma-batch-misc-design.txt", misc_fn, False, "misc-technology-icons.ts", "MISC_TECHNOLOGY_RAW_ICON_NAMES", "MiscTechnologyRawIconName", "MISC_TECHNOLOGY_RAW_BY_NAME"),
        (ROOT / ".figma-batch-n4932-design.txt", nav_fn, True, "nav-elements-icons.ts", "NAV_ELEMENT_ICON_NAMES", "NavElementIconName", "NAV_ELEMENT_RAW_BY_NAME"),
        (ROOT / ".figma-batch-n1168-design.txt", navi_fn, False, "navi-icons.ts", "NAVI_ICON_NAMES", "NaviIconName", "NAVI_RAW_BY_NAME"),
        (ROOT / ".figma-batch-n3089-design.txt", extra_fn, False, "extra-icons.ts", "EXTRA_ICON_NAMES", "ExtraIconName", "EXTRA_RAW_BY_NAME"),
    ]
    for path, fn, is4932, tsf, cst, typ, raw in jobs:
        if not path.exists():
            print("skip missing", path)
            continue
        pairs = process_frame(path, tmp, fn, is_nav4932=is4932)
        emit_ts(tsf, pairs, cst, typ, raw)
        print(path.name, "→", len(pairs), "icons", tsf)


if __name__ == "__main__":
    main()
