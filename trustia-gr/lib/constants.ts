// =============================================================
// constants.ts — All static data for Trustia.gr
// =============================================================
// This file contains every category, city, area, and text string
// used across the website. Keeping them here means:
// 1. One place to update when adding new categories or areas
// 2. Easy to find and modify any text
// 3. Components stay clean — they just import what they need
// =============================================================

// -------------------------------------------------------------
// BRAND — Colors and text used throughout the site
// These match our Tailwind config and business plan
// -------------------------------------------------------------
export const BRAND = {
  name: "TRUSTIA.GR",
  taglineEl: "Βρες τον ειδικό για κάθε ανάγκη",
  taglineEn: "Find the expert you need",
  missionEl: "Δίκαιη πρόσβαση. Δίκαιη τιμή. 100% στον επαγγελματία.",
  missionEn: "Fair access. Fair price. 100% to the professional.",
  email: "info@trustia.gr",
  location: "Θεσσαλονίκη, Ελλάδα",
} as const;

// -------------------------------------------------------------
// CATEGORY TIERS — Three pricing tiers
// Each tier has a monthly price (annual plan) and a list of
// categories that belong to it. Professionals see ONLY their
// tier's pricing — they never see the other tiers.
// -------------------------------------------------------------

/** Single category definition */
export interface Category {
  /** Unique identifier (URL-friendly, no spaces) */
  id: string;
  /** Display name in Greek */
  nameEl: string;
  /** Display name in English */
  nameEn: string;
  /** Lucide icon name (we'll use these later when we add Lucide) */
  icon: string;
  /** Emoji fallback for now */
  emoji: string;
  /** Which pricing tier this category belongs to */
  tier: "light" | "trades" | "specialists";
}

/** Pricing for each tier — what the professional pays */
export interface TierPricing {
  /** Display name in Greek */
  labelEl: string;
  /** Display name in English */
  labelEn: string;
  /** Monthly price on annual plan (cheapest) */
  annualMonthly: number;
  /** Monthly price on semi-annual plan */
  semiMonthly: number;
  /** Monthly price on monthly plan (most expensive) */
  monthly: number;
  /** Business pricing (2+ employees) — annual monthly */
  businessAnnual: number;
  /** Business semi-annual */
  businessSemi: number;
  /** Business monthly */
  businessMonthly: number;
}

// The three pricing tiers with all amounts from our business plan
export const TIERS: Record<string, TierPricing> = {
  light: {
    labelEl: "Καθαρισμός & Ελαφριές Υπηρεσίες",
    labelEn: "Cleaning & Light Services",
    annualMonthly: 10,
    semiMonthly: 15,
    monthly: 20,
    businessAnnual: 25,
    businessSemi: 35,
    businessMonthly: 45,
  },
  trades: {
    labelEl: "Τεχνικά & Υπηρεσίες Ομορφιάς",
    labelEn: "Trades & Beauty Services",
    annualMonthly: 15,
    semiMonthly: 20,
    monthly: 25,
    businessAnnual: 45,
    businessSemi: 60,
    businessMonthly: 75,
  },
  specialists: {
    labelEl: "Ειδικοί & Εργολάβοι",
    labelEn: "Specialists & Contractors",
    annualMonthly: 25,
    semiMonthly: 35,
    monthly: 45,
    businessAnnual: 75,
    businessSemi: 100,
    businessMonthly: 130,
  },
};

