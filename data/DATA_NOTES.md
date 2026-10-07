# RetroFit Amsterdam: data notes

One row per Amsterdam buurt (517 rows), file `amsterdam_policy_data.csv`.
Boundaries: `amsterdam_buurten_2025.geojson` (517 buurten, WGS84, simplified to ~5 m). Join on `buurtcode` (format `0363AA01`). All 517 codes match.

Status labels used below:
- **Sourced**: taken directly from the named source.
- **Derived**: calculated from sourced inputs with the stated formula.
- **Assumption**: a simplification we had to make; must be shown as such in the UI.

## Columns

| Column | Meaning | Source / status |
|---|---|---|
| buurtcode, buurtnaam, wijkcode, wijknaam | Identifiers | CBS Kerncijfers wijken en buurten 2025; CBS buurt-wijk koppeling 2025. Sourced |
| dwellings, households | Dwelling stock, households | CBS Kerncijfers 2025. Sourced |
| pct_owner, pct_rent, pct_social_rent | Tenure shares (%) | CBS Kerncijfers 2025. Sourced |
| pct_house, pct_apartment | Single-family vs multi-family (%) | CBS Kerncijfers 2025. Sourced |
| woz_avg_eur | Average WOZ value (€) | CBS Kerncijfers 2025. Sourced. Buurt average only, no per-dwelling WOZ is public |
| gas_m3_avg, elec_kwh_avg | Average gas (m³) and electricity (kWh) per private dwelling, 2025 | CBS table 86159NED (published 31 Aug 2026). Sourced |
| district_heating_pct | % dwellings on district heating | CBS 86159NED. Sourced, but only 15 buurten published (privacy suppression) |
| pct_A … pct_G, n_labelled | Share of labelled dwellings per label (A includes A+ to A+++++); number of labelled dwellings | EP-Online (RVO) totaalbestand 1 Sep 2026, latest label per dwelling, matched to buurt via CBS PC6-huisnummer table 2025. Sourced |
| pct_DEFG | pct_D + pct_E + pct_F + pct_G | Derived. D-G is roughly the "low energy quality" group in CBS/TNO Monitor Energiearmoede |
| income_median_2024, income_mean_2024 | **Disposable** household income (€), 2024: gross income minus social security premiums, transfers paid and taxes; student households and institutions excluded | BBGA (OIS Amsterdam), IHHINK_MED / IHHINK_GEM. Sourced, definition confirmed in BBGA metadata |
| pct_hh_lowincome130_2024 | % households with income up to 130% of the social minimum (income only, no asset test), 2024 | BBGA, ILAAGHH130_P. Sourced, confirmed. **Use this as the map's low-income share** |
| pct_hh_minimum130_2024 | % "minima households": income up to 130% of the social minimum AND assets below the bijstand asset test. BBGA states these households qualify for Gemeente Amsterdam's poverty schemes | BBGA, IMINHH130_P. Sourced, confirmed. Subset of the column above |
| pct_hh_income_q1_2023, pct_hh_income_q5_2023 | % households in the lowest / highest 20% of the **national** disposable income distribution, 2023 | BBGA, IINKQ1_P / IINKQ5_P. Sourced, confirmed national quintiles |
| est_owner_DEFG_dwellings | Estimated owner-occupied D-G dwellings | **Assumption**: dwellings × pct_owner × pct_DEFG. Treats tenure and label as independent within a buurt, because no buurt-level cross-tab exists |
| woz_avg_above_cap | Buurt average WOZ > €666,000 | Derived. Proxy for the current scheme's WOZ cap; individual homes can be above or below |
| has_energy_data | False for 47 harbour/industrial buurten | Derived |
| low_gas_flag | gas_m3_avg < 150 m³ (45 buurten with ≥100 labels) | Derived. Likely district heating or all-electric; gas-based CO2 potential is near zero there |

## Fixed coefficients (for the config file)

