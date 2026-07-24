const questions: Record<string, string[]> = {
  phone: [
    "What brand and model is it?",
    "What color is it?",
    "Any distinctive scratches, stickers, or case?",
    "What&rsquo;s the wallpaper or lock screen photo?",
    "Any cracked screen or damage?",
  ],
  laptop: [
    "What brand and model is it?",
    "What color is it?",
    "Any stickers or distinctive marks on the lid?",
    "Is it in a bag or sleeve? What color?",
    "Any scratches, dents, or missing keys?",
  ],
  wallet: [
    "What color and material is it?",
    "What brand is it?",
    "Approximately how much cash was inside?",
    "What cards or IDs were in it? (types, not numbers)",
    "Any distinctive marks or wear patterns?",
  ],
  keys: [
    "How many keys are on the keychain?",
    "Any distinctive keychain, charm, or lanyard?",
    "What color is the keychain or keyring?",
    "Any brand name on the keys?",
    "What type of keys? (car, house, office, padlock)",
  ],
  documents: [
    "What is the name on the document?",
    "What type of document is it?",
    "What is the issuing authority?",
    "Any distinctive markings, stamps, or signatures?",
    "What is the document number ending in? (last 3 digits)",
  ],
  bag: [
    "What brand and color is it?",
    "What type of bag? (backpack, handbag, tote, briefcase)",
    "Any distinctive zippers, logos, or patterns?",
    "What items were inside the bag?",
    "Size or approximate dimensions?",
  ],
  clothing: [
    "What brand is it?",
    "What size and color is it?",
    "Any distinctive patterns, logos, or tears?",
    "What type of clothing? (jacket, shirt, dress, etc.)",
    "What material or fabric?",
  ],
  footwear: [
    "What brand and style is it?",
    "What size and color?",
    "Any distinctive marks, scuffs, or wear?",
    "Are they in a box or bag? What color?",
    "What type? (sneakers, sandals, boots, formal)",
  ],
  jewelry: [
    "What type of jewelry? (ring, necklace, earrings, bracelet)?",
    "What metal and color? (gold, silver, rose, etc.)",
    "Any gemstones? What color and shape?",
    "Any engravings or inscriptions?",
    "Is it in a box or pouch? What color?",
  ],
  glasses: [
    "What brand is it?",
    "What color and style? (sunglasses, prescription, reading)",
    "Frame shape? (round, square, aviator, cat-eye)",
    "Is it in a case? What color case?",
    "Any scratches or distinctive marks?",
  ],
  watch: [
    "What brand and model?",
    "What color is the dial and strap/bracelet?",
    "Digital or analog?",
    "Any engravings or distinctive marks?",
    "What material? (leather, metal, silicone)",
  ],
  headphones: [
    "What brand and model?",
    "What color is it?",
    "Are they wired or wireless?",
    "Is it in a case? What color case?",
    "Over-ear, on-ear, or earbuds?",
  ],
  waterbottle: [
    "What brand and color is it?",
    "What material? (steel, plastic, glass)",
    "Any stickers or marks on it?",
    "What size or capacity?",
    "What type of lid or cap?",
  ],
  umbrella: [
    "What color is it?",
    "Folding or non-folding?",
    "Any distinctive pattern, logo, or brand?",
    "What material is the handle?",
    "Approximate size when folded?",
  ],
  toy: [
    "What is it? (plush, action figure, doll, game)",
    "What color and size is it?",
    "Any distinctive features or accessories?",
    "What brand or character?",
    "Any wear, marks, or damage?",
  ],
  other: [
    "What color is it?",
    "Any unique markings or identifiers?",
    "What material is it?",
    "Approximate size or dimensions?",
    "Any distinctive features?",
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

export function pickQuestions(category: string): [string, string] {
  const pool = questions[category] || questions.other;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

export const categories = Object.keys(questions);