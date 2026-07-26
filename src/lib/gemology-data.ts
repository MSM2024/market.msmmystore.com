import type { SapphireColor, SapphireCut, SapphireClarity, SapphireOrigin, FamousSapphire } from "./gemology-types"

export const FAMOUS_SAPPHIRES: FamousSapphire[] = [
  {
    id: "logan",
    name: "The Logan Sapphire",
    weight: "422.99 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Cushion-cut",
    color: "Deep Royal Blue",
    yearFound: "Pre-19th Century",
    location: "Smithsonian Institution, Washington D.C.",
    story: "One of the world's largest faceted blue sapphires, the Logan is set in a brooch surrounded by 20 round brilliant-cut diamonds. Gifted to the Smithsonian in 1960 by Mrs. John A. Logan, it is celebrated for its remarkable clarity and deep, rich velvet blue saturation, showing virtually no inclusions under magnification.",
    imageAlt: "The Logan Sapphire brooch"
  },
  {
    id: "star-india",
    name: "The Star of India",
    weight: "563.35 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Cabochon (Star)",
    color: "Medium Milky Blue",
    yearFound: "circa 18th Century",
    location: "American Museum of Natural History, New York",
    story: "The Star of India is the world's largest gem-quality blue star sapphire. It is famous for its distinct, sharp six-rayed asterism (the 'star' caused by aligned microscopic needles of rutile, or 'silk'). In 1964, it was stolen in a high-profile museum heist but was successfully recovered from a bus depot locker in Miami.",
    imageAlt: "The Star of India sapphire"
  },
  {
    id: "bismarck",
    name: "The Bismarck Sapphire",
    weight: "98.6 Carats",
    origin: "Burma (Myanmar)",
    cut: "Cushion-cut",
    color: "Cornflower Blue",
    yearFound: "1913",
    location: "Smithsonian Institution, Washington D.C.",
    story: "Unearthed in the legendary Mogok valley of Burma, this sapphire is renowned for its intense cornflower blue color. It was set in an exquisite art deco necklace by Cartier in 1927, paired with baguette diamonds and rock crystal, commissioned by Countess Mona von Bismarck.",
    imageAlt: "The Bismarck Sapphire necklace"
  },
  {
    id: "rockefeller",
    name: "The Rockefeller Sapphire",
    weight: "62.02 Carats",
    origin: "Burma (Myanmar)",
    cut: "Rectangular Step-cut",
    color: "Vibrant Royal Blue",
    yearFound: "circa 1930s",
    location: "Private Collection (Sold via Christie's)",
    story: "Originally purchased by John D. Rockefeller Jr. from an Indian Maharajah, this stone is a masterclass in step-cut gemology. Its unique clean emerald-cut format is highly unusual for sapphires, showcasing a vivid blue that lacks any dark zones or greenish modifiers. It sold at auction for over $3 million.",
    imageAlt: "The Rockefeller Sapphire ring"
  },
  {
    id: "blue-belle",
    name: "The Blue Belle of Asia",
    weight: "392.52 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Cushion-cut",
    color: "Cornflower Blue",
    yearFound: "1926",
    location: "Private Collection",
    story: "The Blue Belle of Asia is the fourth-largest faceted blue sapphire in the world. Mined in Sri Lanka, it displays an exquisite cornflower blue color with exceptional clarity. Sold at Christie's Geneva in 2014 for over $17 million, setting a world auction record for any sapphire.",
    imageAlt: "The Blue Belle of Asia sapphire"
  },
  {
    id: "blue-giant",
    name: "The Blue Giant of the Orient",
    weight: "486.52 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Oval-cut",
    color: "Deep Royal Blue",
    yearFound: "circa 1900s",
    location: "Private Collection",
    story: "One of the largest faceted blue sapphires known to exist. It was cut from a magnificent rough crystal discovered in Sri Lanka. Its deep royal blue color, combined with its massive size, makes it one of the most important sapphires ever documented.",
    imageAlt: "The Blue Giant of the Orient"
  },
  {
    id: "midnight",
    name: "The Midnight Star Sapphire",
    weight: "116.75 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Cabochon (Star)",
    color: "Deep Indigo",
    yearFound: "Pre-20th Century",
    location: "American Museum of Natural History, New York",
    story: "A remarkably large deep indigo star sapphire cabochon exhibiting a sharp, well-centered six-rayed star. Unlike the milky Star of India, the Midnight Star demonstrates how asterism can appear even on very dark, richly saturated corundum. Its star beams seem to float over a bottomless dark pool of deep indigo color.",
    imageAlt: "The Midnight Star Sapphire"
  },
  {
    id: "padparadscha",
    name: "The Padparadscha of Trelawny",
    weight: "23.64 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Cushion-cut",
    color: "Pinkish-Orange",
    yearFound: "Pre-1920",
    location: "Private Collection / Royal Jewel Vault",
    story: "One of the finest documented Padparadscha sapphires. Hailing from the famed gem gravels of Sri Lanka, this stone displays an exquisite sunset-like balance between lotus-pink and orange. The name Padparadscha derives from the Sinhalese word for aquatic lotus blossom.",
    imageAlt: "The Padparadscha of Trelawny pendant"
  },
  {
    id: "star-of-bombay",
    name: "The Star of Bombay",
    weight: "182.00 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Cabochon (Star)",
    color: "Medium Blue-Grey",
    yearFound: "Pre-1900",
    location: "Smithsonian Institution, Washington D.C.",
    story: "This star sapphire was gifted by Douglas Fairbanks to his wife, the legendary actress Mary Pickford, a silent film star and co-founder of the Academy of Motion Picture Arts and Sciences. She wore it as a ring for decades, helping popularize star sapphires among Hollywood royalty.",
    imageAlt: "The Star of Bombay sapphire ring"
  },
  {
    id: "queen-marie",
    name: "The Queen Marie of Romania Sapphire",
    weight: "478.68 Carats",
    origin: "Ceylon (Sri Lanka)",
    cut: "Giant Cushion-cut",
    color: "Intense Cornflower Blue",
    yearFound: "Pre-1913",
    location: "Private/Royal Collection",
    story: "Originally acquired by Cartier, this colossal sapphire was purchased by King Ferdinand of Romania for his consort, the charismatic Queen Marie. It is an untreated sapphire of unparalleled proportions, exhibiting a velvety luster and historic royal heritage throughout the turbulent World War eras.",
    imageAlt: "Queen Marie of Romania Sapphire"
  }
]

