interface Question {
  text: string;
  /** True if the answer is typically visible in the listing photo itself, making it a weak verification question. */
  visual: boolean;
}

const questions: Record<string, Question[]> = {
  phone: [
    { text: "What brand and model is it?", visual: true },
    { text: "What color is it?", visual: true },
    { text: "Any distinctive scratches, stickers, or case?", visual: false },
    { text: "What's the wallpaper or lock screen photo?", visual: false },
    { text: "Any cracked screen or damage?", visual: true },
  ],
  laptop: [
    { text: "What brand and model is it?", visual: true },
    { text: "What color is it?", visual: true },
    { text: "Any stickers or distinctive marks on the lid?", visual: false },
    { text: "Is it in a bag or sleeve? What color?", visual: false },
    { text: "Any scratches, dents, or missing keys?", visual: false },
  ],
  wallet: [
    { text: "What color and material is it?", visual: true },
    { text: "What brand is it?", visual: true },
    { text: "Approximately how much cash was inside?", visual: false },
    { text: "What cards or IDs were in it? (types, not numbers)", visual: false },
    { text: "Any distinctive marks or wear patterns?", visual: false },
  ],
  keys: [
    { text: "How many keys are on the keychain?", visual: true },
    { text: "Any distinctive keychain, charm, or lanyard?", visual: true },
    { text: "What color is the keychain or keyring?", visual: true },
    { text: "Any brand name on the keys?", visual: false },
    { text: "What type of keys? (car, house, office, padlock)", visual: false },
  ],
  documents: [
    { text: "What is the name on the document?", visual: false },
    { text: "What type of document is it?", visual: true },
    { text: "What is the issuing authority?", visual: false },
    { text: "Any distinctive markings, stamps, or signatures?", visual: false },
    { text: "What is the document number ending in? (last 3 digits)", visual: false },
  ],
  bag: [
    { text: "What brand and color is it?", visual: true },
    { text: "What type of bag? (backpack, handbag, tote, briefcase)", visual: true },
    { text: "Any distinctive zippers, logos, or patterns?", visual: true },
    { text: "What items were inside the bag?", visual: false },
    { text: "Size or approximate dimensions?", visual: false },
  ],
  clothing: [
    { text: "What brand is it?", visual: true },
    { text: "What size and color is it?", visual: true },
    { text: "Any distinctive patterns, logos, or tears?", visual: true },
    { text: "What type of clothing? (jacket, shirt, dress, etc.)", visual: true },
    { text: "What material or fabric?", visual: false },
  ],
  footwear: [
    { text: "What brand and style is it?", visual: true },
    { text: "What size and color?", visual: true },
    { text: "Any distinctive marks, scuffs, or wear?", visual: false },
    { text: "Are they in a box or bag? What color?", visual: false },
    { text: "What type? (sneakers, sandals, boots, formal)", visual: true },
  ],
  jewelry: [
    { text: "What type of jewelry? (ring, necklace, earrings, bracelet)?", visual: true },
    { text: "What metal and color? (gold, silver, rose, etc.)", visual: true },
    { text: "Any gemstones? What color and shape?", visual: true },
    { text: "Any engravings or inscriptions?", visual: false },
    { text: "Is it in a box or pouch? What color?", visual: false },
  ],
  glasses: [
    { text: "What brand is it?", visual: false },
    { text: "What color and style? (sunglasses, prescription, reading)", visual: true },
    { text: "Frame shape? (round, square, aviator, cat-eye)", visual: true },
    { text: "Is it in a case? What color case?", visual: false },
    { text: "Any scratches or distinctive marks?", visual: false },
  ],
  watch: [
    { text: "What brand and model?", visual: false },
    { text: "What color is the dial and strap/bracelet?", visual: true },
    { text: "Digital or analog?", visual: true },
    { text: "Any engravings or distinctive marks?", visual: false },
    { text: "What material? (leather, metal, silicone)", visual: true },
  ],
  headphones: [
    { text: "What brand and model?", visual: true },
    { text: "What color is it?", visual: true },
    { text: "Are they wired or wireless?", visual: false },
    { text: "Is it in a case? What color case?", visual: false },
    { text: "Over-ear, on-ear, or earbuds?", visual: true },
  ],
  waterbottle: [
    { text: "What brand and color is it?", visual: true },
    { text: "What material? (steel, plastic, glass)", visual: true },
    { text: "Any stickers or marks on it?", visual: true },
    { text: "What size or capacity?", visual: false },
    { text: "What type of lid or cap?", visual: true },
  ],
  umbrella: [
    { text: "What color is it?", visual: true },
    { text: "Folding or non-folding?", visual: true },
    { text: "Any distinctive pattern, logo, or brand?", visual: true },
    { text: "What material is the handle?", visual: false },
    { text: "Approximate size when folded?", visual: false },
  ],
  toy: [
    { text: "What is it? (plush, action figure, doll, game)", visual: true },
    { text: "What color and size is it?", visual: true },
    { text: "Any distinctive features or accessories?", visual: true },
    { text: "What brand or character?", visual: true },
    { text: "Any wear, marks, or damage?", visual: false },
  ],
  other: [
    { text: "What color is it?", visual: true },
    { text: "Any unique markings or identifiers?", visual: false },
    { text: "What material is it?", visual: false },
    { text: "Approximate size or dimensions?", visual: false },
    { text: "Any distinctive features?", visual: false },
  ],
};

export const categoryLabels: Record<string, string> = {
  phone: "Phone / Tablet",
  laptop: "Laptop / Computer",
  wallet: "Wallet / Purse",
  keys: "Keys",
  documents: "Documents / ID",
  bag: "Bag / Luggage",
  clothing: "Clothing",
  footwear: "Footwear",
  jewelry: "Jewelry",
  glasses: "Glasses / Sunglasses",
  watch: "Watch",
  headphones: "Headphones / Earbuds",
  waterbottle: "Water Bottle",
  umbrella: "Umbrella",
  toy: "Toy / Game",
  other: "Other",
};

function pickOne<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Picks 2 questions per category, preferring at least one whose answer isn't visible in the listing photo. */
export function pickQuestions(category: string): [string, string] {
  const pool = questions[category] || questions.other;
  const nonVisual = pool.filter((q) => !q.visual);
  const first = nonVisual.length > 0 ? pickOne(nonVisual) : pickOne(pool);
  const second = pickOne(pool.filter((q) => q !== first));
  return [first.text, second.text];
}

export const categories = Object.keys(questions);
