#!/usr/bin/env python3
"""Fix split react-native / useAppTheme imports (merge orphan block into file header)."""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

BROKEN = re.compile(
    r"import \{\s*\n\s*\nimport \{ useAppTheme, type AppTheme \} from '@/theme';\n\n",
    re.MULTILINE,
)

ORPHAN = re.compile(
    r"\}\);\n\}\n\n((?:  (?:[A-Za-z_][A-Za-z0-9_]*),?\s*\n)+)\} from 'react-native';",
    re.MULTILINE,
)


def fix_file(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if not BROKEN.search(text):
        return False
    m = ORPHAN.search(text)
    if not m:
        print(f"orphan not found: {path}", file=sys.stderr)
        return False
    names: list[str] = []
    for line in m.group(1).splitlines():
        part = line.strip().rstrip(",").strip()
        if part:
            names.append(part)
    if not names:
        print(f"no import names: {path}", file=sys.stderr)
        return False
    rn = "import {\n  " + ",\n  ".join(names) + "\n} from 'react-native';\n"
    theme_imp = "import { useAppTheme, type AppTheme } from '@/theme';\n\n"
    text = BROKEN.sub(rn + theme_imp, text, count=1)
    text = ORPHAN.sub("", text, count=1)
    path.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    n = 0
    for p in sorted(ROOT.rglob("*.tsx")):
        if fix_file(p):
            print(p.relative_to(ROOT))
            n += 1
    print(f"fixed {n} files", file=sys.stderr)


if __name__ == "__main__":
    main()