export interface ColorDef {
  name: SapphireColor
  hex: string
  gradientFrom: string
  gradientTo: string
  multiplier: number
  description: string
  absorptionSpectrum: string
  physicsDetails: string
}

export const COLOR_DEFINITIONS: Record<SapphireColor, ColorDef> = {
  "Cornflower Blue": {
    name: "Cornflower Blue",
    hex: "#4A76A8",
    gradientFrom: "from-blue-400",
    gradientTo: "to-sky-600",
    multiplier: 1.8,
    description: "A highly desirable, soft medium-blue shade with a velvety or 'sleepy' luster, reminiscent of the cornflower blossom.",
    absorptionSpectrum: "Strong iron (Fe3+) absorption bands at 377, 388, and 450 nm.",
    physicsDetails: "Caused by iron and titanium charge transfers (Fe2+ -> Ti4+) within the corundum lattice."
  },
  "Royal Blue": {
    name: "Royal Blue",
    hex: "#0F4C81",
    gradientFrom: "from-blue-600",
    gradientTo: "to-indigo-950",
    multiplier: 2.2,
    description: "The peak standard of sapphire prestige. A deep, vivid, pure blue with intense saturation.",
    absorptionSpectrum: "Dominant Fe2+/Ti4+ charge transfer bands between 500-700 nm.",
    physicsDetails: "Requires a slightly higher iron content than cornflower blue, producing a deeper absorption profile."
  },
  "Deep Indigo": {
    name: "Deep Indigo",
    hex: "#1E2A47",
    gradientFrom: "from-slate-700",
    gradientTo: "to-indigo-900",
    multiplier: 0.9,
    description: "A very deep, dark blue shade with subtle blackish or gray undertones.",
    absorptionSpectrum: "Significant iron-related bands at 450 nm and heavy infrared absorption.",
    physicsDetails: "High concentration of iron relative to titanium, leading to secondary Fe-Fe charge transfers."
  },
  "Padparadscha": {
    name: "Padparadscha",
    hex: "#F4A261",
    gradientFrom: "from-pink-400",
    gradientTo: "to-orange-500",
    multiplier: 3.5,
    description: "The ultra-rare 'lotus flower' sapphire. A breathtaking marriage of pink and orange.",
    absorptionSpectrum: "Combined chromium-related R-lines at 694 nm and trace iron absorption bands.",
    physicsDetails: "A precise combination of trace chromium impurities (pink) and color centers (orange)."
  },
  "Canary Yellow": {
    name: "Canary Yellow",
    hex: "#E9C46A",
    gradientFrom: "from-amber-300",
    gradientTo: "to-yellow-500",
    multiplier: 1.2,
    description: "Bright, cheerful, and intensely saturated golden-yellow sapphire.",
    absorptionSpectrum: "Absence of iron bands at 450 nm, showing clean blue-to-violet absorption.",
    physicsDetails: "Colored by stable color centers or trace interstitial iron (Fe3+) without titanium."
  },
  "Vivid Pink": {
    name: "Vivid Pink",
    hex: "#E76F51",
    gradientFrom: "from-pink-400",
    gradientTo: "to-rose-600",
    multiplier: 1.5,
    description: "Vibrant, electric pink sapphire. When chromium increases, transitions into Ruby.",
    absorptionSpectrum: "Strong chromium absorption bands in the green-yellow region (550 nm).",
    physicsDetails: "Chromium (Cr3+) substituting for aluminum (Al3+) in octahedral corundum sites."
  },
  "Peacock Teal": {
    name: "Peacock Teal",
    hex: "#2A9D8F",
    gradientFrom: "from-teal-400",
    gradientTo: "to-emerald-700",
    multiplier: 1.1,
    description: "A modern collector favorite. Dual blue-green pleochroic balance.",
    absorptionSpectrum: "Overlapping titanium-iron charge transfers and structural iron absorption.",
    physicsDetails: "Results from a mix of blue Fe2+-Ti4+ complexes and yellow Fe3+ ions."
  },
  "Star Sapphire": {
    name: "Star Sapphire",
    hex: "#7A9FC2",
    gradientFrom: "from-blue-300",
    gradientTo: "to-indigo-500/80",
    multiplier: 2.0,
    description: "An opaque to translucent dome displaying a stunning floating six-rayed star.",
    absorptionSpectrum: "Diffused rutile scattering bands across all angles.",
    physicsDetails: "Features three directions of microscopic rutile (TiO2) needles at 60/120 degrees."
  }
}