// -------------------------------------------------------------
// CATEGORIES — All 48 service categories
// Each category is assigned to a tier which determines its price
// The ID is used in URLs: trustia.gr/services/plumber
// The emoji is temporary — we'll replace with Lucide icons later
// -------------------------------------------------------------
export const CATEGORIES: Category[] = [
  // ── LIGHT SERVICES (6 categories) ──────────────────────────
  { id: "house-cleaning", nameEl: "Καθαρισμός Σπιτιού", nameEn: "House Cleaning", icon: "Sparkles", emoji: "🧹", tier: "light" },
  { id: "office-cleaning", nameEl: "Καθαρισμός Γραφείων", nameEn: "Office Cleaning", icon: "Building2", emoji: "🏢", tier: "light" },
  { id: "ironing", nameEl: "Σιδέρωμα", nameEn: "Ironing", icon: "Shirt", emoji: "👔", tier: "light" },
  { id: "gardening", nameEl: "Κηπουρική", nameEn: "Gardening", icon: "Flower2", emoji: "🌿", tier: "light" },
  { id: "pet-sitting", nameEl: "Φύλαξη Κατοικιδίων", nameEn: "Pet Sitting", icon: "Dog", emoji: "🐕", tier: "light" },
  { id: "small-moving", nameEl: "Μικρομεταφορές", nameEn: "Small Moving", icon: "Package", emoji: "📦", tier: "light" },

  // ── TRADES & BEAUTY (29 categories) ────────────────────────
  { id: "plumber", nameEl: "Υδραυλικός", nameEn: "Plumber", icon: "Wrench", emoji: "🔧", tier: "trades" },
  { id: "electrician", nameEl: "Ηλεκτρολόγος", nameEn: "Electrician", icon: "Zap", emoji: "⚡", tier: "trades" },
  { id: "painter", nameEl: "Ελαιοχρωματιστής", nameEn: "Painter", icon: "Paintbrush", emoji: "🎨", tier: "trades" },
  { id: "handyman", nameEl: "Γενικές Επισκευές", nameEn: "Handyman", icon: "Hammer", emoji: "🛠️", tier: "trades" },
  { id: "hvac", nameEl: "Ψυκτικός / Κλιματισμός", nameEn: "HVAC / AC", icon: "Snowflake", emoji: "❄️", tier: "trades" },
  { id: "locksmith", nameEl: "Κλειδαράς", nameEn: "Locksmith", icon: "KeyRound", emoji: "🔑", tier: "trades" },
  { id: "moving", nameEl: "Μετακομίσεις", nameEn: "Moving", icon: "Truck", emoji: "🚚", tier: "trades" },
  { id: "pest-control", nameEl: "Απεντομώσεις", nameEn: "Pest Control", icon: "Bug", emoji: "🐜", tier: "trades" },
  { id: "furniture-assembly", nameEl: "Συναρμολόγηση Επίπλων", nameEn: "Furniture Assembly", icon: "Armchair", emoji: "🪑", tier: "trades" },
  { id: "appliance-repair", nameEl: "Επισκευή Συσκευών", nameEn: "Appliance Repair", icon: "Plug", emoji: "🔌", tier: "trades" },
  { id: "windows-frames", nameEl: "Κουφώματα / Αλουμίνια", nameEn: "Windows / Frames", icon: "SquareStack", emoji: "🪟", tier: "trades" },
  { id: "awnings", nameEl: "Τέντες / Πέργκολες", nameEn: "Awnings / Pergolas", icon: "Umbrella", emoji: "⛱️", tier: "trades" },
  { id: "security-doors", nameEl: "Πόρτες Ασφαλείας", nameEn: "Security Doors", icon: "DoorOpen", emoji: "🚪", tier: "trades" },
  { id: "drainage", nameEl: "Αποχέτευση / Αποφράξεις", nameEn: "Drainage", icon: "Droplets", emoji: "🚰", tier: "trades" },
  { id: "drywall", nameEl: "Γυψοσανίδες", nameEn: "Drywall", icon: "LayoutGrid", emoji: "📐", tier: "trades" },
  { id: "flooring", nameEl: "Πατώματα / Δάπεδα", nameEn: "Flooring", icon: "Layers", emoji: "🪵", tier: "trades" },
  { id: "tiles-marble", nameEl: "Πλακάκια / Μάρμαρα", nameEn: "Tiles / Marble", icon: "Grid3x3", emoji: "🧱", tier: "trades" },
  { id: "plastering", nameEl: "Σοβατίσματα", nameEn: "Plastering", icon: "HardHat", emoji: "🏗️", tier: "trades" },
  { id: "carpentry", nameEl: "Ξυλουργικές", nameEn: "Carpentry", icon: "Axe", emoji: "🪚", tier: "trades" },
  { id: "railings", nameEl: "Κάγκελα / Μεταλλουργεία", nameEn: "Railings / Metalwork", icon: "Fence", emoji: "⚙️", tier: "trades" },
  { id: "heating", nameEl: "Θέρμανση / Φυσικό Αέριο", nameEn: "Heating / Natural Gas", icon: "Flame", emoji: "🔥", tier: "trades" },
  { id: "wallpaper", nameEl: "Ταπετσαρίες", nameEn: "Wallpaper", icon: "Image", emoji: "🖼️", tier: "trades" },
  { id: "glass-glazing", nameEl: "Τζάμια / Υαλοπίνακες", nameEn: "Glass / Glazing", icon: "GlassWater", emoji: "🪞", tier: "trades" },
  { id: "alarms-cctv", nameEl: "Συναγερμοί / Κάμερες", nameEn: "Alarms / CCTV", icon: "Camera", emoji: "📹", tier: "trades" },
  { id: "shutters", nameEl: "Ρολά", nameEn: "Shutters", icon: "PanelTopClose", emoji: "🪟", tier: "trades" },
  // Beauty services (still in trades tier pricing)
  { id: "nail-tech", nameEl: "Τεχνίτρια Νυχιών", nameEn: "Nail Technician", icon: "Hand", emoji: "💅", tier: "trades" },
  { id: "makeup-artist", nameEl: "Μακιγιέρ", nameEn: "Makeup Artist", icon: "Palette", emoji: "💄", tier: "trades" },
  { id: "hairdresser", nameEl: "Κομμωτής κατ' οίκον", nameEn: "Hairdresser (Home Visit)", icon: "Scissors", emoji: "✂️", tier: "trades" },
  { id: "lash-brow", nameEl: "Βλεφαρίδες / Φρύδια", nameEn: "Lash / Brow Specialist", icon: "Eye", emoji: "👁️", tier: "trades" },

  // ── SPECIALISTS (13 categories) ────────────────────────────
  { id: "renovation", nameEl: "Ανακαίνιση", nameEn: "Renovation", icon: "Home", emoji: "🏠", tier: "specialists" },
  { id: "architect", nameEl: "Αρχιτέκτονας", nameEn: "Architect", icon: "Ruler", emoji: "📐", tier: "specialists" },
  { id: "civil-engineer", nameEl: "Πολιτικός Μηχανικός", nameEn: "Civil Engineer", icon: "HardHat", emoji: "🏗️", tier: "specialists" },
  { id: "interior-designer", nameEl: "Διακοσμητής", nameEn: "Interior Designer", icon: "Palette", emoji: "🎨", tier: "specialists" },
  { id: "solar-panels", nameEl: "Φωτοβολταϊκά", nameEn: "Solar Panels", icon: "Sun", emoji: "☀️", tier: "specialists" },
  { id: "smart-home", nameEl: "Smart Home", nameEn: "Smart Home", icon: "Smartphone", emoji: "📱", tier: "specialists" },
  { id: "kitchen-bath", nameEl: "Κουζίνα / Μπάνιο", nameEn: "Kitchen / Bath Design", icon: "UtensilsCrossed", emoji: "🍳", tier: "specialists" },
  { id: "insulation", nameEl: "Μονώσεις", nameEn: "Insulation", icon: "Thermometer", emoji: "🧊", tier: "specialists" },
  { id: "structural", nameEl: "Δομικές Εργασίες", nameEn: "Structural Work", icon: "Building", emoji: "🧱", tier: "specialists" },
  { id: "fireplaces", nameEl: "Τζάκια", nameEn: "Fireplaces", icon: "Flame", emoji: "🔥", tier: "specialists" },
  { id: "elevators", nameEl: "Ανελκυστήρες", nameEn: "Elevators", icon: "ArrowUpDown", emoji: "🛗", tier: "specialists" },
  { id: "pools", nameEl: "Πισίνες", nameEn: "Swimming Pools", icon: "Waves", emoji: "🏊", tier: "specialists" },
  { id: "fencing", nameEl: "Περιφράξεις", nameEn: "Fencing", icon: "Fence", emoji: "🔒", tier: "specialists" },
  { id: "excavation", nameEl: "Εκσκαφές", nameEn: "Excavation", icon: "Shovel", emoji: "⛏️", tier: "specialists" },
];

