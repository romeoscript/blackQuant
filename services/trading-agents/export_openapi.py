"""Write the OpenAPI document Mintlify renders.

Run after changing any route or model:

    .venv/bin/python export_openapi.py

The spec is generated from the app rather than hand-written, so the published
reference cannot drift from the code that serves it. The output path is inside
the Mintlify repo because that is what gets deployed.
"""

import json
import pathlib
import sys

from app.main import app

DEFAULT_OUT = pathlib.Path("openapi.json")


def main() -> int:
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    spec = app.openapi()

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(spec, indent=2) + "\n")

    paths = sum(len([m for m in ops if m in {"get", "post", "put", "patch", "delete"}])
                for ops in spec["paths"].values())
    print(f"wrote {out}")
    print(f"  {len(spec['paths'])} paths, {paths} operations, "
          f"{len(spec['components']['schemas'])} schemas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
