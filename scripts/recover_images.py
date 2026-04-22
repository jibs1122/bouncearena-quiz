#!/usr/bin/env python3
"""
Recover missing featured images for MDX posts.

The MDX files already have featuredImage set to /images/posts/<name>, but
those image files may not exist in public/images/posts/. This script:
1. Scans every MDX file's featuredImage path
2. If the file is missing from public/images/posts/, searches the WP uploads export
3. Copies the best match to public/images/posts/
4. Also scans body content for broken wp-content/uploads/ references and fixes those
5. Logs anything it can't confidently match
"""

import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

UPLOADS = Path.home() / "Projects/bouncearena-export/uploads/uploads"
CONTENT_DIRS = [
    Path("/Users/scott/Projects/bouncearena-quiz/content/blog"),
    Path("/Users/scott/Projects/bouncearena-quiz/content/reviews"),
    Path("/Users/scott/Projects/bouncearena-quiz/content/comparisons"),
]
DEST = Path("/Users/scott/Projects/bouncearena-quiz/public/images/posts")
DEST.mkdir(parents=True, exist_ok=True)

SIZE_RE = re.compile(r"-\d+x\d+$")
SIZE_CAPTURE_RE = re.compile(r"-(\d+)x(\d+)$")

# Build index: lowercased stem (with and without WP size suffixes) -> [Path, ...]
uploads_index: dict[str, list[Path]] = {}
for p in UPLOADS.rglob("*"):
    if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}:
        stem = p.stem.lower()
        stem_no_size = SIZE_RE.sub("", stem)
        for key in {stem, stem_no_size}:
            uploads_index.setdefault(key, []).append(p)


def slug_to_keywords(slug: str) -> list[str]:
    stop = {"the", "a", "an", "and", "or", "vs", "in", "on", "of", "to", "for",
            "is", "it", "we", "your", "you", "how", "what", "why", "do", "does",
            "asked", "worth", "right", "new", "2025", "2024", "australia", "australian",
            "tra", "pro"}
    return [w for w in slug.replace("-", " ").split() if w not in stop]


@dataclass(frozen=True, order=True)
class CandidateScore:
    ext_match: int
    is_original: int
    area: int
    file_size: int


def score_candidate(candidate: Path, target_ext: str) -> CandidateScore:
    stem = candidate.stem.lower()
    size_match = SIZE_CAPTURE_RE.search(stem)
    if size_match:
        width = int(size_match.group(1))
        height = int(size_match.group(2))
        is_original = 0
        area = width * height
    else:
        is_original = 1
        area = 10**12

    try:
        file_size = candidate.stat().st_size
    except OSError:
        file_size = 0

    return CandidateScore(
        ext_match=1 if candidate.suffix.lower() == target_ext else 0,
        is_original=is_original,
        area=area,
        file_size=file_size,
    )


def pick_best(candidates: list[Path], target_ext: str) -> Path:
    return max(candidates, key=lambda candidate: score_candidate(candidate, target_ext))


def best_match_for_target(target_name: str, slug: str) -> Path | None:
    """Find the best upload image for a target filename + slug hint."""
    target_stem = Path(target_name).stem.lower()
    target_stem_no_size = SIZE_RE.sub("", target_stem)
    target_ext = Path(target_name).suffix.lower()

    # 1. Exact stem match
    for key in [target_stem, target_stem_no_size]:
        if key in uploads_index:
            return pick_best(uploads_index[key], target_ext)

    # 2. Target stem is substring of upload stem (or vice versa)
    if len(target_stem_no_size) > 6:
        for stem, paths in uploads_index.items():
            if target_stem_no_size in stem or (len(stem) > 6 and stem in target_stem_no_size):
                return pick_best(paths, target_ext)

    # 3. Keyword match on post slug (≥2 keywords must appear in the upload stem)
    keywords = slug_to_keywords(slug)
    if len(keywords) >= 2:
        best_score, best_path = 0, None
        for stem, paths in uploads_index.items():
            score = sum(1 for kw in keywords if kw in stem)
            if score > best_score and score >= min(2, len(keywords)):
                best_score, best_path = score, pick_best(paths, target_ext)
        if best_path:
            return best_path

    return None


def fix_wp_body_refs(body: str) -> tuple[str, list[str]]:
    """Rewrite wp-content/uploads/... image URLs in MDX body. Returns (new_body, log_lines)."""
    wp_re = re.compile(
        r'(?:https?://[^/\s"\'()]+)?/wp-content/uploads/([\w/.\-]+\.(jpg|jpeg|png|gif|webp|svg))',
        re.IGNORECASE,
    )
    log = []

    def replace(m: re.Match) -> str:
        rel = m.group(1)  # e.g. "2024/05/foo-800x600.jpg"
        src_stem = SIZE_RE.sub("", Path(rel).stem.lower())
        dest_name = Path(rel).stem.lower().replace("_", "-") + Path(rel).suffix.lower()
        dest_path = DEST / dest_name

        found = None
        for key in [src_stem, Path(rel).stem.lower()]:
            if key in uploads_index:
                found = uploads_index[key][0]
                break
        if found is None:
            candidate = UPLOADS / rel
            if candidate.exists():
                found = candidate

        if found:
            if not dest_path.exists():
                shutil.copy2(found, dest_path)
            log.append(f"  body-ref fixed: {rel} → /images/posts/{dest_name}")
            return f"/images/posts/{dest_name}"

        log.append(f"  body-ref NOT FOUND: {rel}")
        return m.group(0)

    return wp_re.sub(replace, body), log