// -------------------------------------------------------------
// POPULAR CATEGORIES — Shown on the homepage grid
// These are the 12 most commonly searched categories
// We reference them by ID from the full CATEGORIES list above
// -------------------------------------------------------------
export const POPULAR_CATEGORY_IDS = [
  "plumber",
  "electrician",
  "house-cleaning",
  "painter",
  "hvac",
  "nail-tech",
  "handyman",
  "moving",
  "renovation",
  "locksmith",
  "pest-control",
  "solar-panels",
];

// -------------------------------------------------------------
// REGIONS & AREAS — Geolocation hierarchy for Greece
// Level 1: Region (Περιφέρεια)
// Level 2: Municipality (Δήμος)  
// Level 3: Area (Περιοχή)
//
// We start with Thessaloniki and Athens metro areas
// More areas are added through the admin panel as needed
// -------------------------------------------------------------
export interface Area {
  id: string;
  name: string;
  municipalityId: string;
}

export interface Municipality {
  id: string;
  name: string;
  regionId: string;
  areas: Area[];
}

export interface Region {
  id: string;
  name: string;
  municipalities: Municipality[];
}

export const REGIONS: Region[] = [
  {
    id: "thessaloniki",
    name: "Θεσσαλονίκη",
    municipalities: [
      {
        id: "thessaloniki-center",
        name: "Δήμος Θεσσαλονίκης",
        regionId: "thessaloniki",
        areas: [
          { id: "kentro", name: "Κέντρο", municipalityId: "thessaloniki-center" },
          { id: "ano-poli", name: "Άνω Πόλη", municipalityId: "thessaloniki-center" },
          { id: "charilaou", name: "Χαριλάου", municipalityId: "thessaloniki-center" },
          { id: "toumpa", name: "Τούμπα", municipalityId: "thessaloniki-center" },
          { id: "depo", name: "Ντεπώ", municipalityId: "thessaloniki-center" },
        ],
      },
      {
        id: "kalamaria",
        name: "Δήμος Καλαμαριάς",
        regionId: "thessaloniki",
        areas: [
          { id: "kalamaria", name: "Καλαμαριά", municipalityId: "kalamaria" },
        ],
      },
      {
        id: "pylaia-chortiatis",
        name: "Δήμος Πυλαίας-Χορτιάτη",
        regionId: "thessaloniki",
        areas: [
          { id: "pylaia", name: "Πυλαία", municipalityId: "pylaia-chortiatis" },
          { id: "chortiatis", name: "Χορτιάτης", municipalityId: "pylaia-chortiatis" },
          { id: "panorama", name: "Πανόραμα", municipalityId: "pylaia-chortiatis" },
        ],
      },
      {
        id: "thermis",
        name: "Δήμος Θέρμης",
        regionId: "thessaloniki",
        areas: [
          { id: "thermi", name: "Θέρμη", municipalityId: "thermis" },
          { id: "kato-scholari", name: "Κάτω Σχολάρι", municipalityId: "thermis" },
          { id: "trilofo", name: "Τρίλοφος", municipalityId: "thermis" },
          { id: "mikra", name: "Μίκρα", municipalityId: "thermis" },
          { id: "vasilika", name: "Βασιλικά", municipalityId: "thermis" },
        ],
      },
      {
        id: "neapoli-sykies",
        name: "Δήμος Νεάπολης-Συκεών",
        regionId: "thessaloniki",
        areas: [
          { id: "neapoli", name: "Νεάπολη", municipalityId: "neapoli-sykies" },
          { id: "sykies", name: "Συκιές", municipalityId: "neapoli-sykies" },
          { id: "pefka", name: "Πεύκα", municipalityId: "neapoli-sykies" },
        ],
      },
      {
        id: "pavlou-mela",
        name: "Δήμος Παύλου Μελά",
        regionId: "thessaloniki",
        areas: [
          { id: "stavroupoli", name: "Σταυρούπολη", municipalityId: "pavlou-mela" },
          { id: "polixni", name: "Πολίχνη", municipalityId: "pavlou-mela" },
          { id: "efkarpia", name: "Ευκαρπία", municipalityId: "pavlou-mela" },
        ],
      },
      {
        id: "ampelokipoi-menemeni",
        name: "Δήμος Αμπελοκήπων-Μενεμένης",
        regionId: "thessaloniki",
        areas: [
          { id: "ampelokipoi", name: "Αμπελόκηποι", municipalityId: "ampelokipoi-menemeni" },
          { id: "menemeni", name: "Μενεμένη", municipalityId: "ampelokipoi-menemeni" },
        ],
      },
      {
        id: "evosmos-kordelio",
        name: "Δήμος Ευόσμου-Κορδελιού",
        regionId: "thessaloniki",
        areas: [
          { id: "evosmos", name: "Εύοσμος", municipalityId: "evosmos-kordelio" },
          { id: "kordelio", name: "Κορδελιό", municipalityId: "evosmos-kordelio" },
        ],
      },
      {
        id: "delta",
        name: "Δήμος Δέλτα",
        regionId: "thessaloniki",
        areas: [
          { id: "sindos", name: "Σίνδος", municipalityId: "delta" },
          { id: "kalochori", name: "Καλοχώρι", municipalityId: "delta" },
        ],
      },
      {
        id: "thermaikos",
        name: "Δήμος Θερμαϊκού",
        regionId: "thessaloniki",
        areas: [
          { id: "peraia", name: "Περαία", municipalityId: "thermaikos" },
          { id: "nei-epivates", name: "Νέοι Επιβάτες", municipalityId: "thermaikos" },
          { id: "agia-triada", name: "Αγία Τριάδα", municipalityId: "thermaikos" },
        ],
      },
    ],
  },
  {
    id: "attiki",
    name: "Αττική",
    municipalities: [
      {
        id: "athens-center",
        name: "Δήμος Αθηναίων",
        regionId: "attiki",
        areas: [
          { id: "athens-kentro", name: "Κέντρο Αθήνας", municipalityId: "athens-center" },
          { id: "kolonaki", name: "Κολωνάκι", municipalityId: "athens-center" },
          { id: "exarchia", name: "Εξάρχεια", municipalityId: "athens-center" },
          { id: "pagkrati", name: "Παγκράτι", municipalityId: "athens-center" },
          { id: "koukaki", name: "Κουκάκι", municipalityId: "athens-center" },
        ],
      },
      {
        id: "glyfada",
        name: "Δήμος Γλυφάδας",
        regionId: "attiki",
        areas: [
          { id: "glyfada", name: "Γλυφάδα", municipalityId: "glyfada" },
        ],
      },
      {
        id: "marousi",
        name: "Δήμος Αμαρουσίου",
        regionId: "attiki",
        areas: [
          { id: "marousi", name: "Μαρούσι", municipalityId: "marousi" },
        ],
      },
      {
        id: "kifisia",
        name: "Δήμος Κηφισιάς",
        regionId: "attiki",
        areas: [
          { id: "kifisia", name: "Κηφισιά", municipalityId: "kifisia" },
        ],
      },
      {
        id: "piraeus",
        name: "Δήμος Πειραιά",
        regionId: "attiki",
        areas: [
          { id: "piraeus", name: "Πειραιάς", municipalityId: "piraeus" },
        ],
      },
      {
        id: "peristeri",
        name: "Δήμος Περιστερίου",
        regionId: "attiki",
        areas: [
          { id: "peristeri", name: "Περιστέρι", municipalityId: "peristeri" },
        ],
      },
    ],
  },
  {
    id: "patra",
    name: "Πάτρα",
    municipalities: [
      {
        id: "patra-center",
        name: "Δήμος Πατρέων",
        regionId: "patra",
        areas: [
          { id: "patra-kentro", name: "Κέντρο Πάτρας", municipalityId: "patra-center" },
        ],
      },
    ],
  },
  {
    id: "irakleio",
    name: "Ηράκλειο",
    municipalities: [
      {
        id: "irakleio-center",
        name: "Δήμος Ηρακλείου",
        regionId: "irakleio",
        areas: [
          { id: "irakleio-kentro", name: "Κέντρο Ηρακλείου", municipalityId: "irakleio-center" },
        ],
      },
    ],
  },
  {
    id: "larisa",
    name: "Λάρισα",
    municipalities: [
      {
        id: "larisa-center",
        name: "Δήμος Λαρισαίων",
        regionId: "larisa",
        areas: [
          { id: "larisa-kentro", name: "Κέντρο Λάρισας", municipalityId: "larisa-center" },
        ],
      },
    ],
  },
  {
    id: "volos",
    name: "Βόλος",
    municipalities: [
      {
        id: "volos-center",
        name: "Δήμος Βόλου",
        regionId: "volos",
        areas: [
          { id: "volos-kentro", name: "Κέντρο Βόλου", municipalityId: "volos-center" },
        ],
      },
    ],
  },
];

