import csv
import datetime as dt
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS_MAIN = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}

SCENARIO_DIR_TO_CODE = {
    "Excel_RCH_19_SousBassins_Sce_1": "scenario_1",
    "Excel_RCH_19_SousBassins_Sce_2": "scenario_2",
    "Excel_RCH_19_SousBassins_Sce_3": "scenario_3",
    "Excel_RCH_19_SousBassins_Sce_4": "scenario_4",
    "Excel_RCH_SSP126_2039_2059": "ssp126",
    "Excel_RCH_SSP245_2039_2059": "ssp245",
    "Excel_RCH_SSP585_2039_2059": "ssp585",
}

HYDRO_SUBS = {8, 10, 15, 17}
SEDIMENT_SUBS = set(range(1, 19))


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("x:si", NS_MAIN):
        out.append("".join((t.text or "") for t in si.findall(".//x:t", NS_MAIN)))
    return out


def workbook_sheet_xml_paths(zf: zipfile.ZipFile) -> dict[str, str]:
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rel_root = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map: dict[str, str] = {}
    for rel in rel_root.findall("r:Relationship", NS_REL):
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        if not rel_id or not target:
            continue
        target = target.lstrip("/")
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        rel_map[rel_id] = target

    out: dict[str, str] = {}
    for sheet in wb.findall("x:sheets/x:sheet", NS_MAIN):
        name = sheet.attrib.get("name")
        rel_id = sheet.attrib.get(
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        )
        if not name or not rel_id:
            continue
        path = rel_map.get(rel_id)
        if path:
            out[name] = path
    return out


def col(ref: str) -> str:
    out = []
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


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").strip().lower())


def parse_float(value: str) -> float | None:
    s = (value or "").strip().replace(" ", "").replace("\u00A0", "").replace(",", ".")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_date(raw: str) -> dt.date | None:
    s = (raw or "").strip()
    if not s:
        return None
    try:
        n = float(s)
        base = dt.datetime(1899, 12, 30)
        return (base + dt.timedelta(days=n)).date()
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


def yyyyddd(d: dt.date) -> int:
    return int(d.strftime("%Y%j"))


def parse_sub_code(path: Path) -> int:
    m = re.search(r"SousBassin_(\d+)_RCH\.xlsx$", path.name, flags=re.IGNORECASE)
    if not m:
        raise RuntimeError(f"Cannot parse sub code from file name: {path.name}")
    return int(m.group(1))


def parse_subbasin_file(path: Path) -> list[dict[str, object]]:
    with zipfile.ZipFile(path, "r") as zf:
        shared = read_shared_strings(zf)
        sheets = workbook_sheet_xml_paths(zf)
        if not sheets:
            raise RuntimeError(f"No sheets in {path}")
        first_sheet_xml = next(iter(sheets.values()))
        root = ET.fromstring(zf.read(first_sheet_xml))

        rows: list[dict[str, str]] = []
        for row in root.findall("x:sheetData/x:row", NS_MAIN):
            row_map: dict[str, str] = {}
            for cell in row.findall("x:c", NS_MAIN):
                row_map[col(cell.attrib.get("r", ""))] = cell_text(cell, shared).strip()
            if row_map:
                rows.append(row_map)

    header_idx: int | None = None
    header_map: dict[str, str] = {}
    for idx, row in enumerate(rows):
        normalized = {k: normalize(v) for k, v in row.items()}
        values = set(normalized.values())
        if "date" in values and "flowoutcms" in values and "sedouttons" in values:
            header_idx = idx
            for c, nv in normalized.items():
                if nv == "date":
                    header_map["date"] = c
                elif nv == "flowoutcms":
                    header_map["flow"] = c
                elif nv == "sedouttons":
                    header_map["sed"] = c
            break

    if header_idx is None:
        raise RuntimeError(f"Header not found in {path}")

    parsed: list[dict[str, object]] = []
    for row in rows[header_idx + 1 :]:
        d = parse_date(row.get(header_map["date"], ""))
        flow = parse_float(row.get(header_map["flow"], ""))
        sed = parse_float(row.get(header_map["sed"], ""))
        if d is None:
            continue
        if flow is None and sed is None:
            continue
        parsed.append(
            {
                "period_date": d.isoformat(),
                "year": d.year,
                "mon": d.month,
                "yyyyddd": yyyyddd(d),
                "flow_out_cms": flow,
                "sed_out_tons": sed,
            }
        )
    return parsed


def build_rows(root: Path) -> list[dict[str, object]]:
    all_rows: list[dict[str, object]] = []

    for scenario_dir, scenario_code in SCENARIO_DIR_TO_CODE.items():
        full_dir = root / scenario_dir
        if not full_dir.exists():
            raise RuntimeError(f"Missing scenario directory: {full_dir}")

        for file in sorted(full_dir.glob("SousBassin_*_RCH.xlsx")):
            sub_code = parse_sub_code(file)
            if sub_code not in SEDIMENT_SUBS:
                continue
            for row in parse_subbasin_file(file):
                all_rows.append(
                    {
                        "scenario_code": scenario_code,
                        "sub_code": sub_code,
                        **row,
                    }
                )

    all_rows.sort(
        key=lambda r: (str(r["scenario_code"]), int(r["sub_code"]), str(r["period_date"]))
    )
    return all_rows


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: build_targeted_flow_sed_csv_from_folders.py <Données_Hydro_dir> <out.csv>")
        return 1

    root = Path(sys.argv[1])
    out_csv = Path(sys.argv[2])
    if not root.exists():
        print(f"Missing directory: {root}")
        return 2

    rows = build_rows(root)
    out_csv.parent.mkdir(parents=True, exist_ok=True)

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "scenario_code",
                "sub_code",
                "period_date",
                "year",
                "mon",
                "yyyyddd",
                "flow_out_cms",
                "sed_out_tons",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    stats = {
        "rows_written": len(rows),
        "by_scenario": {},
        "by_sub": {},
    }
    for r in rows:
        sc = str(r["scenario_code"])
        sb = int(r["sub_code"])
        stats["by_scenario"][sc] = stats["by_scenario"].get(sc, 0) + 1
        stats["by_sub"][str(sb)] = stats["by_sub"].get(str(sb), 0) + 1

    print(json.dumps(stats, ensure_ascii=False))
    print(f"Output: {out_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
