#!/usr/bin/env python3
"""Write Query DS library icon SVGs + registries when Figma MCP asset URLs fail.

Geometry is authored for this repo (24×24, currentColor). When Dev Mode MCP
serves http://127.0.0.1:3845/assets/*.svg again, prefer tools/figma_batch_import_icons.py
for pixel-accurate exports from saved .figma-batch-*-design.txt dumps.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "src" / "assets" / "icons"

S = 2  # stroke width aligned with chevron-down.svg


def svg_filled(paths: list[str]) -> str:
    inner = "".join(f'<path fill="currentColor" d="{d}"/>' for d in paths)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">{inner}</svg>'
    )


def svg_stroke(paths: list[str]) -> str:
    parts = []
    for d in paths:
        parts.append(
            f'<path d="{d}" fill="none" stroke="currentColor" stroke-width="{S}" '
            f'stroke-linecap="round" stroke-linejoin="round" />'
        )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        + "".join(parts)
        + "</svg>"
    )


def svg_stroke_one(d: str) -> str:
    return svg_stroke([d])


# --- Navigation elements (filled / mixed; match filled misc + query-ds-dns tone) ---
NAV: dict[str, str] = {
    "nav-dashboards-filled": svg_filled(
        ["M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"]
    ),
    "nav-dashboards-outline": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>'
        '<rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>'
        '<rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>'
        '<rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>'
        "</svg>"
    ),
    "nav-collapse": svg_stroke_one("M7 14l5-5 5 5"),
    "nav-expand": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<g transform="rotate(180 12 12)">'
        '<path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round" />'
        "</g></svg>"
    ),
    "nav-chat": svg_filled(
        [
            "M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"
        ]
    ),
    "nav-automations": svg_filled(
        [
            "M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96c-.5-.38-1.05-.7-1.64-.94l-.36-2.54A.5.5 0 0014 2h-4a.5.5 0 00-.49.42l-.36 2.54c-.59.24-1.14.56-1.64.94l-2.39-.96a.5.5 0 00-.6.22L2.6 8.44a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.14.24.42.34.68.22l2.39-.96c.5.38 1.05.7 1.64.94l.36 2.54c.05.28.29.48.57.48h4c.28 0 .52-.2.57-.48l.36-2.54c.59-.24 1.14-.56 1.64-.94l2.39.96c.26.11.54.01.68-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"
        ]
    ),
    "nav-alerts-filled": svg_filled(
        [
            "M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5L4 18v1h16v-1l-2-2z"
        ]
    ),
    "nav-alerts-outline": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z" fill="currentColor"/>'
        '<path d="M18 16V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" '
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
        "</svg>"
    ),
    "nav-advanced-search": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="2"/>'
        '<path d="M15 15l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M5 7h2M5 10h3M5 13h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "nav-quick-help": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M9.09 9a3 3 0 115.82 1c0 2-3 2-3 4" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>'
        "</svg>"
    ),
    "nav-notifications": svg_filled(
        [
            "M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5L4 18v1h16v-1l-2-2z"
        ]
    ),
    "nav-investigations-filled": svg_filled(
        ["M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"]
    ),
    "nav-investigations-outline": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" '
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
        "</svg>"
    ),
    "nav-integrations": svg_filled(
        [
            "M12 2a3 3 0 00-3 3v2H7a2 2 0 00-2 2v2H3a3 3 0 000 6h2v2a2 2 0 002 2h2v2a3 3 0 006 0v-2h2a2 2 0 002-2v-2h2a3 3 0 000-6h-2V9a2 2 0 00-2-2h-2V5a3 3 0 00-3-3z"
        ]
    ),
    "nav-endpoint": svg_filled(
        [
            "M4 6h16v10H4V6zm2 2v6h12V8H6zm2 14h8v2H8v-2z"
        ]
    ),
    "nav-downloads": svg_stroke_one("M12 4v10m0 0l-3.5-3.5M12 14l3.5-3.5M5 18h14"),
    "nav-intercom": svg_stroke(
        [
            "M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4v5H8v-5z",
            "M6 12v5",
            "M18 12v5",
        ]
    ),
    "nav-favorite": svg_filled(
        [
            "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        ]
    ),
    "nav-tools-filled": svg_filled(
        [
            "M22.7 19.13l-1.05-.84a1.5 1.5 0 01-.21-2.11l.27-.34a1.5 1.5 0 00-.25-2.09l-1.73-1.25a1.5 1.5 0 00-2.02.35l-.27.34a1.5 1.5 0 01-2.11.21l-.84-1.05a1.5 1.5 0 00-2.37-.18L8.5 14.5 3 9l1.41-1.41 5.5 5.5 1.73-1.73a1.5 1.5 0 00-.18-2.37l-1.05-.84a1.5 1.5 0 01-.21-2.11l.34-.27a1.5 1.5 0 012.09-.25l1.25 1.73a1.5 1.5 0 01-.35 2.02l-.34.27a1.5 1.5 0 01-.21 2.11l1.05.84a1.5 1.5 0 002.37.18L21 3l3 3-5.87 5.87a1.5 1.5 0 00-.18 2.37z"
        ]
    ),
    "nav-tools": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76a1 1 0 000 1.4z" '
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        "</svg>"
    ),
    "nav-tenant-settings": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>'
        '<path d="M12 1v2M12 21v2M4.22 4.22l1.41 1.41M18.37 18.37l1.41 1.41M1 12h2M21 12h2M4.22 19.78l1.41-1.41M18.37 5.63l1.41-1.41" '
        'stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "nav-reports-filled": svg_filled(
        ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm0 2.5L18.5 9H14V4.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"]
    ),
    "nav-reports": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" '
        'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
        '<path d="M14 4.5V9h4.5M8 12h8M8 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "nav-detections": svg_stroke(
        [
            "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z",
            "M12 8v4l2.5 2.5",
        ]
    ),
    "nav-applications-horizontal": svg_filled(
        ["M4 8h16v3H4V8zm0 5h10v3H4v-3z"]
    ),
    "nav-applications-stacked": svg_filled(
        ["M6 5h12v4H6V5zm0 6h12v4H6v-4zm0 6h12v2H6v-2z"]
    ),
    "nav-federated-joins": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M8 12a3 3 0 106 0 3 3 0 00-6 0z" stroke="currentColor" stroke-width="2"/>'
        '<path d="M16 8a3 3 0 10-6 0M16 16a3 3 0 10-6 0M11 12h5" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round"/>'
        "</svg>"
    ),
    "nav-summary-insights": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M4 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M9 19V10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M14 19V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M19 19V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M4 19h15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "nav-connections": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="6" cy="6" r="2.5" fill="currentColor"/>'
        '<circle cx="18" cy="6" r="2.5" fill="currentColor"/>'
        '<circle cx="12" cy="18" r="2.5" fill="currentColor"/>'
        '<path d="M7.5 7.5L11 16M16.5 7.5L13 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "nav-logout": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M10 5H5v14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        '<path d="M14 8l4 4-4 4M9 12h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
}

# --- Navigation arrows / chrome (stroke) ---
NAVI: dict[str, str] = {
    "navi-expand-less": svg_stroke_one("M7 14l5-5 5 5"),
    "navi-chevron-right": svg_stroke_one("M10 7l5 5-5 5"),
    "navi-chevron-left": svg_stroke_one("M14 7l-5 5 5 5"),
    "navi-arrow-upward": svg_stroke_one("M12 19V5M8 9l4-4 4 4"),
    "navi-arrow-drop-up": svg_filled(["M8 14h8l-4-6z"]),
    "navi-arrow-drop-down": svg_filled(["M8 10h8l-4 6z"]),
    "navi-arrow-downward": svg_stroke_one("M12 5v14M8 15l4 4 4-4"),
    "navi-expand-more": svg_stroke_one("M7 10l5 5 5-5"),
    "navi-more-vert": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="12" cy="6" r="2" fill="currentColor"/>'
        '<circle cx="12" cy="12" r="2" fill="currentColor"/>'
        '<circle cx="12" cy="18" r="2" fill="currentColor"/>'
        "</svg>"
    ),
    "navi-refresh": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M21 12a9 9 0 11-2.64-6.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "navi-subdirectory-arrow-right": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M8 6v9c0 1.66 1.34 3 3 3h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M14 15l3-3-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "navi-double-chevron": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M8 7l4 5-4 5M14 7l4 5-4 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "navi-replay": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M4 12a8 8 0 0114.5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M19 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
}

SNOOZE_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
    '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>'
    '<path d="M12 8v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    '<path d="M4 4l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    "</svg>"
)

# --- Extra frame ---
EXTRA: dict[str, str] = {
    "extra-lock": svg_filled(
        ["M17 9V7a5 5 0 00-10 0v2H5v12h14V9h-2zm-8-2a3 3 0 016 0v2H9V7z"]
    ),
    "extra-local-offer": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M21 11l-8-8H4v9l8 8 9-9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
        '<circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/>'
        "</svg>"
    ),
    "extra-flaky": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M8 3v4M16 3v4M5 9h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-dasharray="2 3"/>'
        '<path d="M13 13l-2 8M10 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-fingerprint": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 3a9 9 0 019 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M12 7a5 5 0 015 5v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M12 11a1 1 0 011 1v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M8 14a4 4 0 014-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-email": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2"/>'
        '<path d="M3 8l9 6 9-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "extra-do-not-disturb-on": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>'
        '<path d="M7 7l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<circle cx="12" cy="12" r="3" fill="currentColor"/>'
        "</svg>"
    ),
    "extra-discover": svg_stroke_one("M12 3a7 7 0 107 7M16.65 16.65L21 21"),
    "extra-content-paste": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M9 4h6a1 1 0 011 1v1h3a1 1 0 011 1v13a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h3V5a1 1 0 011-1z" '
        'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
        '<path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-share": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="2"/>'
        '<circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="2"/>'
        '<circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="2"/>'
        '<path d="M8.5 10.5l7-3M8.5 13.5l7 3" stroke="currentColor" stroke-width="2"/>'
        "</svg>"
    ),
    "extra-security": svg_filled(
        ["M12 2L4 5v6.09C4 16.14 7.41 20.03 12 22c4.59-1.97 8-5.86 8-10.91V5l-8-3z"]
    ),
    "extra-power-off": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 2v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M7 5a9 9 0 1010 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M5 19L19 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-person-add": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="2"/>'
        '<path d="M4 19c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round"/>'
        '<path d="M17 11v4M19 13h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-note-add": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" '
        'stroke-width="2" stroke-linejoin="round"/>'
        '<path d="M14 3v5h5M12 14v4M10 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-menu": svg_stroke(
        ["M5 7h14", "M5 12h14", "M5 17h14"],
    ),
    "extra-low-priority": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M5 6h8v3H5V6zm0 5h12v3H5v-3zm0 5h16v3H5v-3z" fill="currentColor"/>'
        '<path d="M17 8l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "extra-lock-open": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M15 11V7a3 3 0 00-6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<rect x="5" y="11" width="14" height="10" rx="1" stroke="currentColor" stroke-width="2"/>'
        '<circle cx="12" cy="16" r="1.5" fill="currentColor"/>'
        "</svg>"
    ),
    "extra-bookmark": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M6 4v16l6-4 6 4V4a2 2 0 00-2-2H8a2 2 0 00-2 2z" fill="currentColor" opacity="0.35"/>'
        '<path d="M6 4v16l6-4 6 4V4a2 2 0 00-2-2H8a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2" '
        'stroke-linejoin="round" fill="none"/>'
        "</svg>"
    ),
    "extra-data-exploration": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="2"/>'
        '<circle cx="16" cy="16" r="3" stroke="currentColor" stroke-width="2"/>'
        '<path d="M10.5 10.5l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M4 20h4M16 4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        "</svg>"
    ),
    "extra-snooze": SNOOZE_SVG,
    "extra-snooze-alt": SNOOZE_SVG,
    "extra-push-pin": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 2l2 7H22l-6 4.5L18 22l-6-4-6 4 2-8.5L2 9h8l2-7z" stroke="currentColor" stroke-width="2" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "extra-test": svg_stroke_one("M8 5h8l-1 14H9L8 5zm4-2v2M10 19h4"),
    "extra-verified": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>'
        '<path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round"/>'
        "</svg>"
    ),
    "extra-track-changes": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<path d="M12 8v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M4 4v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>'
        "</svg>"
    ),
    "extra-stop-circle": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>'
        '<rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>'
        "</svg>"
    ),
}


def var_name(key: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "_", key).strip("_")


def emit_registry(
    fname: str,
    pairs: list[tuple[str, str]],
    const: str,
    typ: str,
    raw: str,
) -> None:
    pairs = sorted(pairs, key=lambda x: x[0])
    lines = [
        "// Generated by tools/generate_fallback_query_ds_icons.py",
        "// Replace with figma_batch_import_icons.py output when MCP assets return 200.",
        "",
    ]
    for key, rel in pairs:
        lines.append(f'import {var_name(key)} from "./{rel}?raw";')
    lines.append("")
    lines.append(f"export const {const} = {json.dumps([k for k, _ in pairs])} as const;")
    lines.append("")
    lines.append(f"export type {typ} = (typeof {const})[number];")
    lines.append("")
    lines.append(f"export const {raw}: Record<{typ}, string> = {{")
    for key, _rel in pairs:
        lines.append(f'  "{key}": {var_name(key)},')
    lines.append("};")
    lines.append("")
    (ICONS / fname).write_text("\n".join(lines))


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    nav_pairs: list[tuple[str, str]] = []
    for key, xml in sorted(NAV.items()):
        fn = f"{key}.svg"
        (ICONS / fn).write_text(xml + "\n")
        nav_pairs.append((key, fn))

    navi_pairs: list[tuple[str, str]] = []
    for key, xml in sorted(NAVI.items()):
        fn = f"{key}.svg"
        (ICONS / fn).write_text(xml + "\n")
        navi_pairs.append((key, fn))

    extra_pairs: list[tuple[str, str]] = []
    for key, xml in sorted(EXTRA.items()):
        fn = f"{key}.svg"
        (ICONS / fn).write_text(xml + "\n")
        extra_pairs.append((key, fn))

    emit_registry(
        "nav-elements-icons.ts",
        nav_pairs,
        "NAV_ELEMENT_ICON_NAMES",
        "NavElementIconName",
        "NAV_ELEMENT_RAW_BY_NAME",
    )
    emit_registry(
        "navi-icons.ts",
        navi_pairs,
        "NAVI_ICON_NAMES",
        "NaviIconName",
        "NAVI_RAW_BY_NAME",
    )
    emit_registry(
        "extra-icons.ts",
        extra_pairs,
        "EXTRA_ICON_NAMES",
        "ExtraIconName",
        "EXTRA_RAW_BY_NAME",
    )
    print("Wrote", len(nav_pairs), "nav,", len(navi_pairs), "navi,", len(extra_pairs), "extra icons")


if __name__ == "__main__":
    main()