export interface CutDef {
  name: SapphireCut
  ratio: string
  refractiveFacets: number
  description: string
  paths: {
    outline: string
    facets: string[]
  }
}

export const CUT_DEFINITIONS: Record<SapphireCut, CutDef> = {
  "Oval": {
    name: "Oval",
    ratio: "1.20",
    refractiveFacets: 57,
    description: "Elongated symmetry that maximizes carat retention.",
    paths: {
      outline: "M 100 30 C 145 30, 180 60, 180 100 C 180 140, 145 170, 100 170 C 55 170, 20 140, 20 100 C 20 60, 55 30, 100 30 Z",
      facets: [
        "M 100 60 L 135 75 L 135 125 L 100 140 L 65 125 L 65 75 Z",
        "M 100 60 L 100 140",
        "M 65 100 L 135 100",
        "M 100 60 L 100 30",
        "M 135 75 L 180 60",
        "M 135 125 L 180 140",
        "M 100 140 L 100 170",
        "M 65 125 L 20 140",
        "M 65 75 L 20 60",
        "M 65 100 L 20 100",
        "M 135 100 L 180 100"
      ]
    }
  },
  "Cushion": {
    name: "Cushion",
    ratio: "1.05",
    refractiveFacets: 64,
    description: "Classic historical cut with soft pillow-like corners.",
    paths: {
      outline: "M 45 20 L 155 20 C 185 20, 185 20, 185 50 L 185 150 C 185 180, 185 180, 155 180 L 45 180 C 15 180, 15 180, 15 150 L 15 50 C 15 20, 15 20, 45 20 Z",
      facets: [
        "M 65 65 L 135 65 L 135 135 L 65 135 Z",
        "M 65 65 L 15 20",
        "M 135 65 L 185 20",
        "M 135 135 L 185 180",
        "M 65 135 L 15 180",
        "M 100 65 L 100 20",
        "M 135 100 L 185 100",
        "M 100 135 L 100 180",
        "M 65 100 L 15 100"
      ]
    }
  },
  "Round": {
    name: "Round",
    ratio: "1.00",
    refractiveFacets: 58,
    description: "Standard for maximum sparkle with optimized kite and star facets.",
    paths: {
      outline: "M 100 15 A 85 85 0 1 1 99.9 15 Z",
      facets: [
        "M 100 55 L 132 68 L 145 100 L 132 132 L 100 145 L 68 132 L 55 100 L 68 68 Z",
        "M 100 55 L 100 15",
        "M 132 68 L 160 40",
        "M 145 100 L 185 100",
        "M 132 132 L 160 160",
        "M 100 145 L 100 185",
        "M 68 132 L 40 160",
        "M 55 100 L 15 100",
        "M 68 68 L 40 40",
        "M 100 55 L 132 68",
        "M 132 68 L 145 100",
        "M 145 100 L 132 132",
        "M 132 132 L 100 145",
        "M 100 145 L 68 132",
        "M 68 132 L 55 100",
        "M 55 100 L 68 68",
        "M 68 68 L 100 55"
      ]
    }
  },
  "Emerald": {
    name: "Emerald",
    ratio: "1.35",
    refractiveFacets: 46,
    description: "Prestigious step-cut with flat parallel facets like a hall of mirrors.",
    paths: {
      outline: "M 45 20 L 155 20 L 185 50 L 185 150 L 155 180 L 45 180 L 15 150 L 15 50 Z",
      facets: [
        "M 50 30 L 150 30 L 175 55 L 175 145 L 150 170 L 50 170 L 25 145 L 25 55 Z",
        "M 60 45 L 140 45 L 160 65 L 160 135 L 140 155 L 60 155 L 40 135 L 40 65 Z",
        "M 75 65 L 125 65 L 125 135 L 75 135 Z",
        "M 15 20 L 75 65",
        "M 185 20 L 125 65",
        "M 185 180 L 125 135",
        "M 15 180 L 75 135"
      ]
    }
  },
  "Pear": {
    name: "Pear",
    ratio: "1.45",
    refractiveFacets: 58,
    description: "Tear-drop shape combining brilliant and marquise qualities.",
    paths: {
      outline: "M 100 15 C 130 50, 185 110, 185 145 C 185 175, 145 190, 100 190 C 55 190, 15 175, 15 145 C 15 110, 70 50, 100 15 Z",
      facets: [
        "M 100 55 L 135 115 L 135 155 L 100 170 L 65 155 L 65 115 Z",
        "M 100 55 L 100 15",
        "M 135 115 L 185 110",
        "M 135 155 L 180 165",
        "M 100 170 L 100 190",
        "M 65 155 L 20 165",
        "M 65 115 L 15 110",
        "M 100 55 L 135 155",
        "M 100 55 L 65 155"
      ]
    }
  },
  "Marquise": {
    name: "Marquise",
    ratio: "2.00",
    refractiveFacets: 57,
    description: "Boat-shaped cut with pointed ends for elongated visual profile.",
    paths: {
      outline: "M 100 15 C 150 50, 180 100, 180 100 C 180 100, 150 150, 100 185 C 50 150, 20 100, 20 100 C 20 100, 50 50, 100 15 Z",
      facets: [
        "M 100 50 L 140 100 L 100 150 L 60 100 Z",
        "M 100 50 L 100 15",
        "M 140 100 L 180 100",
        "M 100 150 L 100 185",
        "M 60 100 L 20 100",
        "M 100 50 L 180 100",
        "M 100 150 L 180 100",
        "M 100 150 L 20 100",
        "M 100 50 L 20 100"
      ]
    }
  },
  "Heart": {
    name: "Heart",
    ratio: "1.00",
    refractiveFacets: 59,
    description: "Ultimate symbol of romance requiring expert lapidary precision.",
    paths: {
      outline: "M 100 45 C 100 45, 130 15, 165 25 C 190 35, 195 70, 175 115 C 155 150, 115 180, 100 190 C 85 180, 45 150, 25 115 C 5 70, 10 35, 35 25 C 70 15, 100 45, 100 45 Z",
      facets: [
        "M 100 70 C 100 70, 120 50, 140 55 C 155 60, 155 85, 140 110 C 130 125, 110 145, 100 155 C 90 145, 70 125, 60 110 C 45 85, 45 60, 60 55 C 80 50, 100 70, 100 70 Z",
        "M 100 45 L 100 70",
        "M 140 55 L 165 25",
        "M 140 110 L 175 115",
        "M 100 155 L 100 190",
        "M 60 110 L 25 115",
        "M 60 55 L 35 25"
      ]
    }
  }
}

