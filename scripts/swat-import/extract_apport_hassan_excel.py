import csv
import datetime as dt
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


NS_MAIN = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("x:si", NS_MAIN):
        parts = [t.text or "" for t in si.findall(".//x:t", NS_MAIN)]
        out.append("".join(parts))
    return out


def workbook_first_sheet_path(zf: zipfile.ZipFile) -> str:
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    first_sheet = wb.find("x:sheets/x:sheet", NS_MAIN)
    if first_sheet is None:
        raise RuntimeError("No worksheet found in workbook.xml")
    rel_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    if not rel_id:
        raise RuntimeError("Worksheet relationship id not found")

    rel_root = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    for rel in rel_root.findall("r:Relationship", NS_REL):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib.get("Target")
            if not target:
                break
            target = target.lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            return target
    raise RuntimeError(f"Worksheet target not found for rel_id={rel_id}")


def parse_date(value: str) -> dt.date | None:
    value = (value or "").strip()
    if not value:
        return None

    # Excel serial date (OA)
    if re.fullmatch(r"-?\d+(\.\d+)?", value):
        serial = float(value)
        base = dt.datetime(1899, 12, 30)
        return (base + dt.timedelta(days=serial)).date()

    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y"):
        try:
            return dt.datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def parse_float(value: str) -> float | None:
    value = (value or "").strip()
    if not value:
        return None
    value = value.replace(" ", "").replace("\u00a0", "").replace(",", ".")
    try:
        return float(value)
    except ValueError:
        return None


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


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_apport_hassan_excel.py <input.xlsx> <output.csv>")
        return 1

    input_xlsx = Path(sys.argv[1])
    output_csv = Path(sys.argv[2])
    if not input_xlsx.exists():
        print(f"Input file not found: {input_xlsx}")
        return 2

    with zipfile.ZipFile(input_xlsx, "r") as zf:
        shared = read_shared_strings(zf)
        sheet_path = workbook_first_sheet_path(zf)
        sheet_root = ET.fromstring(zf.read(sheet_path))

    rows_out: list[tuple[dt.date, float]] = []
    for row in sheet_root.findall("x:sheetData/x:row", NS_MAIN):
        row_index = int(row.attrib.get("r", "0"))
        if row_index <= 1:
            continue

        raw_a = ""
        raw_b = ""
        for cell in row.findall("x:c", NS_MAIN):
            ref = cell.attrib.get("r", "")
            if ref.startswith("A"):
                raw_a = cell_text(cell, shared)
            elif ref.startswith("B"):
                raw_b = cell_text(cell, shared)

        d = parse_date(raw_a)
        q = parse_float(raw_b)
        if d is None or q is None:
            continue
        rows_out.append((d, q))

    rows_out.sort(key=lambda x: x[0])
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "value"])
        for d, q in rows_out:
            writer.writerow([d.isoformat(), f"{q:.10g}"])

    if not rows_out:
        print("No rows extracted from workbook.")
        return 3

    print(f"Extracted rows: {len(rows_out)}")
    print(f"Date range: {rows_out[0][0].isoformat()} -> {rows_out[-1][0].isoformat()}")
    print(f"Output: {output_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

