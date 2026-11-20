#!/usr/bin/env python3
"""Prepare/check completed DXFs and publish one model with an atomic Git commit.

Python 3.9+, standard library. Publishing requires an already authenticated `gh`.
No login, token storage, background watcher, CAD conversion, or toolpath creation.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import unicodedata
from urllib.parse import quote
import zlib

DEFAULT_REPO = "lemanhlinh1985-cmd/lofihome-updates"
PREFIX = "cnc-library/dxf"
CATALOG_PATH = PREFIX + "/catalog.json"
MODEL_SCHEMA = "lofihome-dxf-v1"
CATALOG_SCHEMA = "lofihome-dxf-catalog-v1"
MAX_DXF = 25 * 1024 * 1024
MAX_PREVIEW = 10 * 1024 * 1024
MAX_JSON = 1024 * 1024
MAX_MODELS = 5000
MAX_API_RESPONSE = 16 * 1024 * 1024
MAX_ID_CHARACTERS = 80
MAX_ID_UTF8_BYTES = 240
SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
GIT_SHA_RE = re.compile(r"[0-9a-f]{40}\Z")
REPO_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*\Z")
RESERVED_NAMES = {"CON", "PRN", "AUX", "NUL"} | {f"COM{i}" for i in range(1, 10)} | {f"LPT{i}" for i in range(1, 10)}
RESERVED_NAMES |= {prefix + digit for prefix in ("COM", "LPT") for digit in "¹²³"}


class SyncError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise SyncError(message)


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode("utf-8")


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def git_blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def valid_id(value):
    require(isinstance(value, str) and 1 <= len(value) <= MAX_ID_CHARACTERS,
            "Model ID must contain 1-80 Unicode characters.")
    require(unicodedata.category(value[0])[0] in ("L", "N") and
            all(c in "._-" or unicodedata.category(c)[0] in ("L", "M", "N") for c in value),
            "Model ID must start with a Unicode letter or number and contain only letters, numbers, combining marks, dot, underscore, or hyphen.")
    require(len(value.encode("utf-8")) <= MAX_ID_UTF8_BYTES, "Model ID exceeds 240 UTF-8 bytes.")
    require(not value.endswith(".") and value.split(".")[0].upper() not in RESERVED_NAMES, "Model ID is not a portable Windows filename.")
    return value


def id_key(value):
    """Comparison only; never rename or normalize a stored filename."""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFC", value).casefold())


def valid_repo(value):
    require(isinstance(value, str) and bool(REPO_RE.fullmatch(value)), "Repository must be owner/repository.")
    return value


def valid_branch(value):
    require(isinstance(value, str) and 0 < len(value) <= 200, "Invalid branch name.")
    require(not any(ord(c) < 33 or ord(c) == 127 or c in "~^:?*[\\" for c in value), "Invalid branch name.")
    require(not any(x in value for x in ("..", "@{", "//")), "Invalid branch name.")
    require(not value.startswith(("-", "/")) and not value.endswith(("/", ".")), "Invalid branch name.")
    require(all(x and not x.startswith(".") and not x.endswith(".lock") for x in value.split("/")), "Invalid branch name.")
    return value


def bounded_read(path, limit):
    path = Path(path)
    require(path.is_file(), f"Missing regular file: {path}")
    require(path.stat().st_size <= limit, f"File exceeds the {limit}-byte limit: {path.name}")
    with path.open("rb") as handle:
        data = handle.read(limit + 1)
    require(len(data) <= limit, f"File grew beyond its size limit: {path.name}")
    return data


def parse_json(data, label):
    require(len(data) <= MAX_JSON, f"{label} exceeds the JSON size limit.")
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, f"Duplicate JSON key in {label}: {key}")
            result[key] = value
        return result
    try:
        value = json.loads(data.decode("utf-8-sig"), object_pairs_hook=pairs,
                           parse_constant=lambda x: (_ for _ in ()).throw(SyncError(f"Non-finite JSON value in {label}.")))
    except (UnicodeError, ValueError, RecursionError) as exc:
        raise SyncError(f"Invalid JSON in {label}.") from exc
    require(isinstance(value, dict), f"{label} must be a JSON object.")
    return value


def safe_local_path(root, relative):
    relative = PurePosixPath(relative)
    require(not relative.is_absolute() and all(x not in ("", ".", "..") for x in relative.parts), "Unsafe relative path.")
    root = Path(root).absolute()
    require(not root.is_symlink(), "The output root must not be a symlink.")
    result = root
    for part in relative.parts:
        result = result / part
        require(not result.is_symlink(), f"Symlink is not allowed in the prepared tree: {relative}")
    return result


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".dxf-sync-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def inspect_dxf(data):
    """Only structural checks. Does not certify contours, topology, or machining."""
    require(0 < len(data) <= MAX_DXF, "DXF is empty or exceeds 25 MiB.")
    require(b"\0" not in data and not data.startswith(b"AutoCAD Binary DXF"), "Only text DXF files are supported.")
    lines = data.decode("latin-1").splitlines()
    if lines and lines[0].startswith("\xef\xbb\xbf"):
        lines[0] = lines[0][3:]
    require(len(lines) % 2 == 0, "DXF has an incomplete group-code/value pair.")
    require(len(lines) <= 4_000_000, "DXF has too many group-code lines.")
    section = None
    expect_section_name = False
    found_eof = False
    entities_sections = 0
    entity_records = 0
    acad_version = None
    header_variable = None
    embedded_units = None
    for index in range(0, len(lines), 2):
        code_text, value = lines[index].strip(), lines[index + 1].strip()
        require(bool(re.fullmatch(r"\d{1,4}", code_text)), f"Invalid DXF group code at line {index + 1}.")
        code = int(code_text)
        require(0 <= code <= 1071, f"Unsupported DXF group code at line {index + 1}.")
        require(not found_eof, "DXF contains data after EOF.")
        if expect_section_name:
            require(code == 2 and bool(re.fullmatch(r"[A-Z][A-Z0-9_]{0,79}", value)), "DXF SECTION is missing its name.")
            section = value
            expect_section_name = False
            entities_sections += int(section == "ENTITIES")
            continue
        if code == 0 and value == "SECTION":
            require(section is None, "DXF contains nested sections.")
            expect_section_name = True
            continue
        if code == 0 and value == "ENDSEC":
            require(section is not None, "DXF ENDSEC appears outside a section.")
            section = None
            continue
        if code == 0 and value == "EOF":
            require(section is None, "DXF EOF appears inside an unfinished section.")
            found_eof = True
            continue
        require(section is not None or code == 999, "DXF contains an item outside a section.")
        if section == "ENTITIES" and code == 0:
            require(bool(value), "DXF has an empty entity type.")
            entity_records += 1
        if section == "HEADER":
            if code == 9:
                header_variable = value
            elif header_variable == "$ACADVER" and code == 1:
                require(bool(re.fullmatch(r"AC\d{4}", value)), "Invalid DXF version identifier.")
                acad_version = value
            elif header_variable == "$INSUNITS" and code == 70:
                try:
                    embedded_units = int(value)
                except ValueError as exc:
                    raise SyncError("Invalid DXF INSUNITS value.") from exc
        if 10 <= code <= 59 or 110 <= code <= 149 or 210 <= code <= 239 or 460 <= code <= 469 or 1010 <= code <= 1059:
            try:
                require(math.isfinite(float(value)), f"Non-finite DXF number at line {index + 2}.")
            except ValueError as exc:
                raise SyncError(f"Invalid DXF number at line {index + 2}.") from exc
    require(found_eof and section is None and not expect_section_name, "DXF is incomplete or has no EOF.")
    require(entities_sections == 1 and entity_records > 0, "DXF must contain one non-empty ENTITIES section.")
    require(embedded_units in (None, 0, 4), "DXF declares units other than millimetres. Convert units in the CAD exporter first.")
    return {"check": "text_structure_only", "cad_geometry_validated": False,
            "acad_version": acad_version, "entity_records": entity_records,
            "embedded_insunits": embedded_units}


def inspect_png(data):
    require(33 <= len(data) <= MAX_PREVIEW and data[:8] == b"\x89PNG\r\n\x1a\n", "Preview must be a PNG under 10 MiB.")
    require(data[8:16] == b"\0\0\0\rIHDR", "PNG preview has no standard IHDR.")
    width, height = struct.unpack(">II", data[16:24])
    require(0 < width <= 20000 and 0 < height <= 20000 and width * height <= 100_000_000, "PNG dimensions exceed the preview limit.")
    depth, colour, compression, filtering, interlace = data[24:29]
    allowed_depths = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
    require(depth in allowed_depths.get(colour, ()) and compression == 0 and filtering == 0 and interlace in (0, 1), "Invalid PNG image header.")
    offset, chunks, idat, iend, plte = 8, 0, False, False, False
    while offset < len(data):
        require(offset + 12 <= len(data) and chunks < 10000 and not iend, "Truncated or oversized PNG chunk stream.")
        size = struct.unpack(">I", data[offset:offset + 4])[0]
        end = offset + size + 12
        require(end <= len(data), "Truncated PNG chunk.")
        kind = data[offset + 4:offset + 8]
        require(bool(re.fullmatch(rb"[A-Za-z]{4}", kind)), "Invalid PNG chunk type.")
        require(kind != b"IHDR" or chunks == 0, "PNG has a duplicate image header.")
        expected_crc = struct.unpack(">I", data[end - 4:end])[0]
        require(zlib.crc32(data[offset + 4:end - 4]) == expected_crc, "PNG chunk CRC does not match its data.")
        if kind == b"IDAT":
            idat = True
        elif kind == b"PLTE":
            require(not idat and size > 0 and size % 3 == 0 and size <= 768, "Invalid PNG palette.")
            plte = True
        elif kind == b"IEND":
            require(size == 0 and end == len(data), "PNG has an invalid end chunk or trailing data.")
            iend = True
        offset, chunks = end, chunks + 1
    require(idat and iend and (colour != 3 or plte), "PNG is missing required image chunks.")
    return {"width_px": width, "height_px": height}


def download_url(repo, branch, path):
    return "https://raw.githubusercontent.com/" + repo + "/" + quote(branch, safe="") + "/" + quote(path, safe="/")


def asset(path, data, repo, branch):
    return {"path": path, "filename": PurePosixPath(path).name, "bytes": len(data),
            "sha256": sha256(data), "url": download_url(repo, branch, path)}


def empty_catalog(repo, branch):
    return {"schema": CATALOG_SCHEMA, "repository": repo, "branch": branch, "units": "mm", "models": []}


def validate_asset(item, model_id, repo, branch, kind):
    require(isinstance(item, dict), f"Invalid {kind} asset for {model_id}.")
    filename = item.get("filename")
    if kind == "dxf":
        require(isinstance(filename, str) and Path(filename).stem == model_id and Path(filename).suffix.lower() == ".dxf" and "/" not in filename and "\\" not in filename,
                f"DXF filename does not match model ID {model_id}.")
    else:
        require(filename == "preview.png", f"Invalid preview filename for {model_id}.")
    path = f"{PREFIX}/{model_id}/{filename}"
    require(item.get("path") == path, f"Asset path escaped the model directory: {model_id}.")
    require(isinstance(item.get("bytes"), int) and not isinstance(item.get("bytes"), bool) and 0 < item["bytes"] <= (MAX_DXF if kind == "dxf" else MAX_PREVIEW), f"Invalid asset size for {model_id}.")
    require(isinstance(item.get("sha256"), str) and bool(SHA256_RE.fullmatch(item["sha256"])), f"Invalid SHA-256 for {model_id}.")
    require(item.get("url") == download_url(repo, branch, path), f"Unexpected download destination for {model_id}.")


def validate_dimensions(value):
    for name in ("width_mm", "height_mm"):
        if name in value:
            number = value[name]
            require(isinstance(number, (int, float)) and not isinstance(number, bool), f"{name} must be a positive finite number.")
            try:
                valid = math.isfinite(number) and number > 0
            except OverflowError:
                valid = False
            require(valid, f"{name} must be a positive finite number.")


def validate_metadata(meta, repo, branch):
    require(meta.get("schema") == MODEL_SCHEMA, "Unrecognised model metadata schema.")
    model_id = valid_id(meta.get("id"))
    require(meta.get("units") == "mm", "Model units must be mm.")
    require(isinstance(meta.get("title"), str) and 0 < len(meta["title"]) <= 200, "Invalid model title.")
    files = meta.get("files")
    require(isinstance(files, dict) and "dxf" in files and set(files) <= {"dxf", "preview"}, "Invalid model asset list.")
    for kind, item in files.items():
        validate_asset(item, model_id, repo, branch, kind)
    require(meta.get("source_filename") == files["dxf"]["filename"], "Source filename does not match the DXF asset.")
    require(isinstance(meta.get("validation"), dict) and meta["validation"].get("check") == "text_structure_only" and meta["validation"].get("cad_geometry_validated") is False,
            "Metadata must accurately describe its structural-only validation.")
    validate_dimensions(meta)
    return meta


def catalog_entry(meta, meta_data):
    result = {"id": meta["id"], "title": meta["title"], "units": "mm",
              "metadata_path": f"{PREFIX}/{meta['id']}/metadata.json",
              "metadata_sha256": sha256(meta_data), "files": meta["files"]}
    for name in ("width_mm", "height_mm"):
        if name in meta:
            result[name] = meta[name]
    return result


def validate_catalog(catalog, repo, branch):
    require(catalog.get("schema") == CATALOG_SCHEMA and catalog.get("repository") == repo and catalog.get("branch") == branch and catalog.get("units") == "mm", "Catalog schema/repository/branch/units do not match this operation.")
    models = catalog.get("models")
    require(isinstance(models, list) and len(models) <= MAX_MODELS, "Invalid or oversized model catalog.")
    seen = set()
    for item in models:
        require(isinstance(item, dict), "Catalog entry must be an object.")
        model_id = valid_id(item.get("id"))
        require(id_key(model_id) not in seen, f"Duplicate, case-conflicting, or Unicode-equivalent model ID: {model_id}.")
        seen.add(id_key(model_id))
        require(item.get("units") == "mm" and item.get("metadata_path") == f"{PREFIX}/{model_id}/metadata.json", f"Invalid catalog entry for {model_id}.")
        require(isinstance(item.get("title"), str) and 0 < len(item["title"]) <= 200, f"Invalid title for {model_id}.")
        require(isinstance(item.get("metadata_sha256"), str) and bool(SHA256_RE.fullmatch(item["metadata_sha256"])), f"Invalid metadata hash for {model_id}.")
        files = item.get("files")
        require(isinstance(files, dict) and "dxf" in files and set(files) <= {"dxf", "preview"}, f"Invalid catalog assets for {model_id}.")
        for kind, info in files.items():
            validate_asset(info, model_id, repo, branch, kind)
        validate_dimensions(item)
    return catalog


def merge_catalog(catalog, meta, meta_data, repo, branch):
    validate_catalog(catalog, repo, branch)
    model_id = meta["id"]
    require(not any(id_key(x["id"]) == id_key(model_id) and x["id"] != model_id for x in catalog["models"]), "Existing model differs only by filename case or Unicode normalization.")
    merged = dict(catalog)
    merged["models"] = sorted([x for x in catalog["models"] if x["id"] != model_id] + [catalog_entry(meta, meta_data)], key=lambda x: id_key(x["id"]))
    validate_catalog(merged, repo, branch)
    require(len(json_bytes(merged)) <= MAX_JSON, "Merged catalog exceeds 1 MiB.")
    return merged


def load_catalog(root, repo, branch):
    path = safe_local_path(root, CATALOG_PATH)
    if path.exists():
        return validate_catalog(parse_json(bounded_read(path, MAX_JSON), "catalog"), repo, branch)
    return empty_catalog(repo, branch)


def stage(root, dxf_path, unit, repo=DEFAULT_REPO, branch="main", preview=None, width_mm=None, height_mm=None, title=None):
    repo, branch = valid_repo(repo), valid_branch(branch)
    require(unit == "mm", "Explicit --unit mm is required; this utility does not rescale drawings.")
    source = Path(dxf_path)
    require(source.suffix.lower() == ".dxf", "Input must have a .dxf extension.")
    model_id = valid_id(source.stem)
    dxf_data = bounded_read(source, MAX_DXF)
    validation = inspect_dxf(dxf_data)
    dxf_relative = f"{PREFIX}/{model_id}/{source.name}"
    pending = {dxf_relative: dxf_data}
    meta = {"schema": MODEL_SCHEMA, "id": model_id, "title": title or model_id,
            "source_filename": source.name, "units": "mm", "validation": validation,
            "files": {"dxf": asset(dxf_relative, dxf_data, repo, branch)}}
    for name, value in (("width_mm", width_mm), ("height_mm", height_mm)):
        if value is not None:
            meta[name] = value
    if preview is not None:
        png = bounded_read(preview, MAX_PREVIEW)
        info = inspect_png(png)
        relative = f"{PREFIX}/{model_id}/preview.png"
        pending[relative] = png
        meta["files"]["preview"] = asset(relative, png, repo, branch)
        meta["preview_dimensions"] = info
    validate_metadata(meta, repo, branch)
    meta_data = json_bytes(meta)
    meta_path = f"{PREFIX}/{model_id}/metadata.json"
    pending[meta_path] = meta_data
    catalog = merge_catalog(load_catalog(root, repo, branch), meta, meta_data, repo, branch)
    pending[CATALOG_PATH] = json_bytes(catalog)
    # Preflight every destination before writing. Catalog is replaced last.
    destinations = {name: safe_local_path(root, name) for name in pending}
    for name, data in pending.items():
        atomic_write(destinations[name], data)
    return {"status": "staged", "model": model_id, "root": str(Path(root).absolute()),
            "files": sorted(pending), "dxf_sha256": sha256(dxf_data), "geometry_validation": "not_performed_by_this_utility"}


def read_local_model(root, model_id, repo, branch):
    valid_id(model_id)
    relative = f"{PREFIX}/{model_id}/metadata.json"
    meta_data = bounded_read(safe_local_path(root, relative), MAX_JSON)
    meta = validate_metadata(parse_json(meta_data, "model metadata"), repo, branch)
    require(meta["id"] == model_id, "Model metadata ID does not match its directory.")
    files = {relative: meta_data}
    for kind, item in meta["files"].items():
        data = bounded_read(safe_local_path(root, item["path"]), MAX_DXF if kind == "dxf" else MAX_PREVIEW)
        require(len(data) == item["bytes"] and sha256(data) == item["sha256"], f"Hash or size mismatch: {item['path']}")
        if kind == "dxf":
            require(inspect_dxf(data) == meta["validation"], "DXF structural report does not match its metadata.")
        else:
            require(inspect_png(data) == meta.get("preview_dimensions"), "PNG dimensions do not match metadata.")
        files[item["path"]] = data
    return meta, meta_data, files


def check(root, repo=DEFAULT_REPO, branch="main"):
    repo, branch = valid_repo(repo), valid_branch(branch)
    catalog_path = safe_local_path(root, CATALOG_PATH)
    require(catalog_path.is_file(), "Prepared catalog.json is missing.")
    catalog = load_catalog(root, repo, branch)
    require(bool(catalog["models"]), "Prepared catalog is empty.")
    for entry in catalog["models"]:
        meta, meta_data, _ = read_local_model(root, entry["id"], repo, branch)
        require(entry == catalog_entry(meta, meta_data), f"Catalog and metadata do not agree: {entry['id']}")
    return {"status": "checked", "model_count": len(catalog["models"]),
            "models": [x["id"] for x in catalog["models"]], "geometry_validation": "not_performed_by_this_utility"}


class GhApi:
    """Small injectable adapter. Uses gh's existing auth; never reads/stores tokens."""
    def __init__(self):
        self.gh = shutil.which("gh")
        require(bool(self.gh), "GitHub CLI (gh) is missing. No upload was performed.")

    def call(self, method, endpoint, payload=None):
        command = [self.gh, "api", "--hostname", "github.com", "--method", method,
                   "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2026-03-10", endpoint]
        input_data = None
        if payload is not None:
            command += ["--input", "-"]
            input_data = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        environment = os.environ.copy()
        environment["GH_PROMPT_DISABLED"] = "1"
        environment["GIT_TERMINAL_PROMPT"] = "0"
        try:
            result = subprocess.run(command, input=input_data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                    env=environment, timeout=90, check=False)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise SyncError("GitHub CLI request could not complete; inspect GitHub before retrying a publish.") from exc
        if result.returncode:
            match = re.search(rb"HTTP (\d{3})", result.stderr)
            status = f" (HTTP {match.group(1).decode('ascii')})" if match else ""
            raise SyncError(f"GitHub API request failed{status}. Confirm gh authentication and repository write permission. No credentials were requested by this utility.")
        require(len(result.stdout) <= MAX_API_RESPONSE, "GitHub API response exceeds the safety limit.")
        try:
            value = json.loads(result.stdout.decode("utf-8"))
        except (ValueError, UnicodeError) as exc:
            raise SyncError("GitHub returned an invalid JSON response.") from exc
        require(isinstance(value, dict), "GitHub returned an unexpected response shape.")
        return value