// -------------------------------------------------------------
// HELPER — Flatten all areas into a single searchable list
// Used by the autocomplete search on the homepage
// Each area includes its full path: "Κάτω Σχολάρι, Θέρμη, Θεσσαλονίκη"
// -------------------------------------------------------------
export function getAllAreas(): { id: string; name: string; fullPath: string; regionId: string }[] {
  const areas: { id: string; name: string; fullPath: string; regionId: string }[] = [];

  // Loop through every region → municipality → area
  // and build a flat list with the full location path
  for (const region of REGIONS) {
    for (const municipality of region.municipalities) {
      for (const area of municipality.areas) {
        areas.push({
          id: area.id,
          name: area.name,
          // Full path shown in autocomplete: "Κάτω Σχολάρι, Θέρμη, Θεσσαλονίκη"
          fullPath: `${area.name}, ${municipality.name.replace("Δήμος ", "")}, ${region.name}`,
          regionId: region.id,
        });
      }
    }
  }

  return areas;
}

// -------------------------------------------------------------
// HELPER — Get all categories for a specific tier
// Used on the pricing page: professional clicks their category,
// we look up the tier and show only that tier's prices
// -------------------------------------------------------------
export function getCategoriesByTier(tier: "light" | "trades" | "specialists"): Category[] {
  return CATEGORIES.filter((cat) => cat.tier === tier);
}