| Coefficient | Value | Source / status |
|---|---|---|
| Renovation cost to schillabel B, apartment (meergezinswoning) | G €21,359 · F €15,951 · E €12,735 · D €9,945 | TNO/PBL, Bepaling Isolatiekosten Woningen, Startanalyse 2025, Table 3.1, "zelfstandig", 2020 euros excl. VAT. Sourced |
| Same, house (eengezinswoning) | G €35,219 · F €36,064 · E €25,388 · D €21,695 | Same. Sourced |
| VAT on those costs | ~15% average (9% labour, 21% material, 50/50 split) | Same TNO report. Sourced |
| Price level | 2020 euros | Not inflated to 2026; we have no sourced index. Must be stated in the UI |
| Floor area | Not used | TNO costs are averages per dwelling category, not per m². Do not scale cost by floor area |
| Relative gas use by label (G = 1.0) | A/B 0.816 · C/D 0.910 · E/F/G 1.0 → savings to B: 18.4% from E/F/G, ~10% from D | CBS, Energieverbruik particuliere woningen naar woningkenmerken 2019-2024 (ezk_profielen_2019-2024.xlsx), Tabel 6, 2024 (provisional). Measured, temperature-corrected gas use; comparison within 17 identical profiles (gas-heated, no solar PV, same construction period, floor area, dwelling type, household size), weighted by E/F/G stock share. Robust across years: A/B vs E/F/G 0.782 (2021, definitive), 0.807 (2023), 0.816 (2024); apartments 0.817, houses 0.814. CBS only reports label groups, and the A/B group includes A labels, so savings to exactly B are slightly overstated. Cross-sectional, not before/after renovation. The earlier Rabobank values are withdrawn (table could not be read reliably) |
| Label A | Not offered | No sourced cost for reaching A (TNO only covers insulation to schillabel B or D) |
| CO2 factor | 1.8 kg CO2 per m³ gas | RVO CO2-emissiefactoren (combustion factor ~1.79-1.89 in recent years). Sourced |
| Amsterdam current grant | €2,500 per dwelling; label D-G; WOZ < €666,000 (peiljaar 2024); owner-occupiers of houses, or VvE members if the whole VvE has an advice report | Gemeente Amsterdam, Extra Isolatiesubsidie. Sourced |
| ISDE (national) | Fixed €/m² per measure, doubling with 2+ measures within 24 months; applied for after the work | RVO. Sourced. RVO does not express it as a % of cost. Secondary sources summarise it as ~15% (one measure) / ~30% (two or more). We use 30% as an **approximation** for multi-measure packages. ISDE is identical under both schemes, so it does not affect the flat-vs-targeted comparison |
| Income threshold for the proposed top-up | 130% of the social minimum (income only) | Matches pct_hh_lowincome130_2024, so the map and the policy use the same definition. Amsterdam already uses the 130% social minimum line for its poverty schemes (BBGA definition of minima households). The Nationaal Warmtefonds €60,000 rule is a precedent for checking income at application, but it uses **gross** verzamelinkomen and cannot be compared with BBGA's disposable income, so it is not used in calculations |

## Not available (do not invent)

- Who actually received the Amsterdam grant or ISDE, per buurt: not published as far as we could find.
- Behavioural response (how many extra renovations per extra €): no reliable Amsterdam figure (Niessink, 2023, shows even ISDE additionality is uncertain). The tool shows potential allocation, not forecast uptake.
- Total budget of the current Amsterdam scheme: not found. Budget is a user input.
- Per-household WOZ or income: not public.
- Income distribution among owner-occupiers specifically: not available. Any income top-up cost computed from pct_hh_minimum130 is an **upper bound**, because owners are less likely to be on low incomes than renters.
- Gas price for payback periods: not sourced in our material, so no payback output.

## Findings computed from this file (buurten with ≥100 labelled dwellings and income data)

