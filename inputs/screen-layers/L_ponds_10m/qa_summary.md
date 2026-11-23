# Pond layer processing QA — Note 3b Step 2
**Date.** Processed from script `process_pond_layers_note3b.py`.
**Grid.** EPSG:32648, 10 m, nearest neighbour; MMU 0.5 ha (50 px); AOI = 5 km buffer of Jiang∪Clark ponds ∩ L20.
**Role.** Jiang 2020 replaces CAP L5 for pond *footprints*. Clark class 3 is the cross-check. Wet/dry/salt still need L6 (Sentinel) per Note 3b.

## Areas (ha)

| Layer | Year | ha |
| --- | --- | ---: |
| jiang_pond_1990 | 1990 | 4367.9 |
| jiang_pond_2000 | 2000 | 5209.81 |
| jiang_pond_2010 | 2010 | 6316.27 |
| jiang_pond_2020 | 2020 | 5358.94 |
| clark_pond_1999 | 1999 | 437.57 |
| clark_landcover_1999_pond | 1999 | 436.41 |
| clark_pond_2014 | 2014 | 1581.88 |
| clark_landcover_2014_pond | 2014 | 1581.36 |
| clark_pond_2018 | 2018 | 1572.28 |
| clark_landcover_2018_pond | 2018 | 1571.64 |
| clark_pond_2020 | 2020 | 1790.88 |
| clark_landcover_2020_pond | 2020 | 1791.12 |
| clark_pond_2022 | 2022 | 1830.74 |
| clark_landcover_2022_pond | 2022 | 1830.98 |
| clark_change_1999_2022_mangrove_to_pond | 1999_2022 | 58.1 |
| clark_change_1999_2022_pond_persistence | 1999_2022 | 364.51 |
| clark_change_1999_2022_pond_to_mangrove | 1999_2022 | 1.25 |
| clark_change_1999_2022_other_to_pond | 1999_2022 | 1255.17 |
| clark_change_2020_2022_mangrove_to_pond | 2020_2022 | 4.31 |
| clark_change_2020_2022_pond_persistence | 2020_2022 | 1797.11 |
| clark_change_2020_2022_pond_to_mangrove | 2020_2022 | 1.52 |
| clark_change_2020_2022_other_to_pond | 2020_2022 | 40.37 |
| step2_pond_jiang2020 | 2020 | 5358.94 |
| step2_pond_clark2022 | 2022 | 1830.74 |
| step2_pond_union |  | 6918.41 |
| step2_pond_agree |  | 268.55 |
| step2_pond_jiang_only |  | 5087.5 |
| step2_pond_clark_only |  | 1559.3 |

## By province (Step 2)

| Province | Jiang 2020 | Clark 2022 | Union | Agree |
| --- | ---: | ---: | ---: | ---: |
| Koh Kong | 1491.38 | 449.32 | 1774.3 | 163.68 |
| Kep | 764.69 | 8.34 | 765.22 | 7.81 |
| Kampot | 2763.43 | 1083.06 | 3815.93 | 30.56 |
| Preah Sihanouk | 339.44 | 290.02 | 562.96 | 66.5 |

## Licence

- Jiang: Zenodo open, licence field null — HOLD redistribution.
- Clark: README CC BY 4.0; download page non-commercial rider — FLAG.
- Do not include these rasters in a public package until cleared.