// -------------------------------------------------------------
// HELPER — Find a category by its URL-friendly ID
// Used when navigating to trustia.gr/services/plumber
// Returns the full category object with name, tier, etc.
// -------------------------------------------------------------
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}
// -------------------------------------------------------------
// DEMO PROFESSIONALS — Fake data for development
// These will be replaced by real Supabase data later.
// Each professional has all the fields our database will store.
// We use these to build and test the UI before the DB exists.
// -------------------------------------------------------------
export interface Professional {
  /** Unique ID (will come from Supabase later) */
  id: string;
  /** Full name */
  name: string;
  /** Primary service category ID (matches CATEGORIES) */
  categoryId: string;
  /** Which pricing tier (determined by category) */
  tier: "light" | "trades" | "specialists";
  /** City name */
  city: string;
  /** Base area where they're located */
  baseArea: string;
  /** All area IDs they serve */
  serviceAreaIds: string[];
  /** Average star rating (1-5) */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
  /** Total completed jobs */
  jobCount: number;
  /** Price display text (varies by profession) */
  priceText: string;
  /** Whether they have online booking enabled */
  bookingEnabled: boolean;
  /** Whether they're a Προβολή Plus subscriber */
  featured: boolean;
  /** Their rank in their category for their city */
  rank: number;
  /** Short bio / description */
  bio: string;
  /** Year they joined Trustia.gr */
  memberSince: string;
  /** Emoji avatar (will be replaced by real photos) */
  avatar: string;
  /** Phone number (masked for demo) */
  phone: string;
}

