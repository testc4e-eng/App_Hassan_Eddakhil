import csv
import datetime as dt
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS_MAIN = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
TARGET_SUBBASINS = {8, 10, 15, 17}
TARGET_SCENARIOS = {
    "ssp126",
    "ssp245",
    "ssp585",
    "scenario_1",
    "scenario_2",
    "scenario_3",
    "scenario_4",
}


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("x:si", NS_MAIN):
        parts = [t.text or "" for t in si.findall(".//x:t", NS_MAIN)]
        out.append("".join(parts))
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
    s = (value or "").strip().replace(" ", "").replace("\u00A0", "").replace(",", ".")
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
        base = dt.datetime(1899, 12, 30)
        return (base + dt.timedelta(days=n)).date()
    except ValueError:
        pass

    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    if " " in s:
        try:
            return dt.datetime.fromisoformat(s).date()
        except ValueError:
            pass
    return None


def parse_year_to_date(raw: str) -> dt.date | None:
    s = (raw or "").strip()
    if not s:
        return None
    try:
        y = int(float(s))
        return dt.date(y, 1, 1)
    except ValueError:
        return None


def col(ref: str) -> str:
    out = []
    for ch in ref:
        if ch.isalpha():
            out.append(ch)
        else:
            break
    return "".join(out)


def parse_sheet_pairs(
    root: ET.Element,
    shared: list[str],
    pairs: list[tuple[str, str]],
    mode: str,
) -> dict[str, float]:
    values: dict[str, float] = {}
    for row in root.findall("x:sheetData/x:row", NS_MAIN):
        row_map: dict[str, str] = {}
        for cell in row.findall("x:c", NS_MAIN):
            row_map[col(cell.attrib.get("r", ""))] = cell_text(cell, shared)

        for date_col, val_col in pairs:
            d_raw = row_map.get(date_col, "")
            v_raw = row_map.get(val_col, "")
            if mode == "year":
                d = parse_year_to_date(d_raw)
            else:
                d = parse_excel_date(d_raw)
            v = parse_float(v_raw)
            if d is None or v is None:
                continue
            values[d.isoformat()] = v
    return values


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


def resolve_subbasin(value: str) -> int | None:
    try:
        return int(float((value or "").strip()))
    except ValueError:
        return None


def resolve_int_or_default(value: str, default: int) -> int:
    try:
        return int(float((value or "").strip()))
    except ValueError:
        return default


def parse_tabular_sheet_rows(
    rows: list[dict[str, str]],
    scenario_code: str,
) -> list[dict[str, object]]:
    header_idx: int | None = None
    header_map: dict[str, str] = {}
    required_aliases = {
        "date": {"date", "perioddate", "datetime"},
        "sub": {"sub", "subbasin"},
        "flow": {"flowoutcms", "flowoutcmsm3s", "flowoutcmsm3sec", "flowoutcmsm3s"},
        "year": {"year", "annee"},
        "mon": {"mon", "month", "mois"},
        "sed": {"sedouttons", "sedouttonsday"},
    }

    for idx, row in enumerate(rows):
        normalized = {column: normalize_header(value) for column, value in row.items()}
        if not normalized:
            continue

        has_date = any(v in required_aliases["date"] for v in normalized.values())
        has_sub = any(v in required_aliases["sub"] for v in normalized.values())
        has_flow = any(v in required_aliases["flow"] for v in normalized.values())
        if not (has_date and has_sub and has_flow):
            continue

        header_idx = idx
        for column, key in normalized.items():
            for logical_name, aliases in required_aliases.items():
                if key in aliases:
                    header_map[logical_name] = column
                    break
        break

    if header_idx is None:
        return []

    parsed_rows: list[dict[str, object]] = []
    for row in rows[header_idx + 1 :]:
        date_raw = row.get(header_map.get("date", ""), "")
        sub_raw = row.get(header_map.get("sub", ""), "")
        flow_raw = row.get(header_map.get("flow", ""), "")
        year_raw = row.get(header_map.get("year", ""), "")
        mon_raw = row.get(header_map.get("mon", ""), "")
        sed_raw = row.get(header_map.get("sed", ""), "")

        period = parse_excel_date(date_raw)
        sub = resolve_subbasin(sub_raw)
        flow = parse_float(flow_raw)
        if period is None or sub is None or flow is None:
            continue
        if sub not in TARGET_SUBBASINS:
            continue

        year = resolve_int_or_default(year_raw, period.year)
        month = resolve_int_or_default(mon_raw, period.month)
        if month < 1 or month > 12:
            month = period.month
        sed = parse_float(sed_raw)

        parsed_rows.append(
            {
                "scenario_code": scenario_code,
                "sub_code": sub,
                "period_date": period.isoformat(),
                "year": year,
                "mon": month,
                "yyyyddd": yyyyddd(period),
                "flow_out_cms": flow,
                "sed_out_tons": sed,
            }
        )
    return parsed_rows


