#!/usr/bin/env python3
"""
Generate per-event-class OCSF schema data for the connector schema-mapping wizard.

Fetches class/object/dictionary definitions from https://schema.ocsf.io/api
(default served version, currently 1.9.0) and emits one TypeScript data file
per OCSF event class under src/data/ocsf/generated/, plus an eagerly-bundled
aggregate of small demo source-field rows at
src/data/ocsf/ocsfDemoSourceFields.generated.ts.

http_activity is intentionally excluded — it already has a hand-built,
higher-fidelity set of files (httpActivityFullSchema.ts,
httpActivityMapSchemaEntities.ts, httpActivityArrayPaths.generated.ts,
httpActivityDemoSourceFields.ts) that this script does not touch.

Re-run this script to regenerate after an OCSF schema update:
    python3 tools/generate_ocsf_class_schemas.py
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

API_BASE = "https://schema.ocsf.io/api"
REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "src" / "data" / "ocsf" / "generated"
DEMO_FIELDS_OUT = REPO_ROOT / "src" / "data" / "ocsf" / "ocsfDemoSourceFields.generated.ts"
REGISTRY_OUT = REPO_ROOT / "src" / "data" / "ocsf" / "ocsfClassSchemaRegistry.generated.ts"

MAX_DEPTH = 3

# A few classes live in OCSF extensions and 404 on the plain /classes/<name> path;
# they need an extension-qualified path (/classes/<extension>/<name>).
CLASS_ID_EXTENSION_OVERRIDES = {
    "registry_key_activity": "win",
    "registry_value_activity": "win",
    "windows_resource_activity": "win",
    "windows_service_activity": "win",
}

# Local event-class ids from src/data/searchEntityOptions.ts (SEARCH_EVENT_CATEGORIES),
# excluding http_activity which already has bespoke hand-built files.
EVENT_CLASS_IDS = [
    "event_log_actvity", "file_activity", "kernel_activity", "kernel_extension_activity",
    "memory_activity", "module_activity", "peripheral_activity", "process_activity",
    "registry_key_activity", "registry_value_activity", "scheduled_job_activity",
    "script_activity", "windows_resource_activity", "windows_service_activity",
    "application_security_posture_finding", "compliance_finding", "data_security_finding",
    "detection_finding", "iam_analysis_finding", "incident_finding", "security_finding",
    "vulnerability_finding",
    "account_change", "authentication", "authorize_session", "entity_management",
    "group_management", "user_access",
    "dhcp_activity", "dns_activity", "email_activity", "email_file_activity",
    "email_url_activity", "ftp_activity", "network_activity", "network_file_activity",
    "ntp_activity", "rdp_activity", "smb_activity", "ssh_activity", "tunnel_activity",
    "inventory_info", "user_inventory", "patch_state", "device_config_state_change",
    "software_info", "osint_inventory_info", "cloud_resources_inventory_info",
    "evidence_info",
    "api_activity", "application_error", "application_lifecycle", "datastore_activity",
    "file_hosting", "scan_activity", "web_resource_access_activity", "web_resources_activity",
    "file_remediation_activity", "network_remediation_activity",
    "process_remediation_activity", "remediation_activity",
    "airborne_broadcast_activity", "drone_flights_activity",
]

# Observable Type ID (schema.ocsf.io /api/objects/observable, type_id enum) -> this app's
# local entity id (src/data/searchEntityOptions.ts SEARCH_ENTITY_COLUMNS). Whole-object
# observables (User, File, Process, Email, Container, Fingerprint, Endpoint, Geo Location,
# Registry Key, Device, Network Endpoint, IAM Role, ...) are intentionally omitted — this
# app maps leaf scalar fields, not whole nested objects.
OBSERVABLE_ID_TO_ENTITY = {
    1: "hostname",
    2: "ip-address",
    3: "mac-address",
    4: "user-name",
    5: "email-address",
    6: "url",
    7: "filename",
    8: "file-hash",
    9: "process-name",
    10: "resource-id",
    11: "port",
    12: "subnet",
    13: "command-line",
    14: "country",
    15: "process-id",
    16: "user-agent",
    17: "cwe-id",
    18: "cve-id",
    19: "credential-id",
    23: "url",
    31: "user-id",
    32: "group-name",
    33: "group-id",
    34: "account-name",
    35: "account-id",
    36: "script-content",
    37: "serial-number",
    38: "resource-name",
    39: "process-uid",
    40: "email-subject",
    41: "email-uid",
    42: "email-message-uid",
    43: "registry-value-name",
    44: "advisory-id",
}

ENTITY_LABELS = {
    "account-id": "Account ID",
    "account-name": "Account Name",
    "advisory-id": "Advisory ID",
    "command-line": "Command Line",
    "country": "Country",
    "credential-id": "Credential ID",
    "cve-id": "CVE ID",
    "cwe-id": "CWE ID",
    "email-address": "Email Address",
    "email-message-uid": "Email Message UID",
    "email-subject": "Email Subject",
    "email-uid": "Email UID",
    "file-hash": "File Hash",
    "filename": "Filename",
    "group-id": "Group ID",
    "group-name": "Group Name",
    "hostname": "Hostname",
    "ip-address": "IP Address",
    "mac-address": "MAC Address",
    "port": "Port",
    "process-id": "Process ID",
    "process-name": "Process Name",
    "process-uid": "Process UID",
    "registry-value-name": "Registry Value Name",
    "resource-id": "Resource ID",
    "resource-name": "Resource Name",
    "script-content": "Script Content",
    "serial-number": "Serial Number",
    "subnet": "Subnet",
    "url": "URL",
    "user-agent": "User Agent",
    "user-id": "User ID",
    "user-name": "User Name",
}


def fetch_json(path):
    url = f"{API_BASE}{path}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


_object_cache = {}


def get_object(name):
    if name not in _object_cache:
        try:
            _object_cache[name] = fetch_json(f"/objects/{name}")
        except Exception as exc:  # noqa: BLE001
            print(f"    warn: failed to fetch object '{name}': {exc}", file=sys.stderr)
            _object_cache[name] = {"attributes": {}}
    return _object_cache[name]


def resolve_observable(attr_def, dict_attr_name, dictionary):
    if "observable" in attr_def:
        return attr_def["observable"]
    dict_attr = dictionary["attributes"].get(dict_attr_name)
    if dict_attr and "observable" in dict_attr:
        return dict_attr["observable"]
    type_name = attr_def.get("type")
    if type_name:
        type_def = dictionary["types"]["attributes"].get(type_name)
        if type_def and "observable" in type_def:
            return type_def["observable"]
    return None


def to_camel(snake):
    parts = snake.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def js_str(s):
    return json.dumps(s)


def sample_value_for(attr_def, leaf_name):
    if attr_def.get("enum"):
        numeric_items = [(k, v) for k, v in attr_def["enum"].items() if re.fullmatch(r"-?\d+", k)]
        if numeric_items:
            first = sorted(numeric_items, key=lambda kv: int(kv[0]))[0][1]
            return first.get("caption", "Unknown")
        any_value = next(iter(attr_def["enum"].values()))
        return any_value.get("caption", "Unknown")
    t = attr_def.get("type")
    lname = leaf_name.lower()
    if t in ("integer_t", "long_t"):
        return "42"
    if t == "boolean_t":
        return "true"
    if t == "float_t":
        return "3.14"
    if t == "datetime_t" or "time" in lname:
        return "2024-06-01T12:00:00Z"
    if "ip" == lname or lname.endswith("_ip") or lname == "ip":
        return "10.0.4.12"
    if "mac" in lname:
        return "00:1a:2b:3c:4d:5e"
    if "port" in lname:
        return "443"
    if "email" in lname:
        return "user@example.com"
    if "url" in lname or "uri" in lname:
        return "https://example.com/resource"
    if "hash" in lname:
        return "8f14e45fceea167a5a36dedd4bea2543"
    if "path" in lname or "file" in lname:
        return "C:\\Users\\Public\\update.exe"
    if "country" in lname:
        return "US"
    if "name" in lname or "hostname" in lname or "domain" in lname:
        return "example-host-01"
    if "uid" in lname or lname.endswith("id"):
        return "id-4821"
    if "message" in lname or "desc" in lname:
        return "Sample event description"
    return "sample-value"


def expand_class(class_name, class_attrs, dictionary):
    full_paths = set()
    entity_paths = {}  # entity_id -> set(paths)
    enum_fields = {}  # leaf_name -> [{id,label}]
    array_field_names = set()
    string_array_field_names = set()
    show_all_attributes = []  # top-level only, in schema order
    object_root_names = set()
    demo_candidates = []  # (priority, leaf_name, sample)

    def add_entity_path(entity_id, path):
        entity_paths.setdefault(entity_id, set()).add(path)

    def walk(attrs_dict, path_prefix, chain, depth, is_top_level):
        for name, attr_def in attrs_dict.items():
            path = f"{path_prefix}.{name}" if path_prefix else name
            is_array = bool(attr_def.get("is_array"))
            attr_type = attr_def.get("type")

            if is_top_level:
                # Only "time" is required in this app's mapper UX (matches http_activity's
                # hand-built HTTP_ACTIVITY_SHOW_ALL_ATTRIBUTES and the "Basic Mode has one
                # required field: Event Time" copy) — OCSF's own "required"/"recommended"/
                # "optional" designation is not used here.
                required = name == "time"
                show_all_attributes.append({
                    "name": name,
                    "label": f"{name}*" if required else None,
                    "required": required,
                    "group": attr_def.get("group") or "context",
                })

            if attr_type == "object_t":
                obj_name = attr_def.get("object_type")
                if is_top_level:
                    object_root_names.add(name.lower())
                if is_array:
                    array_field_names.add(name.lower())
                if obj_name and obj_name not in chain and depth < MAX_DEPTH:
                    obj = get_object(obj_name)
                    walk(obj.get("attributes", {}), path, chain | {obj_name}, depth + 1, False)
                continue

            # leaf (scalar) attribute
            full_paths.add(path)
            if is_array:
                array_field_names.add(name.lower())
                string_array_field_names.add(name.lower())

            if attr_def.get("enum"):
                leaf = name.lower()
                numeric_entries = [
                    {"id": int(k), "label": v.get("caption", str(k))}
                    for k, v in attr_def["enum"].items()
                    if re.fullmatch(r"-?\d+", k)
                ]
                if numeric_entries:
                    enum_fields[leaf] = sorted(numeric_entries, key=lambda e: e["id"])

            obs_id = resolve_observable(attr_def, name, dictionary)
            entity_hit = False
            if obs_id is not None:
                entity_id = OBSERVABLE_ID_TO_ENTITY.get(obs_id)
                if entity_id:
                    add_entity_path(entity_id, path)
                    entity_hit = True

            if depth <= 1 and not is_array:
                group = attr_def.get("group")
                priority = 0 if entity_hit else (1 if group in ("classification", "occurrence") else 2)
                demo_candidates.append((priority, name.lower(), sample_value_for(attr_def, name.lower())))

    walk(class_attrs, "", set(), 0, True)
    return {
        "full_paths": full_paths,
        "entity_paths": entity_paths,
        "enum_fields": enum_fields,
        "array_field_names": array_field_names,
        "string_array_field_names": string_array_field_names,
        "show_all_attributes": show_all_attributes,
        "object_root_names": object_root_names,
        "demo_candidates": demo_candidates,
    }


def build_demo_source_fields(demo_candidates, limit=18):
    demo_candidates = sorted(demo_candidates, key=lambda c: c[0])
    seen = set()
    rows = []
    for _priority, leaf, sample in demo_candidates:
        if leaf in seen:
            continue
        seen.add(leaf)
        rows.append({"source": leaf, "sample": sample})
        if len(rows) >= limit:
            break
    return rows


def emit_class_file(class_id, class_caption, class_uid, result):
    camel = to_camel(class_id)
    lines = []
    lines.append("/**")
    lines.append(f" * Generated OCSF class schema — {class_caption} (class {class_uid}).")
    lines.append(f" * Source: https://schema.ocsf.io/api/classes/{class_id} (schema.ocsf.io, v1.9.0)")
    lines.append(" * Generated by tools/generate_ocsf_class_schemas.py — do not edit by hand.")
    lines.append(" */")
    lines.append('import type { OcsfGeneratedClassData } from "../ocsfSchemaAccessor";')
    lines.append("")

    full_paths = sorted(result["full_paths"])
    lines.append("const FULL_SCHEMA_PATHS: readonly string[] = [")
    for p in full_paths:
        lines.append(f"  {js_str(p)},")
    lines.append("];")
    lines.append("")

    lines.append("const ENTITIES: OcsfGeneratedClassData[\"entities\"] = [")
    for entity_id in sorted(result["entity_paths"].keys()):
        paths = sorted(result["entity_paths"][entity_id])
        label = ENTITY_LABELS[entity_id]
        paths_js = ", ".join(js_str(p) for p in paths)
        lines.append("  {")
        lines.append(f"    id: {js_str(entity_id)},")
        lines.append(f"    label: {js_str(label)},")
        lines.append(f"    paths: [{paths_js}],")
        lines.append("  },")
    lines.append("];")
    lines.append("")

    lines.append("const ENUM_FIELDS: OcsfGeneratedClassData[\"enumFields\"] = {")
    for leaf in sorted(result["enum_fields"].keys()):
        values = result["enum_fields"][leaf]
        values_js = ", ".join(f'{{ id: {v["id"]}, label: {js_str(v["label"])} }}' for v in values)
        lines.append(f"  {js_str(leaf)}: [{values_js}],")
    lines.append("};")
    lines.append("")

    array_names_js = ", ".join(js_str(n) for n in sorted(result["array_field_names"]))
    lines.append(f"const ARRAY_FIELD_NAMES: readonly string[] = [{array_names_js}];")
    string_array_names_js = ", ".join(js_str(n) for n in sorted(result["string_array_field_names"]))
    lines.append(f"const STRING_ARRAY_FIELD_NAMES: readonly string[] = [{string_array_names_js}];")
    object_root_js = ", ".join(js_str(n) for n in sorted(result["object_root_names"]))
    lines.append(f"const OBJECT_ROOT_NAMES: readonly string[] = [{object_root_js}];")
    lines.append("")

    lines.append("const SHOW_ALL_ATTRIBUTES: OcsfGeneratedClassData[\"showAllAttributes\"] = [")
    for attr in result["show_all_attributes"]:
        label_js = js_str(attr["label"]) if attr["label"] else "undefined"
        entry = f'{{ name: {js_str(attr["name"])}, group: {js_str(attr["group"])}'
        if attr["required"]:
            entry += ", required: true"
        if attr["label"]:
            entry += f", label: {label_js}"
        entry += " }"
        lines.append(f"  {entry},")
    lines.append("];")
    lines.append("")

    demo_rows = build_demo_source_fields(result["demo_candidates"])
    lines.append("const DEMO_SOURCE_FIELDS: OcsfGeneratedClassData[\"demoSourceFields\"] = [")
    for row in demo_rows:
        lines.append(f'  {{ source: {js_str(row["source"])}, sample: {js_str(row["sample"])} }},')
    lines.append("];")
    lines.append("")

    lines.append("const data: OcsfGeneratedClassData = {")
    lines.append("  fullSchemaPaths: FULL_SCHEMA_PATHS,")
    lines.append("  entities: ENTITIES,")
    lines.append("  enumFields: ENUM_FIELDS,")
    lines.append("  arrayFieldNames: ARRAY_FIELD_NAMES,")
    lines.append("  stringArrayFieldNames: STRING_ARRAY_FIELD_NAMES,")
    lines.append("  showAllAttributes: SHOW_ALL_ATTRIBUTES,")
    lines.append("  objectRootNames: OBJECT_ROOT_NAMES,")
    lines.append("  demoSourceFields: DEMO_SOURCE_FIELDS,")
    lines.append("};")
    lines.append("")
    lines.append("export default data;")
    lines.append("")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{camel}.generated.ts"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return camel, len(full_paths), len(demo_rows)


def emit_demo_fields_aggregate(all_demo_rows):
    lines = []
    lines.append("/**")
    lines.append(" * Aggregate demo *source* connector fields for every generated OCSF event class.")
    lines.append(" * Kept eager (not dynamically imported) since these are small; the real schema data")
    lines.append(" * for each class lives in src/data/ocsf/generated/*.generated.ts and is code-split.")
    lines.append(" * Generated by tools/generate_ocsf_class_schemas.py — do not edit by hand.")
    lines.append(" */")
    lines.append("")
    lines.append("export type OcsfDemoSourceField = { source: string; sample: string };")
    lines.append("")
    lines.append(
        "export const OCSF_DEMO_SOURCE_FIELDS_BY_CLASS: Readonly<Record<string, readonly OcsfDemoSourceField[]>> = {"
    )
    for class_id in sorted(all_demo_rows.keys()):
        rows = all_demo_rows[class_id]
        rows_js = ", ".join(f'{{ source: {js_str(r["source"])}, sample: {js_str(r["sample"])} }}' for r in rows)
        lines.append(f"  {js_str(class_id)}: [{rows_js}],")
    lines.append("};")
    lines.append("")
    DEMO_FIELDS_OUT.write_text("\n".join(lines), encoding="utf-8")


def emit_registry(camel_by_class_id):
    lines = []
    lines.append("/**")
    lines.append(" * Registry of dynamic import loaders for generated OCSF class schema data.")
    lines.append(" * Generated by tools/generate_ocsf_class_schemas.py — do not edit by hand.")
    lines.append(" */")
    lines.append('import type { OcsfGeneratedClassData } from "./ocsfSchemaAccessor";')
    lines.append("")
    lines.append("export type OcsfGeneratedClassLoader = () => Promise<{ default: OcsfGeneratedClassData }>;")
    lines.append("")
    lines.append(
        "export const OCSF_GENERATED_CLASS_LOADERS: Readonly<Record<string, OcsfGeneratedClassLoader>> = {"
    )
    for class_id in sorted(camel_by_class_id.keys()):
        camel = camel_by_class_id[class_id]
        lines.append(f'  {js_str(class_id)}: () => import("./generated/{camel}.generated"),')
    lines.append("};")
    lines.append("")
    REGISTRY_OUT.write_text("\n".join(lines), encoding="utf-8")


def main():
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    class_ids = only if only else EVENT_CLASS_IDS

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching dictionary...")
    dictionary = fetch_json("/dictionary")

    camel_by_class_id = {}
    all_demo_rows = {}
    failures = []

    for i, class_id in enumerate(class_ids, 1):
        print(f"[{i}/{len(class_ids)}] {class_id} ...")
        extension = CLASS_ID_EXTENSION_OVERRIDES.get(class_id)
        class_path = f"/classes/{extension}/{class_id}" if extension else f"/classes/{class_id}"
        try:
            class_detail = fetch_json(class_path)
        except Exception as exc:  # noqa: BLE001
            print(f"  FAILED to fetch class: {exc}", file=sys.stderr)
            failures.append((class_id, str(exc)))
            continue

        try:
            result = expand_class(class_id, class_detail.get("attributes", {}), dictionary)
            camel, path_count, demo_count = emit_class_file(
                class_id, class_detail.get("caption", class_id), class_detail.get("uid", "?"), result
            )
            camel_by_class_id[class_id] = camel
            all_demo_rows[class_id] = build_demo_source_fields(result["demo_candidates"])
            entity_count = len(result["entity_paths"])
            print(f"    ok: {path_count} paths, {entity_count} entities, {demo_count} demo fields -> {camel}.generated.ts")
        except Exception as exc:  # noqa: BLE001
            print(f"  FAILED to generate: {exc}", file=sys.stderr)
            failures.append((class_id, str(exc)))

    emit_demo_fields_aggregate(all_demo_rows)
    emit_registry(camel_by_class_id)

    print(f"\nDone. {len(camel_by_class_id)}/{len(class_ids)} classes generated.")
    print(f"Objects fetched/cached: {len(_object_cache)}")
    if failures:
        print(f"\n{len(failures)} FAILURES:")
        for class_id, err in failures:
            print(f"  {class_id}: {err}")


if __name__ == "__main__":
    main()