export const DEMO_PROFESSIONALS: Professional[] = [
  {
    id: "pro-1",
    name: "Νίκος Παπαδόπουλος",
    categoryId: "plumber",
    tier: "trades",
    city: "Θεσσαλονίκη",
    baseArea: "Θέρμη",
    serviceAreaIds: ["thermi", "kato-scholari", "pylaia", "panorama", "kalamaria", "kentro"],
    rating: 4.9,
    reviewCount: 47,
    jobCount: 89,
    priceText: "€25-45/ώρα",
    bookingEnabled: true,
    featured: true,
    rank: 1,
    bio: "Υδραυλικός με 15 χρόνια εμπειρία στη Θεσσαλονίκη. Εξειδίκευση σε αποφράξεις, εγκαταστάσεις θερμοσίφωνων, και επισκευές. Άμεση ανταπόκριση, εγγύηση εργασίας.",
    memberSince: "2026",
    avatar: "👨‍🔧",
    phone: "69X XXX XX01",
  },
  {
    id: "pro-2",
    name: "Μαρία Κωνσταντίνου",
    categoryId: "house-cleaning",
    tier: "light",
    city: "Θεσσαλονίκη",
    baseArea: "Καλαμαριά",
    serviceAreaIds: ["kalamaria", "kentro", "toumpa", "charilaou", "pylaia"],
    rating: 4.8,
    reviewCount: 32,
    jobCount: 156,
    priceText: "€12/ώρα",
    bookingEnabled: true,
    featured: false,
    rank: 1,
    bio: "Επαγγελματικός καθαρισμός σπιτιών και διαμερισμάτων. Σχολαστική, τυπική, αξιόπιστη. Φέρνω δικά μου προϊόντα καθαρισμού.",
    memberSince: "2026",
    avatar: "👩‍🔧",
    phone: "69X XXX XX02",
  },
  {
    id: "pro-3",
    name: "Γιώργος Αλεξίου",
    categoryId: "electrician",
    tier: "trades",
    city: "Θεσσαλονίκη",
    baseArea: "Πυλαία",
    serviceAreaIds: ["pylaia", "thermi", "kalamaria", "kentro", "panorama", "toumpa"],
    rating: 4.7,
    reviewCount: 28,
    jobCount: 67,
    priceText: "€30-50/ώρα",
    bookingEnabled: false,
    featured: false,
    rank: 2,
    bio: "Αδειούχος ηλεκτρολόγος Α' κατηγορίας. Οικιακές και επαγγελματικές εγκαταστάσεις, βλάβες, πίνακες, φωτισμός LED.",
    memberSince: "2026",
    avatar: "⚡",
    phone: "69X XXX XX03",
  },
  {
    id: "pro-4",
    name: "Ελένη Δημητρίου",
    categoryId: "nail-tech",
    tier: "trades",
    city: "Θεσσαλονίκη",
    baseArea: "Κέντρο",
    serviceAreaIds: ["kentro", "kalamaria", "toumpa", "charilaou", "pylaia", "thermi"],
    rating: 5.0,
    reviewCount: 19,
    jobCount: 45,
    priceText: "€20-40/συνεδρία",
    bookingEnabled: true,
    featured: false,
    rank: 1,
    bio: "Ημιμόνιμο μανικιούρ, τεχνητά νύχια, nail art, pedicure. Κατ' οίκον εξυπηρέτηση σε όλη τη Θεσσαλονίκη. Αποστειρωμένα εργαλεία.",
    memberSince: "2026",
    avatar: "💅",
    phone: "69X XXX XX04",
  },
  {
    id: "pro-5",
    name: "Δημήτρης Βασιλείου",
    categoryId: "renovation",
    tier: "specialists",
    city: "Θεσσαλονίκη",
    baseArea: "Εύοσμος",
    serviceAreaIds: ["evosmos", "kordelio", "ampelokipoi", "menemeni", "stavroupoli", "kentro", "kalamaria"],
    rating: 4.6,
    reviewCount: 15,
    jobCount: 23,
    priceText: "Κατόπιν εκτίμησης",
    bookingEnabled: true,
    featured: true,
    rank: 1,
    bio: "Ολικές και μερικές ανακαινίσεις σπιτιών και επαγγελματικών χώρων. 20 χρόνια εμπειρία. Δωρεάν εκτίμηση κόστους.",
    memberSince: "2026",
    avatar: "🏠",
    phone: "69X XXX XX05",
  },
  {
    id: "pro-6",
    name: "Αναστασία Παπούλη",
    categoryId: "house-cleaning",
    tier: "light",
    city: "Θεσσαλονίκη",
    baseArea: "Σταυρούπολη",
    serviceAreaIds: ["stavroupoli", "polixni", "efkarpia", "evosmos", "neapoli", "sykies"],
    rating: 4.5,
    reviewCount: 12,
    jobCount: 78,
    priceText: "€10/ώρα",
    bookingEnabled: false,
    featured: false,
    rank: 2,
    bio: "Καθαρισμός σπιτιών, διαμερισμάτων και Airbnb. Αναλαμβάνω γενικούς καθαρισμούς και τακτική συντήρηση.",
    memberSince: "2026",
    avatar: "🧹",
    phone: "69X XXX XX06",
  },
  {
    id: "pro-7",
    name: "Κώστας Ιωαννίδης",
    categoryId: "painter",
    tier: "trades",
    city: "Θεσσαλονίκη",
    baseArea: "Τούμπα",
    serviceAreaIds: ["toumpa", "charilaou", "kentro", "kalamaria", "pylaia", "thermi"],
    rating: 4.8,
    reviewCount: 22,
    jobCount: 54,
    priceText: "€8-12/τ.μ.",
    bookingEnabled: true,
    featured: false,
    rank: 1,
    bio: "Βαφές εσωτερικών και εξωτερικών χώρων. Τεχνοτροπίες, μονώσεις ταρατσών, σοβατίσματα. Καθαρή δουλειά, σωστές τιμές.",
    memberSince: "2026",
    avatar: "🎨",
    phone: "69X XXX XX07",
  },
  {
    id: "pro-8",
    name: "Σοφία Καραγιάννη",
    categoryId: "makeup-artist",
    tier: "trades",
    city: "Θεσσαλονίκη",
    baseArea: "Πανόραμα",
    serviceAreaIds: ["panorama", "pylaia", "thermi", "kalamaria", "kentro"],
    rating: 4.9,
    reviewCount: 31,
    jobCount: 42,
    priceText: "€50-120/συνεδρία",
    bookingEnabled: true,
    featured: false,
    rank: 1,
    bio: "Επαγγελματικό μακιγιάζ για γάμους, βαφτίσεις, φωτογραφήσεις και events. Κατ' οίκον εξυπηρέτηση.",
    memberSince: "2026",
    avatar: "💄",
    phone: "69X XXX XX08",
  },
];

