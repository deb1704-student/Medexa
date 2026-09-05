from pathlib import Path

from scripts.validate_wb_data import validate


DATA_DIR = Path(__file__).resolve().parents[2] / "datasets" / "wb_final"


def test_coordinate_status_accepts_all_canonical_values(tmp_path):
    """The validator accepts source provenance states used by the final WB dataset."""
    import csv
    import shutil

    fixture = tmp_path / "data"
    shutil.copytree(DATA_DIR, fixture)
    facilities = fixture / "medexa_facilities.csv"
    rows = list(csv.DictReader(facilities.open(encoding="utf-8-sig", newline="")))
    rows[0]["coordinate_status"] = "PRESENT"
    rows[1]["coordinate_status"] = "MISSING_IN_SUPPLIED_SOURCE"
    rows[2]["coordinate_status"] = "MISSING_OR_INVALID"
    with facilities.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    assert validate(fixture) == 0


def test_empty_geography_rows_are_non_fatal(tmp_path):
    """Rows with both geography code and name empty are source gaps, not entities."""
    import csv
    import shutil

    fixture = tmp_path / "data"
    shutil.copytree(DATA_DIR, fixture)
    path = fixture / "medexa_subdistricts.csv"
    rows = list(csv.DictReader(path.open(encoding="utf-8-sig", newline="")))
    rows.append({
        "district_code": "315",
        "district_name": "KOLKATA",
        "subdistrict_code": "",
        "subdistrict_name": "",
    })
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    assert validate(fixture) == 0


def test_partially_empty_geography_row_is_still_an_error(tmp_path):
    """A code/name mismatch is malformed data and must not be silently skipped."""
    import csv
    import shutil

    fixture = tmp_path / "data"
    shutil.copytree(DATA_DIR, fixture)
    path = fixture / "medexa_subdistricts.csv"
    rows = list(csv.DictReader(path.open(encoding="utf-8-sig", newline="")))
    rows.append({
        "district_code": "315",
        "district_name": "KOLKATA",
        "subdistrict_code": "SYNTHETIC-BAD-001",
        "subdistrict_name": "",
    })
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    assert validate(fixture) == 1