def process_mdx(mdx_path: Path) -> dict:
    slug = mdx_path.stem
    text = mdx_path.read_text(encoding="utf-8")

    fm_re = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
    fm_match = fm_re.match(text)
    if not fm_match:
        return {"slug": slug, "status": "no-frontmatter"}

    frontmatter = fm_match.group(1)
    body = text[fm_match.end():]

    fi_re = re.compile(r"^(featuredImage:\s*)(.*)$", re.MULTILINE)
    fi_match = fi_re.search(frontmatter)
    raw_fi = (fi_match.group(2).strip().strip("'\"") if fi_match else "")

    result = {"slug": slug, "path": str(mdx_path), "body_log": []}

    # --- Fix body wp-content refs ---
    new_body, body_log = fix_wp_body_refs(body)
    result["body_log"] = body_log

    # --- Handle featuredImage ---
    if raw_fi.startswith("/images/posts/"):
        target_name = Path(raw_fi).name
        dest_path = DEST / target_name
        found = best_match_for_target(target_name, slug)
        if found:
            existed_before = dest_path.exists()
            should_copy = (
                not existed_before
                or dest_path.stat().st_size < found.stat().st_size
            )
            if should_copy:
                shutil.copy2(found, dest_path)
                result["status"] = "upgraded" if existed_before else "copied"
                result["src"] = found.name
                result["dest"] = target_name
            else:
                result["status"] = "already-present"
        else:
            result["status"] = "unmatched"
            result["target"] = target_name
        new_frontmatter = frontmatter  # path already correct

    elif raw_fi.startswith("/wp-content/") or (raw_fi and "/" in raw_fi and "wp-content" in raw_fi):
        # Frontmatter still has old wp-content path
        target_name = Path(raw_fi).name.lower().replace("_", "-")
        dest_path = DEST / target_name
        found = best_match_for_target(target_name, slug)
        if found:
            if not dest_path.exists():
                shutil.copy2(found, dest_path)
            new_fi = f"/images/posts/{target_name}"
            new_frontmatter = fi_re.sub(lambda m: m.group(1) + new_fi, frontmatter)
            result["status"] = "copied+updated-fm"
            result["src"] = found.name
            result["dest"] = target_name
        else:
            result["status"] = "unmatched"
            result["target"] = target_name
            new_frontmatter = frontmatter

    elif raw_fi and "/" not in raw_fi:
        # Bare filename
        target_name = raw_fi.lower().replace("_", "-")
        dest_path = DEST / target_name
        found = best_match_for_target(target_name, slug)
        if found:
            if not dest_path.exists():
                shutil.copy2(found, dest_path)
            new_fi = f"/images/posts/{target_name}"
            new_frontmatter = fi_re.sub(lambda m: m.group(1) + new_fi, frontmatter)
            result["status"] = "copied+updated-fm"
            result["src"] = found.name
            result["dest"] = target_name
        else:
            result["status"] = "unmatched"
            result["target"] = target_name
            new_frontmatter = frontmatter

    elif not raw_fi:
        # No featuredImage at all — try to find by slug
        found = best_match_for_target("", slug)
        if found:
            dest_name = found.name.lower().replace("_", "-")
            dest_path = DEST / dest_name
            if not dest_path.exists():
                shutil.copy2(found, dest_path)
            new_fi = f"/images/posts/{dest_name}"
            if fi_match:
                new_frontmatter = fi_re.sub(lambda m: m.group(1) + new_fi, frontmatter)
            else:
                new_frontmatter = frontmatter + f"\nfeaturedImage: {new_fi}"
            result["status"] = "slug-matched"
            result["src"] = found.name
            result["dest"] = dest_name
        else:
            result["status"] = "unmatched"
            result["target"] = "(empty)"
            new_frontmatter = frontmatter
    else:
        result["status"] = "already-present"
        new_frontmatter = frontmatter

    # Write back if changed
    if new_frontmatter != frontmatter or new_body != body:
        mdx_path.write_text(f"---\n{new_frontmatter}\n---\n{new_body}", encoding="utf-8")
        result["file_updated"] = True

    return result


def main():
    print(f"Uploads index: {len(uploads_index)} unique stems\n")

    all_mdx: list[Path] = []
    for d in CONTENT_DIRS:
        if d.exists():
            all_mdx.extend(sorted(d.glob("*.mdx")))

    print(f"MDX files: {len(all_mdx)}\n")

    copied, unmatched, present = [], [], []

    for mdx in all_mdx:
        r = process_mdx(mdx)
        status = r.get("status", "?")

        if status in ("copied", "copied+updated-fm", "slug-matched", "upgraded"):
            copied.append(r)
            print(f"✓  {r['slug']}")
            print(f"   {r.get('src','?')} → {r.get('dest','?')}")
        elif status == "unmatched":
            unmatched.append(r)
            print(f"✗  {r['slug']}  [target: {r.get('target','?')}]")
        elif status == "already-present":
            present.append(r)

        for line in r.get("body_log", []):
            print(line)

    print(f"\n{'='*60}")
    print(f"Already present : {len(present)}")
    print(f"Copied          : {len(copied)}")
    print(f"UNMATCHED       : {len(unmatched)}")

    if unmatched:
        print("\n--- Needs manual image ---")
        for r in unmatched:
            print(f"  {r['slug']:55s}  {r.get('target','')}")


if __name__ == "__main__":
    main()
