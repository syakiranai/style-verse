export const PALETTE_SWATCHES = ['#f4d3df', '#c9e2ef', '#faf5ea', '#46404f', '#d9cdea'];

export const CATEGORY_VIEWBOXES = {
  top: '46 84 168 166',
  bottom: '60 198 140 236',
  outer: '44 82 172 232',
  shoes: '84 398 92 72',
  dress: '44 84 172 350',
};

export const STUDIO_SLOTS = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'dress', label: 'Dress' },
  { key: 'outer', label: 'Outer' },
  { key: 'shoes', label: 'Shoes' },
];

export const WARDROBE_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'top', label: 'Tops' },
  { key: 'bottom', label: 'Bottoms' },
  { key: 'dress', label: 'Dresses' },
  { key: 'outer', label: 'Outerwear' },
  { key: 'shoes', label: 'Shoes' },
];

const RAW_ITEMS = [
  // Original Tops (0..19)
  ['Baby Tee Pastel', 'top', '#f2b9d0', 69, { t: 0.38, h: 192 }],
  ['White Basic Tee', 'top', '#f6f4ef', 59, { t: 0.4, h: 222 }],
  ['Blue Knit Cardigan', 'top', '#a9cfe1', 149, { t: 1, h: 226, nk: 'v', btn: 6, pat: 'knit' }],
  ['Puff Sleeve Blouse', 'top', '#f4d9e4', 129, { t: 0.34, h: 216, puff: 1, bow: 1 }],
  ['Striped Shirt', 'top', '#dbe9ee', 119, { t: 1, h: 232, collar: 1, btn: 7, pat: 'stripe' }],
  ['Satin Camisole', 'top', '#e8c7d5', 89, { t: 0, h: 216, nk: 'cami', pat: 'satin' }],
  ['Linen Shirt', 'top', '#e7dfce', 139, { t: 0.42, h: 234, collar: 1, btn: 6, pat: 'linen', e: 3 }],
  ['Long Sleeve Top', 'top', '#c8ddeb', 79, { t: 1, h: 222 }],
  ['Floral Blouse', 'top', '#f3e6ea', 135, { t: 0.62, h: 224, nk: 'v', puff: 1, pat: 'floral' }],
  ['Knit Vest', 'top', '#d7c9df', 99, { t: 0, h: 222, nk: 'vest', pat: 'knit' }],
  ['Off-shoulder Top', 'top', '#f0d6df', 85, { t: 0.4, h: 212, nk: 'off' }],
  ['Oversized Tee', 'top', '#d6e8ef', 75, { t: 0.5, h: 244, e: 9 }],
  ['Tank Top', 'top', '#f4efe6', 49, { t: 0, h: 214 }],
  ['Crop Top Ribbed', 'top', '#e9c4d2', 65, { t: 0.3, h: 182, pat: 'knit' }],
  ['Polo Shirt', 'top', '#cfe3df', 99, { t: 0.4, h: 228, collar: 1, btn: 3 }],
  ['Turtleneck Knit', 'top', '#d9cbb8', 139, { t: 1, h: 230, rib: 1, pat: 'knit' }],
  ['Polka Dot Blouse', 'top', '#e9ecf3', 125, { t: 0.5, h: 222, nk: 'v', puff: 1, pat: 'dot' }],
  ['Gingham Shirt', 'top', '#cfe0f0', 119, { t: 0.42, h: 230, collar: 1, btn: 6, pat: 'check' }],
  ['Sweatshirt', 'top', '#d8d0e2', 129, { t: 1, h: 240, e: 8, rib: 1 }],
  ['Henley Tee', 'top', '#efe6d6', 89, { t: 0.4, h: 226, btn: 3, e: 2 }],

  // Original Bottoms (20..43)
  ['Pleated Mini Skirt', 'bottom', '#e8c9d9', 99, { k: 'skirt', len: 294, fl: 8, pl: 7 }],
  ['Satin Midi Skirt', 'bottom', '#d8c3d8', 159, { k: 'skirt', len: 366, fl: 12, pl: 3, pat: 'satin' }],
  ['Wide-leg Trousers', 'bottom', '#d6d2cc', 169, { k: 'pants', ho: 82, hi: 126, hem: 416, crease: 1 }],
  ['Straight Jeans', 'bottom', '#8fb2cf', 189, { k: 'pants', ho: 96, hi: 122, hem: 416, pat: 'denim', jean: 1 }],
  ['Linen Shorts', 'bottom', '#e8d8c1', 89, { k: 'pants', ho: 88, hi: 124, hem: 330, pat: 'linen' }],
  ['Flowy Maxi Skirt', 'bottom', '#e8d8e2', 179, { k: 'skirt', len: 414, fl: 22, pl: 5 }],
  ['Tailored Pants', 'bottom', '#c5c5ce', 179, { k: 'pants', ho: 94, hi: 123, hem: 414, crease: 1 }],
  ['Cargo Pants', 'bottom', '#c0c4b0', 199, { k: 'pants', ho: 88, hi: 125, hem: 414, cargo: 1 }],
  ['Pleated Wide Pants', 'bottom', '#d9e6e8', 169, { k: 'pants', ho: 84, hi: 126, hem: 416, crease: 1, pleat: 1 }],
  ['Denim Skirt', 'bottom', '#9fb8ce', 129, { k: 'skirt', len: 318, fl: 5, pl: 0, pat: 'denim', jean: 1 }],
  ['A-line Skirt', 'bottom', '#eed4df', 109, { k: 'skirt', len: 336, fl: 16, pl: 0 }],
  ['Relaxed Jogger', 'bottom', '#c6d7df', 119, { k: 'pants', ho: 100, hi: 120, hem: 396, cuff: 1 }],
  ['Skinny Jeans', 'bottom', '#4d5f7a', 199, { k: 'pants', ho: 101, hi: 119, hem: 416, pat: 'denim', jean: 1 }],
  ['Mom Jeans', 'bottom', '#a9c3d8', 189, { k: 'pants', ho: 93, hi: 123, hem: 408, pat: 'denim', jean: 1 }],
  ['Flared Pants', 'bottom', '#cdb9a6', 179, { k: 'pants', ho: 76, hi: 126, hem: 416, crease: 1 }],
  ['Bermuda Shorts', 'bottom', '#cfd8c4', 99, { k: 'pants', ho: 90, hi: 124, hem: 352, crease: 1 }],
  ['Denim Shorts', 'bottom', '#8fb2cf', 89, { k: 'pants', ho: 92, hi: 124, hem: 310, pat: 'denim', jean: 1 }],
  ['Culottes', 'bottom', '#e2d6c8', 149, { k: 'pants', ho: 82, hi: 126, hem: 372, pleat: 1 }],
  ['Tennis Skirt', 'bottom', '#f3f0ea', 99, { k: 'skirt', len: 272, fl: 8, pl: 9 }],
  ['Pencil Skirt', 'bottom', '#4a4252', 139, { k: 'skirt', len: 340, fl: -6, pl: 0 }],
  ['Plaid Mini Skirt', 'bottom', '#c98fa0', 119, { k: 'skirt', len: 290, fl: 10, pl: 6, pat: 'check' }],
  ['Tiered Maxi Skirt', 'bottom', '#e9dfd0', 189, { k: 'skirt', len: 412, fl: 26, pl: 6, pat: 'linen' }],
  ['Sweatpants', 'bottom', '#c9c9d0', 99, { k: 'pants', ho: 99, hi: 121, hem: 402, cuff: 1 }],
  ['Black Trousers', 'bottom', '#3f3a48', 179, { k: 'pants', ho: 92, hi: 123, hem: 414, crease: 1 }],

  // Original Outerwear (44..55)
  ['Pastel Blazer', 'outer', '#d8bfd0', 259, { t: 1, h: 248, e: 4, open: 1, lap: 1, btn: 2 }],
  ['Cropped Cardigan', 'outer', '#b8d9e7', 159, { t: 1, h: 206, open: 1, pat: 'knit', btn: 4 }],
  ['Longline Vest', 'outer', '#e6ddcd', 189, { t: 0, h: 300, e: 3, open: 1, nk: 'vest' }],
  ['Denim Jacket', 'outer', '#9cb9cf', 249, { t: 1, h: 228, open: 1, collar: 1, pat: 'denim', jean: 1, btn: 4 }],
  ['Knit Sweater', 'outer', '#e7cbd9', 169, { t: 1, h: 238, e: 8, pat: 'knit', rib: 1 }],
  ['Long Outer Shirt', 'outer', '#d6e5e9', 179, { t: 1, h: 304, e: 6, open: 1, collar: 1 }],
  ['Trench Coat', 'outer', '#d2bfa2', 399, { t: 1, h: 330, e: 5, open: 1, collar: 1, lap: 1, btn: 5 }],
  ['Bomber Jacket', 'outer', '#8f9a86', 279, { t: 1, h: 214, e: 6, open: 1, btn: 2, pat: 'linen' }],
  ['Boxy Blazer', 'outer', '#3f3a48', 289, { t: 1, h: 240, e: 6, open: 1, lap: 1, btn: 2 }],
  ['Linen Shacket', 'outer', '#e9e0cf', 219, { t: 1, h: 262, e: 6, open: 1, collar: 1, pat: 'linen', btn: 4 }],
  ['Kimono Cardigan', 'outer', '#e6c5d4', 199, { t: 0.6, h: 310, e: 5, open: 1, pat: 'floral' }],
  ['Cable Knit Vest', 'outer', '#efe3d3', 149, { t: 0, h: 236, e: 2, open: 1, nk: 'vest', pat: 'knit', btn: 5 }],

  // Original Dresses (56..63)
  ['Floral Midi Dress', 'dress', '#f3e6ea', 329, { t: 0.34, puff: 1, nk: 'v', len: 362, fl: 16, pl: 4, pat: 'floral', belt: 1 }],
  ['Little Black Dress', 'dress', '#3f3a48', 299, { t: 0, nk: 'crew', len: 322, fl: 10, pl: 0 }],
  ['Striped Shirt Dress', 'dress', '#dbe9ee', 289, { t: 0.4, collar: 1, btn: 6, len: 372, fl: 12, pl: 3, pat: 'stripe', belt: 1 }],
  ['Satin Slip Dress', 'dress', '#e8c7d5', 319, { t: 0, nk: 'cami', len: 402, fl: 10, pl: 3, pat: 'satin' }],
  ['Denim Pinafore Dress', 'dress', '#9fb8ce', 259, { t: 0, nk: 'vest', len: 322, fl: 10, pl: 0, pat: 'denim', jean: 1 }],
  ['Blush Puff Mini Dress', 'dress', '#f4d3df', 279, { t: 0.3, puff: 1, bow: 1, len: 302, fl: 14, pl: 5 }],
  ['Linen Maxi Dress', 'dress', '#e7dfce', 349, { t: 0.3, nk: 'v', len: 412, fl: 18, pl: 5, pat: 'linen', belt: 1 }],
  ['Gingham Dress', 'dress', '#cfe0f0', 269, { t: 0.3, puff: 1, len: 340, fl: 14, pl: 4, pat: 'check' }],

  // Original Shoes (64..75)
  ['Mary Jane Flats', 'shoes', '#d9b3c5', 149, { k: 'mj' }],
  ['White Sneakers', 'shoes', '#efefef', 199, { k: 'sneak' }],
  ['Ballet Flats', 'shoes', '#d8c3d0', 129, { k: 'ballet' }],
  ['Loafers', 'shoes', '#b09888', 189, { k: 'loaf' }],
  ['Strappy Sandals', 'shoes', '#d9b999', 139, { k: 'sand' }],
  ['Pastel Heels', 'shoes', '#d9abc2', 169, { k: 'heel' }],
  ['Ankle Boots', 'shoes', '#6b4a3c', 249, { k: 'boot' }],
  ['Pink Sneakers', 'shoes', '#f2b9d0', 189, { k: 'sneak' }],
  ['Black Loafers', 'shoes', '#3a3238', 199, { k: 'loaf' }],
  ['Black Heels', 'shoes', '#2f2a33', 179, { k: 'heel' }],
  ['Gold Sandals', 'shoes', '#d9bf8a', 149, { k: 'sand' }],
  ['Cream Mary Janes', 'shoes', '#f1e6d4', 159, { k: 'mj' }],

  // Expanded Tops (76..85)
  ['Ribbed Bow Cardigan', 'top', '#f7c8dc', 139, { t: 1, h: 214, nk: 'v', bow: 1, pat: 'knit', btn: 4 }],
  ['Tulle Peplum Blouse', 'top', '#ffe3ee', 149, { t: 0.45, h: 228, nk: 'v', puff: 1, bow: 1, pat: 'lace' }],
  ['Sweetheart Milkmaid Top', 'top', '#fff5f8', 115, { t: 0.35, h: 206, nk: 'off', puff: 1, bow: 1 }],
  ['Pastel Tweed Crop Top', 'top', '#f2cedc', 159, { t: 0.3, h: 196, collar: 1, btn: 4, pat: 'tweed' }],
  ['Peter Pan Collar Blouse', 'top', '#f9eff3', 135, { t: 0.45, h: 222, collar: 1, bow: 1, puff: 1, pat: 'dot' }],
  ['Heart Knit Sweater', 'top', '#f4b8ce', 155, { t: 1, h: 234, rib: 1, pat: 'heart' }],
  ['Satin Wrap Blouse', 'top', '#e8d7f0', 145, { t: 0.9, h: 222, nk: 'v', pat: 'satin', bow: 1 }],
  ['Ruffle Lace Camisole', 'top', '#fceef3', 95, { t: 0, h: 208, nk: 'cami', pat: 'lace', bow: 1 }],
  ['Sailor Collar Top', 'top', '#d9e8f5', 129, { t: 0.42, h: 220, collar: 1, bow: 1, pat: 'stripe' }],
  ['Modest Tunic Blouse', 'top', '#f5e6ea', 165, { t: 1, h: 256, e: 4, collar: 1, btn: 5, pat: 'linen' }],

  // Expanded Bottoms (86..93)
  ['Ruffle Tiered Mini Skirt', 'bottom', '#fbd8e6', 125, { k: 'skirt', len: 292, fl: 16, pl: 6, pat: 'lace' }],
  ['Pastel Tweed Mini Skirt', 'bottom', '#f0cad9', 149, { k: 'skirt', len: 296, fl: 6, pl: 0, pat: 'tweed' }],
  ['Bow Pocket Midi Skirt', 'bottom', '#f6e4ec', 159, { k: 'skirt', len: 362, fl: 18, pl: 4, pat: 'dot' }],
  ['Organza Tulle Maxi Skirt', 'bottom', '#f7dfe9', 199, { k: 'skirt', len: 416, fl: 26, pl: 8, pat: 'satin' }],
  ['High-Waist Pastel Pants', 'bottom', '#f4d3df', 179, { k: 'pants', ho: 84, hi: 126, hem: 416, crease: 1, pleat: 1 }],
  ['Heart Stitch Denim Jeans', 'bottom', '#a7c6df', 195, { k: 'pants', ho: 93, hi: 123, hem: 414, pat: 'denim', jean: 1 }],
  ['Ribbon Wide Culottes', 'bottom', '#efe2e7', 159, { k: 'pants', ho: 80, hi: 126, hem: 374, pleat: 1, pat: 'linen' }],
  ['Gingham Picnic Skirt', 'bottom', '#f5c7d7', 135, { k: 'skirt', len: 344, fl: 18, pl: 5, pat: 'check' }],

  // Expanded Outerwear (94..103)
  ['Boutique Tweed Jacket', 'outer', '#f4cedc', 299, { t: 1, h: 216, e: 4, open: 1, btn: 4, pat: 'tweed' }],
  ['Fluffy Boucle Cardigan', 'outer', '#fde8f0', 189, { t: 1, h: 224, e: 5, open: 1, btn: 4, pat: 'knit' }],
  ['Strawberry Knit Bolero', 'outer', '#f6b8ce', 149, { t: 1, h: 188, open: 1, bow: 1, pat: 'knit' }],
  ['Pastel Varsity Jacket', 'outer', '#f3c6d8', 269, { t: 1, h: 222, e: 6, open: 1, btn: 5, rib: 1 }],
  ['Sheer Lace Outer', 'outer', '#fff2f6', 179, { t: 0.85, h: 274, e: 5, open: 1, pat: 'lace' }],
  ['Peplum Ribbon Blazer', 'outer', '#eec8d8', 279, { t: 1, h: 244, e: 3, open: 1, lap: 1, bow: 1 }],
  ['Hooded Cozy Parka', 'outer', '#e8d7ec', 319, { t: 1, h: 268, e: 8, open: 1, collar: 1, btn: 5 }],
  ['Satin Cropped Bomber', 'outer', '#f5d0de', 249, { t: 1, h: 204, e: 5, open: 1, rib: 1, pat: 'satin' }],
  ['Long Modest Cardigan', 'outer', '#f0dde4', 209, { t: 1, h: 326, e: 5, open: 1, pat: 'knit', btn: 5 }],
  ['Quilted Puffer Vest', 'outer', '#f9dce7', 199, { t: 0, h: 224, e: 6, open: 1, nk: 'vest', btn: 4 }],

  // Expanded Dresses (104..115)
  ['Strawberry Milk Mini Dress', 'dress', '#fbd4e3', 289, { t: 0.34, puff: 1, bow: 1, len: 304, fl: 16, pl: 6, pat: 'heart' }],
  ['Coquette Ribbon Midi Dress', 'dress', '#f5c2d6', 339, { t: 0.35, puff: 1, nk: 'v', bow: 1, len: 364, fl: 18, pl: 5, belt: 1 }],
  ['Lace Princess Gown', 'dress', '#fff0f5', 429, { t: 0.32, puff: 1, len: 412, fl: 26, pl: 7, pat: 'lace', belt: 1 }],
  ['Tweed Collar Mini Dress', 'dress', '#f0cbd9', 319, { t: 0.35, collar: 1, btn: 4, len: 306, fl: 10, pl: 2, pat: 'tweed' }],
  ['Polka Tea Party Dress', 'dress', '#fde4ee', 299, { t: 0.34, puff: 1, nk: 'v', len: 356, fl: 18, pl: 5, pat: 'dot', belt: 1 }],
  ['Lilac Satin Evening Dress', 'dress', '#e4d3ef', 389, { t: 0, nk: 'cami', len: 408, fl: 14, pl: 3, pat: 'satin', belt: 1 }],
  ['Modest Pleated Dress', 'dress', '#f3e1e8', 359, { t: 1, collar: 1, btn: 4, len: 416, fl: 20, pl: 6, belt: 1 }],
  ['Pastel Knit Sweater Dress', 'dress', '#f6d4e0', 279, { t: 1, nk: 'crew', len: 328, fl: 8, pl: 2, pat: 'knit', belt: 1 }],
  ['Cherry Check Sundress', 'dress', '#f8c5d6', 269, { t: 0, nk: 'cami', bow: 1, len: 334, fl: 18, pl: 5, pat: 'check' }],
  ['Balletcore Wrap Dress', 'dress', '#f9dce7', 309, { t: 0.85, nk: 'v', bow: 1, len: 338, fl: 16, pl: 4, pat: 'satin' }],
  ['Sailor Preppy Dress', 'dress', '#dbe8f6', 289, { t: 0.38, collar: 1, bow: 1, len: 312, fl: 14, pl: 7 }],
  ['Botanical Silk Maxi Dress', 'dress', '#eef5ea', 369, { t: 0.4, puff: 1, nk: 'v', len: 414, fl: 20, pl: 5, pat: 'floral', belt: 1 }],

  // Expanded Shoes (116..123)
  ['Ribbon Platform Mary Janes', 'shoes', '#f4c0d4', 189, { k: 'plat' }],
  ['Pastel Bow Mules', 'shoes', '#fde0eb', 159, { k: 'mule' }],
  ['Coquette Ballet Heels', 'shoes', '#f6cbd9', 179, { k: 'heel' }],
  ['Blush High-Top Sneakers', 'shoes', '#f8d2e0', 219, { k: 'sneak' }],
  ['Pearl Strap Sandals', 'shoes', '#fff0f5', 149, { k: 'sand' }],
  ['Cream Knee-High Boots', 'shoes', '#f7ece6', 289, { k: 'boot' }],
  ['Lavender Platform Loafers', 'shoes', '#dfd0ec', 199, { k: 'plat' }],
  ['Satin Ribbon Ballerinas', 'shoes', '#f3c9d9', 139, { k: 'ballet' }],
];

export const ITEMS = RAW_ITEMS.map((row, index) => ({
  id: index,
  name: row[0],
  cat: row[1],
  base: row[2],
  price: row[3] * 1000,
  seed: ((index * 7) % 11) + 2,
  ...row[4],
}));

/**
 * Return color palette choices for a garment item.
 * @param {typeof ITEMS[number]} item
 * @returns {string[]}
 */
export function getItemPalette(item) {
  return [item.base, ...PALETTE_SWATCHES];
}

/**
 * Resolve item record with a selected palette color index.
 * @param {number} id
 * @param {number} [colorIndex=0]
 */
export function getItemWithColor(id, colorIndex = 0) {
  const item = ITEMS[id];
  if (!item) return null;
  const palette = getItemPalette(item);
  return {
    ...item,
    col: palette[colorIndex] || item.base,
  };
}