class RemoteSnapshot:
    def __init__(self, api, repo, branch):
        self.api, self.repo, self.branch = api, repo, branch
        self.base = f"repos/{repo}"
        self.ref_path = self.base + "/git/ref/heads/" + quote(branch, safe="/")
        info = api.call("GET", self.base)
        require(info.get("full_name", "").lower() == repo.lower(), "GitHub resolved an unexpected repository.")
        require(info.get("permissions", {}).get("push") is True, "The current GitHub identity does not have repository write permission.")
        self.head = self.current_head()
        commit = api.call("GET", self.base + "/git/commits/" + self.head)
        self.tree_sha = self.checked_sha(commit.get("tree", {}).get("sha"))
        self.trees = {}

    @staticmethod
    def checked_sha(value):
        require(isinstance(value, str) and bool(GIT_SHA_RE.fullmatch(value)), "GitHub returned an invalid Git object ID.")
        return value

    def current_head(self):
        value = self.api.call("GET", self.ref_path)
        require(value.get("object", {}).get("type") == "commit", "Target branch does not refer to a commit.")
        return self.checked_sha(value.get("object", {}).get("sha"))

    def tree(self, tree_sha):
        if tree_sha not in self.trees:
            result = self.api.call("GET", self.base + "/git/trees/" + tree_sha)
            require(result.get("truncated") is not True and isinstance(result.get("tree"), list), "GitHub tree is truncated or invalid.")
            require(len(result["tree"]) <= 100000, "GitHub tree exceeds the entry limit.")
            self.trees[tree_sha] = result["tree"]
        return self.trees[tree_sha]

    def entry(self, relative):
        parts = PurePosixPath(relative).parts
        current = self.tree_sha
        for index, part in enumerate(parts):
            matches = [x for x in self.tree(current) if x.get("path") == part]
            require(len(matches) <= 1, "GitHub tree contains a duplicate path.")
            if not matches:
                return None
            item = matches[0]
            if index == len(parts) - 1:
                return item
            require(item.get("type") == "tree" and item.get("mode") == "040000", "Target path contains a symlink or non-directory Git object.")
            current = self.checked_sha(item.get("sha"))
        raise SyncError("Empty Git path.")

    def read_json_blob(self, relative):
        item = self.entry(relative)
        if item is None:
            return None
        require(item.get("type") == "blob" and item.get("mode") == "100644", "Existing metadata must be a normal non-executable Git file.")
        require(isinstance(item.get("size"), int) and item["size"] <= MAX_JSON, "Existing metadata exceeds 1 MiB.")
        blob_sha = self.checked_sha(item.get("sha"))
        value = self.api.call("GET", self.base + "/git/blobs/" + blob_sha)
        require(value.get("encoding") == "base64" and isinstance(value.get("content"), str), "Unexpected GitHub blob encoding.")
        try:
            data = base64.b64decode("".join(value["content"].split()), validate=True)
        except ValueError as exc:
            raise SyncError("Invalid base64 in GitHub metadata.") from exc
        require(len(data) == item["size"] and git_blob_sha(data) == blob_sha, "GitHub metadata content does not match its Git hash.")
        return data