export const CLARITY_DESCRIPTIONS: Record<SapphireClarity, { name: string; multiplier: number; desc: string; details: string }> = {
  "IF": {
    name: "IF (Internally Flawless)",
    multiplier: 1.6,
    desc: "No inclusions visible under 10x magnification.",
    details: "Extremely rare in natural corundum."
  },
  "VVS1": {
    name: "VVS1 (Very Very Slightly Included 1)",
    multiplier: 1.4,
    desc: "Minute inclusions, extremely difficult to see under 10x.",
    details: "Superb investment-grade quality."
  },
  "VVS2": {
    name: "VVS2 (Very Very Slightly Included 2)",
    multiplier: 1.25,
    desc: "Minor trace inclusions only visible under strict 10x.",
    details: "Visually identical to IF without magnification."
  },
  "VS1": {
    name: "VS1 (Very Slightly Included 1)",
    multiplier: 1.1,
    desc: "Minor inclusions detectable with effort under 10x.",
    details: "Often micro-needles of rutile."
  },
  "VS2": {
    name: "VS2 (Very Slightly Included 2)",
    multiplier: 0.95,
    desc: "Slight inclusions visible under 10x; completely eye-clean.",
    details: "Sweet-spot for jewelry."
  },
  "SI1": {
    name: "SI1 (Slightly Included 1)",
    multiplier: 0.75,
    desc: "Inclusions visible under 10x and may be barely eye-visible.",
    details: "Contains silk, crystal clusters, or color-zoning."
  }
}

