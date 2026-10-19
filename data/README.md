# data/toilets.csv

- **Dataset:** 전국공중화장실표준데이터 (Korea public toilet standard dataset), published on the Korean Public Data Portal.
- **Source page:** https://www.data.go.kr/data/15012892/standard.do
- **Downloaded:** 2026-10-18 (standard-dataset CSV export). SHA-256 of this file: `56c386280160e41e3ee6464c4e33f60ed87b321d129fad4e8664b0b7a4a1f434`.
- **Rows:** 33,820 data rows, 30 columns, UTF-8 with BOM. The latest `데이터기준일자` (reference date) in the file is 2020-06-08, so treat opening hours as indicative.
- **Terms of use:** the portal lists the dataset's usage scope as "이용허락범위: 제한 없음" (no restriction on use). The data is reproduced here unchanged.

Columns used by the app: `구분` (type), `화장실명` (name), `소재지도로명주소` / `소재지지번주소` (road / lot address), `개방시간` (opening hours, free text), `위도` (latitude), `경도` (longitude), `데이터기준일자` (reference date). Rows whose coordinates are blank or fall outside latitude 33–39 / longitude 124–132 are ignored (6,794 rows), and exact duplicates (same name and coordinates) are kept once (2,705 rows dropped), leaving 24,321 toilets.