def publish(root, model_id, repo=DEFAULT_REPO, branch="main", apply=False, api=None):
    repo, branch, model_id = valid_repo(repo), valid_branch(branch), valid_id(model_id)
    meta, meta_data, files = read_local_model(root, model_id, repo, branch)
    local_catalog = load_catalog(root, repo, branch)
    local_entry = [x for x in local_catalog["models"] if x["id"] == model_id]
    require(local_entry == [catalog_entry(meta, meta_data)], "Stage/check the local model before publishing it.")
    api = api if api is not None else GhApi()
    remote = RemoteSnapshot(api, repo, branch)
    remote_catalog_data = remote.read_json_blob(CATALOG_PATH)
    catalog = empty_catalog(repo, branch) if remote_catalog_data is None else validate_catalog(parse_json(remote_catalog_data, "remote catalog"), repo, branch)
    previous = next((x for x in catalog["models"] if x["id"] == model_id), None)
    model_directory = remote.entry(f"{PREFIX}/{model_id}")
    require(model_directory is None or (model_directory.get("type") == "tree" and model_directory.get("mode") == "040000"), "Remote model path is not a normal directory.")
    require(previous is not None or model_directory is None, "Remote model directory exists without a managed catalog entry; refusing to overwrite it.")
    deleted_paths = []
    if previous is not None:
        previous_data = remote.read_json_blob(previous["metadata_path"])
        require(previous_data is not None and sha256(previous_data) == previous["metadata_sha256"], "Remote catalog does not match the current model metadata.")
        previous_meta = validate_metadata(parse_json(previous_data, "previous metadata"), repo, branch)
        require(previous == catalog_entry(previous_meta, previous_data), "Remote catalog and metadata disagree.")
        deleted_paths = [x["path"] for x in previous_meta["files"].values() if x["path"] not in files]
    merged = merge_catalog(catalog, meta, meta_data, repo, branch)
    files[CATALOG_PATH] = json_bytes(merged)
    changed = {}
    for path, data in files.items():
        item = remote.entry(path)
        if item is not None:
            require(item.get("type") == "blob" and item.get("mode") == "100644", "Refusing to replace a symlink, executable, or submodule.")
        if item is None or item.get("sha") != git_blob_sha(data):
            changed[path] = data
    for path in deleted_paths:
        item = remote.entry(path)
        require(item is not None and item.get("type") == "blob" and item.get("mode") == "100644", "Removed managed asset has an unexpected remote type.")
    paths = sorted(set(changed) | set(deleted_paths))
    require(all(p == CATALOG_PATH or p.startswith(f"{PREFIX}/{model_id}/") for p in paths), "Publish attempted to escape its permitted path scope.")
    summary = {"repository": repo, "branch": branch, "model": model_id, "base_commit": remote.head, "changed_paths": paths}
    if not paths:
        return {"status": "unchanged", **summary}
    if not apply:
        return {"status": "dry_run", **summary, "instruction": "Append --publish to create the commit. No remote files were changed."}
    require(remote.current_head() == remote.head, "Branch changed while preparing the upload. Retry from the new branch head.")
    entries = []
    for path, data in sorted(changed.items()):
        value = api.call("POST", remote.base + "/git/blobs", {"content": base64.b64encode(data).decode("ascii"), "encoding": "base64"})
        blob_sha = remote.checked_sha(value.get("sha"))
        require(blob_sha == git_blob_sha(data), "Uploaded Git blob does not match the source bytes.")
        entries.append({"path": path, "mode": "100644", "type": "blob", "sha": blob_sha})
    entries.extend({"path": p, "mode": "100644", "type": "blob", "sha": None} for p in sorted(deleted_paths))
    tree = api.call("POST", remote.base + "/git/trees", {"base_tree": remote.tree_sha, "tree": entries})
    tree_sha = remote.checked_sha(tree.get("sha"))
    commit = api.call("POST", remote.base + "/git/commits", {"message": f"Add/update completed DXF {model_id}", "tree": tree_sha, "parents": [remote.head]})
    commit_sha = remote.checked_sha(commit.get("sha"))
    require(remote.current_head() == remote.head, "Branch changed during upload. No branch update was attempted; retry to merge the new catalog.")
    result = api.call("PATCH", remote.base + "/git/refs/heads/" + quote(branch, safe="/"), {"sha": commit_sha, "force": False})
    require(result.get("object", {}).get("sha") == commit_sha, "GitHub did not confirm the expected branch update. Inspect the repository before retrying.")
    return {"status": "published", **summary, "commit": commit_sha, "commit_url": f"https://github.com/{repo}/commit/{commit_sha}"}


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("stage", "check", "publish"):
        command = commands.add_parser(name)
        command.add_argument("--root", required=True, help="Prepared repository overlay root")
        command.add_argument("--repo", default=DEFAULT_REPO)
        command.add_argument("--branch", default="main")
        if name == "stage":
            command.add_argument("--dxf", required=True)
            command.add_argument("--unit", required=True, choices=["mm"])
            command.add_argument("--preview", help="Optional PNG preview")
            command.add_argument("--width-mm", type=float)
            command.add_argument("--height-mm", type=float)
            command.add_argument("--title")
        if name == "publish":
            command.add_argument("--model", required=True)
            command.add_argument("--publish", action="store_true", help="Actually commit and update the branch; omitted means remote dry-run")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        if args.command == "stage":
            result = stage(args.root, args.dxf, args.unit, args.repo, args.branch, args.preview, args.width_mm, args.height_mm, args.title)
        elif args.command == "check":
            result = check(args.root, args.repo, args.branch)
        else:
            result = publish(args.root, args.model, args.repo, args.branch, args.publish)
        print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
        return 0
    except (SyncError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