def read_tabular_workbook(path: Path, scenario_code: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with zipfile.ZipFile(path, "r") as zf:
        shared = read_shared_strings(zf)
        sheet_paths = workbook_sheet_xml_paths(zf)
        for sheet_name, xml_path in sheet_paths.items():
            root = ET.fromstring(zf.read(xml_path))
            parsed = parse_tabular_sheet_rows(parse_sheet_rows(root, shared), scenario_code)
            if parsed:
                rows.extend(parsed)
                break

    if not rows:
        raise RuntimeError(f"No tabular rows parsed in {path.name} for {scenario_code}")
    return rows


def pick_one_file(data_dir: Path, patterns: list[str], label: str) -> Path:
    matches: list[Path] = []
    for pattern in patterns:
        matches.extend(sorted(data_dir.glob(pattern)))

    unique = sorted({m.resolve() for m in matches})
    if not unique:
        raise RuntimeError(f"Missing {label} file in {data_dir}")
    if len(unique) > 1:
        names = ", ".join(str(p.name) for p in unique)
        raise RuntimeError(f"Multiple {label} files found: {names}")
    return Path(unique[0])


def build_rows_from_data_dir(data_dir: Path) -> list[dict[str, object]]:
    scenario_files = {
        "ssp126": ["*Excel_RCH_SSP126_2039_2059*.xlsx"],
        "ssp245": ["*Excel_RCH_SSP245_2039_2059*.xlsx"],
        "ssp585": ["*Excel_RCH_SSP585_2039_2059*.xlsx"],
        "scenario_1": ["*Excel_RCH_19_SousBassins_Sce_1*.xlsx"],
        "scenario_2": ["*Excel_RCH_19_SousBassins_Sce_2*.xlsx"],
        "scenario_3": ["*Excel_RCH_19_SousBassins_Sce_3*.xlsx"],
        "scenario_4": ["*Excel_RCH_19_SousBassins_Sce_4*.xlsx"],
    }
    rows: list[dict[str, object]] = []
    for scenario_code, patterns in scenario_files.items():
        src = pick_one_file(data_dir, patterns, scenario_code)
        rows.extend(read_tabular_workbook(src, scenario_code))

    rows = [r for r in rows if int(r["sub_code"]) in TARGET_SUBBASINS]
    rows = [r for r in rows if str(r["scenario_code"]) in TARGET_SCENARIOS]
    rows.sort(key=lambda r: (str(r["scenario_code"]), int(r["sub_code"]), str(r["period_date"])))
    return rows


def yyyyddd(d: dt.date) -> int:
    return int(d.strftime("%Y%j"))


def build_rows(
    climate_file: Path,
    reforest_file: Path,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    climate_map = {
        "ssp126": {"day": "SSP2.6_QJ", "month": "SSP2.6_QM", "year": "SSP2.6_QA"},
        "ssp245": {"day": "SSP4.5_QJ", "month": "SSP4.5_QM", "year": "SSP4.5_QA"},
        "ssp585": {"day": "SSP8.5_QJ", "month": "SSP8.5_QM", "year": "SSP8.5_QA"},
    }

    with zipfile.ZipFile(climate_file, "r") as zf:
        shared = read_shared_strings(zf)
        sheet_paths = workbook_sheet_xml_paths(zf)

        for scenario_code, sheets in climate_map.items():
            day_root = ET.fromstring(zf.read(sheet_paths[sheets["day"]]))
            flow_day = parse_sheet_pairs(day_root, shared, [("A", "B")], "day")
            # Usually K/L, but SSP8.5 daily is G/H.
            sed_day = parse_sheet_pairs(day_root, shared, [("K", "L"), ("G", "H"), ("A", "C")], "day")

            if not flow_day:
                raise RuntimeError(f"No daily FLOW rows found for {scenario_code}")
            if not sed_day:
                raise RuntimeError(f"No daily SED rows found for {scenario_code}")

            common_dates = sorted(set(flow_day.keys()) & set(sed_day.keys()))
            if not common_dates:
                raise RuntimeError(f"No common daily dates for FLOW and SED in {scenario_code}")

            for day_key in common_dates:
                d = dt.date.fromisoformat(day_key)
                rows.append(
                    {
                        "scenario_code": scenario_code,
                        "sub_code": 19,
                        "period_date": day_key,
                        "year": d.year,
                        "mon": d.month,
                        "yyyyddd": yyyyddd(d),
                        "flow_out_cms": flow_day[day_key],
                        "sed_out_tons": sed_day[day_key],
                    }
                )

    reforest_map = {
        "scenario_1": "Scen_1",
        "scenario_2": "Scen_2",
        "scenario_3": "Scen_3",
        "scenario_4": "Scen_4",
    }

    with zipfile.ZipFile(reforest_file, "r") as zf:
        shared = read_shared_strings(zf)
        sheet_paths = workbook_sheet_xml_paths(zf)
        for scenario_code, sheet_name in reforest_map.items():
            root = ET.fromstring(zf.read(sheet_paths[sheet_name]))
            flow_day = parse_sheet_pairs(root, shared, [("A", "B")], "day")
            sed_day = parse_sheet_pairs(root, shared, [("A", "C")], "day")
            if not flow_day:
                raise RuntimeError(f"No daily FLOW rows found for {scenario_code}")
            if not sed_day:
                raise RuntimeError(f"No daily SED rows found for {scenario_code}")

            common_dates = sorted(set(flow_day.keys()) & set(sed_day.keys()))
            if not common_dates:
                raise RuntimeError(f"No common daily dates for FLOW and SED in {scenario_code}")

            for day_key in common_dates:
                d = dt.date.fromisoformat(day_key)
                rows.append(
                    {
                        "scenario_code": scenario_code,
                        "sub_code": 19,
                        "period_date": day_key,
                        "year": d.year,
                        "mon": d.month,
                        "yyyyddd": yyyyddd(d),
                        "flow_out_cms": flow_day[day_key],
                        "sed_out_tons": sed_day[day_key],
                    }
                )

    rows.sort(key=lambda r: (str(r["scenario_code"]), str(r["period_date"])))
    return rows


def main() -> int:
    if len(sys.argv) not in (3, 4):
        print("Usage:")
        print("  build_targeted_scenario_csv.py <Données_Hydro_dir> <out.csv>")
        print("  build_targeted_scenario_csv.py <climate.xlsx> <reforestation.xlsx> <out.csv>")
        return 1

    if len(sys.argv) == 3:
        data_dir = Path(sys.argv[1])
        out_csv = Path(sys.argv[2])
        if not data_dir.exists():
            print(f"Missing directory: {data_dir}")
            return 2
        rows = build_rows_from_data_dir(data_dir)
    else:
        climate = Path(sys.argv[1])
        reforest = Path(sys.argv[2])
        out_csv = Path(sys.argv[3])
        if not climate.exists():
            print(f"Missing file: {climate}")
            return 2
        if not reforest.exists():
            print(f"Missing file: {reforest}")
            return 3
        rows = build_rows(climate, reforest)
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

    by_scenario: dict[str, int] = {}
    by_sub: dict[int, int] = {}
    for row in rows:
        code = str(row["scenario_code"])
        by_scenario[code] = by_scenario.get(code, 0) + 1
        sub = int(row["sub_code"])
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
