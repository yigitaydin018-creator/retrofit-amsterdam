/**
 * HERITAGE PROTECTION FLAG (approximate, wijk level)
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * Amsterdam has roughly 9,800 protected monuments, and a number of historic
 * areas carry "beschermd stadsgezicht" (protected cityscape) status. Inside
 * those areas, work on the building envelope is constrained: external
 * insulation, window replacement, and visible measures such as panels or an
 * outdoor heat-pump unit generally need a municipal permit and may be refused
 * or altered. That matters here because it offers a plausible reading of a
 * pattern in the data, namely that poorly-labelled dwellings persist in some of
 * the most expensive neighbourhoods in the city.
 *
 * Source: Gemeente Amsterdam,
 * amsterdam.nl/wonen-bouwen-verbouwen/monumenten-archeologie
 *
 * ---------------------------------------------------------------------------
 * THIS IS AN APPROXIMATION. READ BEFORE RELYING ON IT.
 * ---------------------------------------------------------------------------
 * There is no buurt-level dataset of protected status in this project, and the
 * real designations follow street and parcel boundaries rather than CBS
 * statistical geography. The flag is therefore applied at wijk level, and it is
 * coarse in both directions:
 *
 *  - Too broad: a flagged wijk will contain individual buurten, streets and
 *    post-war infill that carry no protection at all.
 *  - Too narrow: protected monuments exist across the whole city, well outside
 *    the areas listed here.
 *
 * It is an informational prompt to check the actual designation, nothing more.
 * It deliberately feeds nothing into cost, subsidy, CO2 or payback.
 *
 * Replacing this with the real municipal designation layer would be the right
 * fix, and it is the same piece of work as adding the CBS boundary geometry for
 * a proper choropleth.
 *
 * ---------------------------------------------------------------------------
 * HOW EACH ENTRY WAS CHOSEN
 * ---------------------------------------------------------------------------
 * Names below are matched against `wijknaam` exactly as it appears in the CBS
 * data, so this list is only as good as that spelling.
 *
 * Not every area is a wijk. Three mappings are inferences rather than municipal
 * designations, and anything citing this file should say so. They are listed
 * together here, and again beside the entries themselves:
 *
 *   Oud-Zuid        INDICATIVE. No wijk of this name. Split into Museumkwartier,
 *                   Apollobuurt, Willemspark and Vondelparkbuurt, the four
 *                   wijken forming its historic core.
 *
 *   Rivierenbuurt   INDICATIVE. No wijk of this name. Split into IJselbuurt,
 *                   Rijnbuurt and Scheldebuurt, its three constituent wijken,
 *                   with Stadionbuurt covering Plan Zuid.
 *
 *   Admiralenbuurt  WEAKEST MAPPING. No wijk or buurt of this name exists in
 *                   the data at all. Approximated by Chassebuurt, whose
 *                   constituent buurten are Van Brakelkwartier,
 *                   Kortenaerkwartier and Filips van Almondekwartier, the
 *                   admiral-named streets the Admiralenbuurt is named for.
 *
 * Everything else is a direct name match. Spaarndammerbuurt/Zeeheldenbuurt was
 * added beyond the areas originally named for this feature.
 *
 * The same table is in the README under "Which mappings are approximate", for
 * citing in the AI statement.
 */

export const HERITAGE_SOURCE =
  'Gemeente Amsterdam, monumenten en archeologie. Applied at wijk level as an approximation.'

export const HERITAGE_WIJKEN = {
  // The historic core, covered by the Amsterdam beschermd stadsgezicht. The
  // 17th-century canal ring within it is also a UNESCO World Heritage site.
  'Burgwallen-Oude Zijde': 'Historic centre',
  'Burgwallen-Nieuwe Zijde': 'Historic centre',
  'Grachtengordel-West': 'Historic centre',
  'Grachtengordel-Zuid': 'Historic centre',
  Haarlemmerbuurt: 'Historic centre',
  Jordaan: 'Historic centre',
  'Nieuwmarkt/Lastage': 'Historic centre',
  'De Weteringschans': 'Historic centre',
  'Weesperbuurt/Plantage': 'Historic centre',
  'Oostelijke Eilanden/Kadijken': 'Historic centre',

  // Oud-Zuid. There is no wijk literally called "Oud-Zuid" in the CBS data, so
  // the four wijken that make up its historic core are flagged individually.
  Museumkwartier: 'Oud-Zuid',
  Apollobuurt: 'Oud-Zuid',
  Willemspark: 'Oud-Zuid',
  Vondelparkbuurt: 'Oud-Zuid',

  // Plan Zuid, Berlage's 1917 extension, and the Rivierenbuurt built out under
  // it. Rivierenbuurt appears in the data as its three constituent wijken.
  Stadionbuurt: 'Plan Zuid',
  IJselbuurt: 'Plan Zuid / Rivierenbuurt',
  Rijnbuurt: 'Plan Zuid / Rivierenbuurt',
  Scheldebuurt: 'Plan Zuid / Rivierenbuurt',

  // Betondorp, the 1920s experimental concrete garden village.
  Betondorp: 'Betondorp',

  // Admiralenbuurt. The weakest match in this list: no wijk or buurt of that
  // name exists in the CBS data. Chassebuurt is used because its constituent
  // buurten are Van Brakelkwartier, Kortenaerkwartier and Filips van
  // Almondekwartier, the admiral-named streets that give the Admiralenbuurt its
  // name. Treat this entry as indicative rather than authoritative.
  Chassébuurt: 'Admiralenbuurt (approximate)',

  // Amsterdam School housing blocks, Het Schip among them. Not on the original
  // list for this feature, added because the designation there is well
  // established.
  'Spaarndammerbuurt/Zeeheldenbuurt': 'Amsterdam School',
}

/** The designation family for a buurt, or null where none is flagged. */
export function heritageAreaOf(buurt) {
  if (!buurt?.wijkName) return null
  return HERITAGE_WIJKEN[buurt.wijkName] ?? null
}

export const isHeritage = (buurt) => heritageAreaOf(buurt) !== null

/** Shown wherever the flag surfaces. Kept in one place so it stays consistent. */
export const HERITAGE_NOTICE =
  'This area may be a protected cityscape (beschermd stadsgezicht). Renovation, including insulation and visible sustainability measures, may require a municipal permit and face additional constraints.'