export const ORIGIN_FACTS: Record<SapphireOrigin, { name: string; multiplier: number; colorVibe: string; description: string; spectralFact: string }> = {
  "Kashmir": {
    name: "Kashmir",
    multiplier: 2.8,
    colorVibe: "Cornflower Blue / Sleepy Luster",
    description: "The holy grail of sapphires. Mined in the high Himalayas between 1881 and 1887.",
    spectralFact: "Contains extreme liquid-filled negative crystals and zoned rutile silk."
  },
  "Burma (Myanmar)": {
    name: "Burma (Myanmar)",
    multiplier: 2.2,
    colorVibe: "Electric Royal Blue / Mogok Velvets",
    description: "Sourced from the historic Mogok Stone Tract. Deeply saturated electric royal blue.",
    spectralFact: "Often shows polysynthetic twinning lines and star-like needles."
  },
  "Ceylon (Sri Lanka)": {
    name: "Ceylon (Sri Lanka)",
    multiplier: 1.3,
    colorVibe: "Bright Cornflower & Canary Yellow",
    description: "Sri Lanka has mined sapphires for over 2000 years. Bright luster and pastel-to-medium blues.",
    spectralFact: "Typically displays 'fingerprint' inclusions and long rutile needles."
  },
  "Madagascar": {
    name: "Madagascar",
    multiplier: 1.0,
    colorVibe: "Vibrant Fancy Pinks & Royal Blues",
    description: "Major modern source since the late 1990s. Incredible color range.",
    spectralFact: "Features dense micro-inclusion clusters with high iron-absorption profiles."
  },
  "Montana (USA)": {
    name: "Montana (USA)",
    multiplier: 1.15,
    colorVibe: "Metallic Teal & Pastel Silvers",
    description: "Yogo Gulch and Rock Creek. Natural untreated pastel shades with unique blue-green teals.",
    spectralFact: "Exhibits volcanic iron properties with microscopic negative crystals."
  }
}

export function calculateSapphireValuation(
  carat: number,
  color: SapphireColor,
  clarity: SapphireClarity,
  origin: SapphireOrigin,
  treated: boolean
): { min: number; max: number; basePricePerCarat: number } {
  const basePricePerCarat = 1200
  const colorMult = COLOR_DEFINITIONS[color]?.multiplier || 1.0
  const clarityMult = CLARITY_DESCRIPTIONS[clarity]?.multiplier || 1.0
  const originMult = ORIGIN_FACTS[origin]?.multiplier || 1.0
  const treatmentMult = treated ? 0.6 : 1.5

  let sizePremiumMultiplier = 1.0
  if (carat >= 1 && carat < 2) sizePremiumMultiplier = 1.1
  else if (carat >= 2 && carat < 3) sizePremiumMultiplier = 1.6
  else if (carat >= 3 && carat < 5) sizePremiumMultiplier = 2.4
  else if (carat >= 5 && carat < 7) sizePremiumMultiplier = 3.8
  else if (carat >= 7) sizePremiumMultiplier = 5.5

  const finalPricePerCarat = basePricePerCarat * colorMult * clarityMult * originMult * treatmentMult * sizePremiumMultiplier
  const totalPrice = finalPricePerCarat * carat
  const minVal = Math.round((totalPrice * 0.85) / 50) * 50
  const maxVal = Math.round((totalPrice * 1.15) / 50) * 50

  return {
    min: Math.max(100, minVal),
    max: Math.max(150, maxVal),
    basePricePerCarat: Math.round(finalPricePerCarat)
  }
}
