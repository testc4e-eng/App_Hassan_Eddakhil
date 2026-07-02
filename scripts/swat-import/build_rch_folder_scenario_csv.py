"""Build CSV rows from Données_Hydro scenario folders (SousBassin_XX_RCH.xlsx)."""

from __future__ import annotations

import csv
import datetime as dt
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS_MAIN = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}

HYDRO_SUBBASINS = {8, 10, 15, 17}
SEDIMENT_SUBBASINS = set(range(1, 19))  # Reach 1..18 only; never 19
FORBIDDEN_SUBBASINS = {19}

SCENARIO_FOLDERS = {
    "ssp126": "Excel_RCH_SSP126_2039_2059",
    "ssp245": "Excel_RCH_SSP245_2039_2059",
    "ssp585": "Excel_RCH_SSP585_2039_2059",
    "scenario_1": "Excel_RCH_19_SousBassins_Sce_1",
    "scenario_2": "Excel_RCH_19_SousBassins_Sce_2",
    "scenario_3": "Excel_RCH_19_SousBassins_Sce_3",
    "scenario_4": "Excel_RCH_19_SousBassins_Sce_4",
}


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return [
        "".join((t.text or "") for t in si.findall(".//x:t", NS_MAIN))
        for si in root.findall("x:si", NS_MAIN)
    ]


def workbook_first_sheet_path(zf: zipfile.ZipFile) -> str:
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rel_root = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"].lstrip("/")
        for rel in rel_root.findall("r:Relationship", NS_REL)
        if rel.attrib.get("Id") and rel.attrib.get("Target")
    }
    sheet = wb.find("x:sheets/x:sheet", NS_MAIN)
    if sheet is None:
        raise RuntimeError("Workbook has no sheets")
    rel_id = sheet.attrib.get(
        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    )
    target = rel_map.get(rel_id or "")
    if not target:
        raise RuntimeError("Unable to resolve first sheet path")
    if not target.startswith("xl/"):
        target = f"xl/{target}"
    return target


def col(ref: str) -> str:
    out: list[str] = []
    for ch in ref:
        if ch.isalpha():
            out.append(ch)
        else:
            break
    return "".join(out)


def cell_text(cell: ET.Element, shared: list[str]) -> str:
    t = cell.attrib.get("t")
    v = cell.find("x:v", NS_MAIN)
    if t == "s":
        if v is None or v.text is None:
            return ""
        idx = int(v.text)
        return shared[idx] if 0 <= idx < len(shared) else ""
    if t == "inlineStr":
        it = cell.find("x:is/x:t", NS_MAIN)
        return it.text if it is not None and it.text is not None else ""
    return v.text if v is not None and v.text is not None else ""


def parse_float(value: str) -> float | None:
    s = (value or "").strip().replace(" ", "").replace("\u00a0", "").replace(",", ".")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_excel_date(raw: str) -> dt.date | None:
    s = (raw or "").strip()
    if not s:
        return None
    try:
        n = float(s)
        return (dt.datetime(1899, 12, 30) + dt.timedelta(days=n)).date()
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    try:
        return dt.datetime.fromisoformat(s).date()
    except ValueError:
        return None


def normalize_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").strip().lower())


def parse_sheet_rows(root: ET.Element, shared: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in root.findall("x:sheetData/x:row", NS_MAIN):
        row_map: dict[str, str] = {}
        for cell in row.findall("x:c", NS_MAIN):
            row_map[col(cell.attrib.get("r", ""))] = cell_text(cell, shared).strip()
        if row_map:
            rows.append(row_map)
    return rows


def sub_from_filename(path: Path) -> int | None:
    match = re.search(r"SousBassin_(\d+)_RCH", path.name, re.IGNORECASE)
    if not match:
        return None
    return int(match.group(1))


def yyyyddd(d: dt.date) -> int:
    return int(d.strftime("%Y%j"))


def parse_subbasin_workbook(path: Path, scenario_code: str, sub_code: int) -> list[dict[str, object]]:
    with zipfile.ZipFile(path, "r") as zf:
        shared = read_shared_strings(zf)
        sheet_path = workbook_first_sheet_path(zf)
        root = ET.fromstring(zf.read(sheet_path))
        rows = parse_sheet_rows(root, shared)

    header_idx: int | None = None
    header_map: dict[str, str] = {}
    aliases = {
        "date": {"date"},
        "flow": {"flowoutcms"},
        "sed": {"sedouttons"},
    }

    for idx, row in enumerate(rows):
        normalized = {column: normalize_header(value) for column, value in row.items()}
        vals = set(normalized.values())
        if "date" in vals and "flowoutcms" in vals and "sedouttons" in vals:
            header_idx = idx
            for column, key in normalized.items():
                for logical, names in aliases.items():
                    if key in names:
                        header_map[logical] = column
            break

    if header_idx is None:
        raise RuntimeError(f"Header not found in {path}")

    parsed: list[dict[str, object]] = []
    for row in rows[header_idx + 1 :]:
        period = parse_excel_date(row.get(header_map.get("date", ""), ""))
        flow = parse_float(row.get(header_map.get("flow", ""), ""))
        sed = parse_float(row.get(header_map.get("sed", ""), ""))
        if period is None:
            continue
        if flow is None and sed is None:
            continue

        parsed.append(
            {
                "scenario_code": scenario_code,
                "sub_code": sub_code,
                "period_date": period.isoformat(),
                "year": period.year,
                "mon": period.month,
                "yyyyddd": yyyyddd(period),
                "flow_out_cms": flow,
                "sed_out_tons": sed,
            }
        )
    return parsed


def build_rows(data_dir: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    for scenario_code, folder_name in SCENARIO_FOLDERS.items():
        folder = data_dir / folder_name
        if not folder.is_dir():
            raise RuntimeError(f"Missing scenario folder: {folder}")

        for sub_code in sorted(HYDRO_SUBBASINS | SEDIMENT_SUBBASINS):
            if sub_code in FORBIDDEN_SUBBASINS:
                continue
            file_path = folder / f"SousBassin_{sub_code:02d}_RCH.xlsx"
            if not file_path.exists():
                raise RuntimeError(f"Missing file: {file_path}")
            rows.extend(parse_subbasin_workbook(file_path, scenario_code, sub_code))

    rows.sort(
        key=lambda r: (
            str(r["scenario_code"]),
            int(r["sub_code"]),
            str(r["period_date"]),
        )
    )
    return rows


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: build_rch_folder_scenario_csv.py <Données_Hydro_dir> <out.csv>")
        return 1

    data_dir = Path(sys.argv[1])
    out_csv = Path(sys.argv[2])
    if not data_dir.exists():
        print(f"Missing directory: {data_dir}")
        return 2

    rows = build_rows(data_dir)
    if any(int(r["sub_code"]) == 19 for r in rows):
        print("ERROR: forbidden sub_code 19 detected in output")
        return 3

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "scenario_code",
        "sub_code",
        "period_date",
        "year",
        "mon",
        "yyyyddd",
        "flow_out_cms",
        "sed_out_tons",
    ]
    with out_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    by_scenario: dict[str, int] = {}
    by_sub: dict[int, int] = {}
    for row in rows:
        code = str(row["scenario_code"])
        sub = int(row["sub_code"])
        by_scenario[code] = by_scenario.get(code, 0) + 1
        by_sub[sub] = by_sub.get(sub, 0) + 1

    print(f"Rows written: {len(rows)}")
    for code in sorted(by_scenario):
        print(f"{code}: {by_scenario[code]}")
    for sub in sorted(by_sub):
        print(f"sub_{sub}: {by_sub[sub]}")
    print(f"Output: {out_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