// -------------------------------------------------------------
// DEMO REVIEWS — Fake review data for development
// Reviews are linked to professionals by professionalId
// Two types exist as per our business plan:
// - "verified" = from a confirmed booking through the platform
// - "founding" = from existing customers during onboarding
// -------------------------------------------------------------
export interface Review {
  id: string;
  professionalId: string;
  customerName: string;
  customerArea: string;
  rating: number;
  text: string;
  date: string;
  type: "verified" | "founding";
  /** Optional photo URLs (1-3 per review) */
  photos?: string[];
}

export const DEMO_REVIEWS: Review[] = [
  {
    id: "rev-1",
    professionalId: "pro-1",
    customerName: "Σοφία Μ.",
    customerArea: "Θέρμη",
    rating: 5,
    text: "Εξαιρετικός επαγγελματίας! Ήρθε στην ώρα του, έκανε τη δουλειά άψογα και καθάρισε μετά. Τον συστήνω ανεπιφύλακτα.",
    date: "02/04/2026",
    type: "verified",
  },
  {
    id: "rev-2",
    professionalId: "pro-1",
    customerName: "Κώστας Π.",
    customerArea: "Καλαμαριά",
    rating: 5,
    text: "Πολύ τυπικός και σχολαστικός. Έλυσε το πρόβλημα αμέσως. Η τιμή ήταν ακριβώς αυτή που είπε στο τηλέφωνο.",
    date: "28/03/2026",
    type: "verified",
  },
  {
    id: "rev-3",
    professionalId: "pro-1",
    customerName: "Ελένη Κ.",
    customerArea: "Πυλαία",
    rating: 4,
    text: "Καλή δουλειά, λίγο αργοπορημένος αλλά ενημέρωσε τηλεφωνικά. Το αποτέλεσμα ήταν πολύ καλό.",
    date: "15/03/2026",
    type: "founding",
  },
  {
    id: "rev-4",
    professionalId: "pro-2",
    customerName: "Γιάννης Δ.",
    customerArea: "Καλαμαριά",
    rating: 5,
    text: "Το σπίτι ήταν αστραφτερό! Πολύ προσεκτική στις λεπτομέρειες. Θα την καλέσω ξανά σίγουρα.",
    date: "05/04/2026",
    type: "verified",
  },
  {
    id: "rev-5",
    professionalId: "pro-2",
    customerName: "Μαρίνα Α.",
    customerArea: "Κέντρο",
    rating: 5,
    text: "Εργατική, ειλικρινής, και πολύ φιλική. Καθαρίζει πολύ καλύτερα από την προηγούμενη καθαρίστριά μου.",
    date: "01/04/2026",
    type: "founding",
  },
  {
    id: "rev-6",
    professionalId: "pro-4",
    customerName: "Δήμητρα Σ.",
    customerArea: "Κέντρο",
    rating: 5,
    text: "Τέλειο αποτέλεσμα! Ημιμόνιμο που κράτησε 3 εβδομάδες. Πολύ ευγενική και καθαρή.",
    date: "08/04/2026",
    type: "verified",
  },
  {
    id: "rev-7",
    professionalId: "pro-7",
    customerName: "Αλέξανδρος Γ.",
    customerArea: "Τούμπα",
    rating: 5,
    text: "Έβαψε ολόκληρο το διαμέρισμα σε 2 μέρες. Τέλεια δουλειά, πολύ καθαρός, σωστή τιμή.",
    date: "10/04/2026",
    type: "verified",
  },
  {
    id: "rev-8",
    professionalId: "pro-3",
    customerName: "Βασίλης Ν.",
    customerArea: "Θέρμη",
    rating: 4,
    text: "Αντικατέστησε τον πίνακα και έβαλε νέες πρίζες. Γνωρίζει τη δουλειά του. Μόνο που ήθελε μετρητά.",
    date: "20/03/2026",
    type: "founding",
  },
];