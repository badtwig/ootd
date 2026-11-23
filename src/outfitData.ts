export type ClothingCategory = 'shirt' | 'upper' | 'trouser';

export interface WardrobeItemRecord {
  id: string;
  category: ClothingCategory;
  name: string;
  createdAtMs: number;
}

export interface OutfitCombo {
  shirt: string;
  trouser: string;
}

export interface ColdOutfitCombo extends OutfitCombo {
  upper: string;
}

// Synchronized with firebase-blueprint.json & firestore.rules
export const WARDROBE_ITEM_NAME_MAX_LENGTH = 80;
export const WARDROBE_ITEM_NAME_REGEX = /^[a-zA-Z0-9 '\-/&().]+$/;

export const DEFAULT_SHIRTS: string[] = [
  'black short sleeve polo',
  'blue short sleeve polo',
  'khaki polo',
  'khaki full sleeve polo',
  'dark blue army green short sleeve polo',
  'maroon short sleeve',
  'black short sleeve',
  'white short sleeve',
  'yellow short sleeve',
  'army green short sleeve',
  'grey short sleeve',
  'parrot green short sleeve',
  'light green short sleeve',
  'blue full sleeve',
  'army green long sleeve',
  'black long sleeve',
  'grey long sleeve',
  'white full sleeve',
];

export const DEFAULT_TROUSERS: string[] = [
  'khaki trouser',
  'navy blue trouser',
  'red trouser',
  'red corduroy trouser',
];

export const DEFAULT_UPPERS: string[] = [
  'black hoodie',
  'grey zip hoodie',
  'navy crewneck sweater',
  'charcoal quarter-zip sweater',
  'cream knit sweater',
  'burgundy knit sweater',
  'olive bomber jacket',
  'khaki fleece jacket',
  'navy puffer jacket',
  'black jacket',
];

export function createStarterWardrobeItems(): WardrobeItemRecord[] {
  const now = Date.now();
  const items: WardrobeItemRecord[] = [];
  let offset = 0;

  for (const name of DEFAULT_SHIRTS) {
    items.push({ id: `default-shirt-${offset}`, category: 'shirt', name, createdAtMs: now + offset });
    offset += 1;
  }
  for (const name of DEFAULT_UPPERS) {
    items.push({ id: `default-upper-${offset}`, category: 'upper', name, createdAtMs: now + offset });
    offset += 1;
  }
  for (const name of DEFAULT_TROUSERS) {
    items.push({ id: `default-trouser-${offset}`, category: 'trouser', name, createdAtMs: now + offset });
    offset += 1;
  }

  return items;
}

function isNeutral(color: string): boolean {
  return ['black', 'white', 'grey', 'gray', 'charcoal', 'navy', 'khaki', 'cream', 'beige', 'tan'].includes(
    color
  );
}

function extractColor(item: string): string {
  return item.trim().toLowerCase().split(/\s+/)[0] ?? '';
}

export function fashionableCombo(shirt: string, trouser: string): boolean {
  const shirtColor = extractColor(shirt);
  const trouserColor = extractColor(trouser);

  if (['black', 'white', 'grey', 'gray', 'charcoal', 'navy', 'khaki', 'cream', 'beige', 'tan'].includes(shirtColor)) {
    return true;
  }

  if (trouserColor === 'red') {
    if (['yellow', 'maroon', 'parrot', 'light', 'army'].includes(shirtColor)) {
      return false;
    }
  }

  if (['maroon', 'army', 'khaki'].includes(shirtColor)) {
    return ['khaki', 'navy'].includes(trouserColor);
  }

  if (trouserColor === 'red' && trouser.toLowerCase().includes('corduroy')) {
    if (!['black', 'white', 'grey', 'gray', 'navy', 'dark'].includes(shirtColor)) {
      return false;
    }
  }

  return true;
}

export function fashionableColdCombo(upper: string, shirt: string, trouser: string): boolean {
  if (!fashionableCombo(shirt, trouser)) {
    return false;
  }

  const upperColor = extractColor(upper);
  const shirtColor = extractColor(shirt);
  const trouserColor = extractColor(trouser);

  if (upperColor === 'burgundy' && ['maroon', 'yellow', 'parrot', 'light', 'army'].includes(shirtColor)) {
    return false;
  }
  if (upperColor === 'olive' && ['army', 'parrot', 'light', 'maroon'].includes(shirtColor)) {
    return false;
  }
  if (upperColor === 'khaki' && shirtColor === 'khaki') {
    return false;
  }

  if (trouserColor === 'red') {
    if (['burgundy', 'olive'].includes(upperColor)) {
      return false;
    }
    if (trouser.toLowerCase().includes('corduroy') && !isNeutral(upperColor)) {
      return false;
    }
  }

  if (['burgundy', 'olive'].includes(upperColor)) {
    return ['khaki', 'navy'].includes(trouserColor);
  }

  return true;
}

export function buildStylishCombos(shirts: string[], trousers: string[]): OutfitCombo[] {
  return shirts.flatMap((shirt) =>
    trousers
      .filter((trouser) => fashionableCombo(shirt, trouser))
      .map((trouser) => ({ shirt, trouser }))
  );
}

export function buildColdStylishCombos(
  uppers: string[],
  shirts: string[],
  trousers: string[]
): ColdOutfitCombo[] {
  const baseCombos = buildStylishCombos(shirts, trousers);
  return uppers.flatMap((upper) =>
    baseCombos
      .filter((combo) => fashionableColdCombo(upper, combo.shirt, combo.trouser))
      .map((combo) => ({ ...combo, upper }))
  );
}

export interface GarmentVisual {
  primaryColor: string;
  secondaryColor?: string;
  isLight: boolean;
  isPolo: boolean;
  isLongSleeve: boolean;
  isCorduroy: boolean;
  upperStyle: 'hoodie' | 'sweater' | 'jacket';
  hasZip: boolean;
}

const COLOR_MAP: Array<{ match: string; hex: string; isLight: boolean }> = [
  { match: 'black', hex: '#18181B', isLight: false },
  { match: 'charcoal', hex: '#374151', isLight: false },
  { match: 'white', hex: '#FFFFFF', isLight: true },
  { match: 'cream', hex: '#F3EFE6', isLight: true },
  { match: 'ivory', hex: '#FAF6EB', isLight: true },
  { match: 'beige', hex: '#D6C7AE', isLight: true },
  { match: 'tan', hex: '#C8AD8D', isLight: true },
  { match: 'khaki', hex: '#C5B08B', isLight: true },
  { match: 'grey', hex: '#6B7280', isLight: false },
  { match: 'gray', hex: '#6B7280', isLight: false },
  { match: 'navy', hex: '#1E293B', isLight: false },
  { match: 'denim', hex: '#3B5998', isLight: false },
  { match: 'indigo', hex: '#3730A3', isLight: false },
  { match: 'light blue', hex: '#93C5FD', isLight: true },
  { match: 'sky', hex: '#7DD3FC', isLight: true },
  { match: 'blue', hex: '#2563EB', isLight: false },
  { match: 'maroon', hex: '#7F1D1D', isLight: false },
  { match: 'burgundy', hex: '#7F1D1D', isLight: false },
  { match: 'red', hex: '#B91C1C', isLight: false },
  { match: 'yellow', hex: '#EAB308', isLight: true },
  { match: 'orange', hex: '#EA580C', isLight: false },
  { match: 'rust', hex: '#9A3412', isLight: false },
  { match: 'brown', hex: '#6B4423', isLight: false },
  { match: 'army green', hex: '#4B5320', isLight: false },
  { match: 'olive', hex: '#4B5320', isLight: false },
  { match: 'sage', hex: '#84A98C', isLight: true },
  { match: 'parrot green', hex: '#4ADE80', isLight: true },
  { match: 'light green', hex: '#86EFAC', isLight: true },
  { match: 'green', hex: '#15803D', isLight: false },
  { match: 'teal', hex: '#0F766E', isLight: false },
  { match: 'purple', hex: '#6D28D9', isLight: false },
  { match: 'pink', hex: '#F472B6', isLight: true },
];

export function getGarmentVisual(item: string): GarmentVisual {
  const lower = item.toLowerCase();
  const isPolo = lower.includes('polo');
  const isLongSleeve =
    lower.includes('full sleeve') ||
    lower.includes('long sleeve') ||
    lower.includes('sweatshirt') ||
    lower.includes('pullover');
  const isCorduroy = lower.includes('corduroy');
  const hasZip = lower.includes('zip') || lower.includes('jacket') || lower.includes('coat');

  let upperStyle: 'hoodie' | 'sweater' | 'jacket' = 'jacket';
  if (lower.includes('hoodie')) {
    upperStyle = 'hoodie';
  } else if (
    lower.includes('sweater') ||
    lower.includes('cardigan') ||
    lower.includes('pullover') ||
    lower.includes('sweatshirt') ||
    lower.includes('knit')
  ) {
    upperStyle = 'sweater';
  }

  const base = {
    isPolo,
    isLongSleeve,
    isCorduroy,
    upperStyle,
    hasZip,
  };

  if (lower.startsWith('dark blue army green')) {
    return {
      ...base,
      primaryColor: '#1E3A5F',
      secondaryColor: '#4B5320',
      isLight: false,
    };
  }

  if (lower.startsWith('red') && isCorduroy) {
    return {
      ...base,
      primaryColor: '#991B1B',
      isLight: false,
    };
  }

  for (const entry of COLOR_MAP) {
    if (lower.includes(entry.match)) {
      return {
        ...base,
        primaryColor: entry.hex,
        isLight: entry.isLight,
      };
    }
  }

  return { ...base, primaryColor: '#9CA3AF', isLight: false };
}

export function formatGarmentName(item: string): string {
  return item
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function validateWardrobeItemName(raw: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = raw.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { valid: false, normalized: '', error: 'Please enter an item name.' };
  }
  if (normalized.length > WARDROBE_ITEM_NAME_MAX_LENGTH) {
    return {
      valid: false,
      normalized,
      error: `Name must be ${WARDROBE_ITEM_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (!WARDROBE_ITEM_NAME_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Use letters, numbers, spaces, or - ' / & ( ) . only.",
    };
  }
  return { valid: true, normalized };
}
