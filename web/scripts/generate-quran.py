"""Build app data from the verbatim Tanzil text and its surah metadata."""

import json
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources" / "tanzil-uthmani-v1.0.2.txt"
METADATA = ROOT / "sources" / "tanzil-quran-data.xml"
OUTPUT = ROOT / "src" / "data" / "quran-full.json"
BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"

lines = SOURCE.read_text(encoding="utf-8-sig").splitlines()
verses = lines[:6236]
assert len(verses) == 6236 and all(verses)
assert all(not line.startswith("#") for line in verses)
suras = ElementTree.parse(METADATA).findall("./suras/sura")
assert len(suras) == 114

result = []
for number, sura in enumerate(suras, start=1):
    assert int(sura.attrib["index"]) == number
    start, count = int(sura.attrib["start"]), int(sura.attrib["ayas"])
    raw_verses = verses[start : start + count]
    assert len(raw_verses) == count
    assert start + count == (int(suras[number].attrib["start"]) if number < 114 else 6236)
    first = raw_verses[0]
    has_basmala = number not in (1, 9)
    if has_basmala:
        # Tanzil 1.0.2 has a different initial diacritic in surah 95.
        # Preserve each surah's exact prefix instead of normalizing it.
        basmala, first_ayah = " ".join(first.split(" ")[:4]), " ".join(first.split(" ")[4:])
        assert first_ayah and basmala.endswith("ٱلرَّحِيمِ"), (number, first)
        raw_verses[0] = first_ayah
        assert basmala + " " + raw_verses[0] == first
    result.append({
        "number": number,
        "name": {1: "Al-Fatihah", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"}.get(number, sura.attrib["tname"]),
        "arabicName": sura.attrib["name"],
        "meaning": {1: "Pembuka", 112: "Ikhlas", 113: "Waktu Subuh", 114: "Manusia"}.get(number, f"{count} ayat"),
        "verses": [{"number": ayah, "text": text} for ayah, text in enumerate(raw_verses, start=1)],
        **({"basmala": basmala} if has_basmala else {}),
    })

assert sum(len(sura["verses"]) for sura in result) == 6236
OUTPUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Generated {len(result)} surahs / {sum(len(s['verses']) for s in result)} ayahs in {OUTPUT}")