- D-G share vs median disposable income: correlation −0.08 (n=400). D-G share vs % low-income households (≤130% social minimum): 0.02 (n=392). CO2 potential per dwelling (CBS-based method above) vs % low-income households: −0.04 (n=386). Energy need and income need are close to unrelated across buurten.
- Owner share vs % low-income households: −0.62 (n=392). Low-income households concentrate where few people own their home.
- WOZ vs median income: 0.74 (as expected).
- In the 20% of buurten with the highest average WOZ, on average 17.4% of households are in the lowest 20% of the national income distribution (range 3-33%). In the lowest-WOZ 20%, 38.5%.
- Of the buurten in the top third by D-G share, 63 have below-median income and 71 above-median.
- Estimated 33,248 owner-occupied D-G dwellings citywide (assumption above); about 7,600 of them are in buurten whose average WOZ is above €666,000.

## Literature added after reading the full texts (for the Method / evidence section)

- **van den Brom, Meijer & Visscher (2019)**, Energy and Buildings 182, 251-263. ~90,000 renovated Dutch dwellings, same occupants before and after. 57% of renovations saved less than expected; deep renovations and packages of two or more insulation measures were overestimated most often (81%), but deep renovations still saved the most. Savings were higher for dwellings that were inefficient beforehand, and **higher-income occupants saved more energy than lower-income occupants**. Use: actual savings can fall short of label-based estimates; an income top-up trades some CO2 per euro for equity, and low-income households gain comfort even when savings are lower. Exact savings per label are only shown in charts, so no number from this paper enters the calculations.
- **Filippidou, Nieboer & Itard (2016)**, CLIMA 2016. Amsterdam subsidised housing associations' renovations in 2011-2014 if they achieved at least two label steps. Only 39% of dwellings registered a new label afterwards; of those, 58% achieved two or more steps. Gas use fell in almost all groups, but better predicted performance did not line up with larger actual savings. Use: precedent for a municipal subsidy to landlords, and evidence that monitoring must be built in.
- **Halleck Vega, van Leeuwen & van Twillert (2022)**, Energy Policy 160, 112659. Note: the team outline lists this as "Broers et al."; the actual authors are Halleck Vega, van Leeuwen and van Twillert. Spatial differences in uptake remain after controlling for household and building characteristics, which calls for place-sensitive policy. Private rental performs worse; tenants are often not allowed to make changes. **They found no clear relationship between income and investment.** Use: supports the geographic lever; do not cite it for an "income gap in uptake".
- **Croon, Hoekstra, Elsinga, Dalla Longa & Mulder (2023)**, Energy Policy 177, 113579. Headcount indicators miss the depth of energy poverty; spatial targeting based on incidence alone neglects the full depth of deprivation. Use: justification for a weighted formula instead of a yes/no eligibility rule. Limitation for us: we can measure incidence (share of low-income households), not depth, per buurt.
- **Fernández, Haffner & Elsinga (2022)**, IOP Conf. Ser.: Earth Environ. Sci. 1085, 012044. Upfront cost is the main barrier and threatens short-term affordability; middle and higher income groups are most likely to benefit, which raises the question of the regressive nature and targeting of flat-rate subsidies.
- **Ebrahimigharehbaghi, Qian, Meijer & Visscher (2019)**, Energy Policy 129, 546-561. Main barriers for Dutch homeowners: cost, process complexity, information, finding reliable experts; time needed to obtain loans and subsidies. Main driver is quality of life, not financial return.

## CO2 calculation (implemented in the app, factors from savings_config.json)

For each buurt, with f_L = relative gas use of label L versus G:
- mix = Σ over labels (pct_L / 100 × f_L)
- gas_G_equiv = gas_m3_avg / mix  (estimated gas use of an E/F/G-level dwelling in that buurt)
- CO2 avoided per dwelling per year moving from label L to B (tonnes) = gas_G_equiv × (f_L − f_B) × 1.8 / 1000
`savings_config.json` now has status VERIFIED. Keep a fallback: if status is ever not VERIFIED, CO2 outputs show "pending verified source".

Hand-check values (from this method): Sarphatiparkbuurt gas_m3_avg 600 → gas_G_equiv 684 m³ → 0.227 t CO2/yr per dwelling E/F/G→B, 0.116 for D→B. Diamantbuurt 730 → 794 m³ → 0.263 and 0.134. Across 352 buurten (≥100 labels, not low-gas) the median E/F/G→B value is 0.258 t/yr.
