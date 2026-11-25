import { getItemWithColor } from '../data/catalog.js';

export const BODY_TYPES = [
  {
    id: 'hourglass',
    label: 'Hourglass',
    shortDesc: 'Bahu & pinggul sejajar dengan pinggang ramping terdefinisi',
  },
  {
    id: 'pear',
    label: 'Pear (Segitiga)',
    shortDesc: 'Pinggul lebih penuh dibanding lebar bahu & dada',
  },
  {
    id: 'apple',
    label: 'Apple (Oval)',
    shortDesc: 'Volume terpusat di tubuh bagian atas dengan kaki jenjang',
  },
  {
    id: 'rectangle',
    label: 'Rectangle (Lurus)',
    shortDesc: 'Garis bahu, pinggang, dan pinggul cenderung sejajar',
  },
  {
    id: 'inverted',
    label: 'Inverted Triangle',
    shortDesc: 'Bahu lebih bidang dibanding garis pinggul',
  },
  {
    id: 'petite',
    label: 'Petite (<160 cm)',
    shortDesc: 'Postur mungil yang ideal dengan proporsi vertikal meninggi',
  },
];

function hexToHsl(hex) {
  const clean = String(hex || '#f4d3df').replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return { h: h * 60, s, l };
}

function classifyColor(hex) {
  const hsl = hexToHsl(hex);
  const isNeutral = hsl.s < 0.17 || hsl.l > 0.91 || hsl.l < 0.25;
  const isWarm =
    (hsl.h >= 12 && hsl.h <= 75) || (hsl.h >= 340 && hsl.s > 0.2 && hsl.l < 0.85);
  const isCool = hsl.h >= 165 && hsl.h <= 300;
  const undertone = isNeutral ? 'neutral' : isWarm ? 'warm' : isCool ? 'cool' : 'neutral';
  const depth = hsl.l < 0.42 ? 'dark' : hsl.l > 0.78 ? 'light' : 'mid';
  return { ...hsl, isNeutral, undertone, depth };
}

function hueDistance(h1, h2) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

function analyzeColorTheory(resolved, bodyType) {
  const entries = Object.entries(resolved).map(([slot, item]) => ({
    slot,
    item,
    color: classifyColor(item.col),
  }));

  const colorful = entries.filter((e) => !e.color.isNeutral);
  const darks = entries.filter((e) => e.color.depth === 'dark');
  const lights = entries.filter((e) => e.color.depth === 'light');
  const warms = colorful.filter((e) => e.color.undertone === 'warm');
  const cools = colorful.filter((e) => e.color.undertone === 'cool');

  let colorScore = 0;
  let schemeLabel = 'Netral Lembut';
  let toneSummary = '';
  const colorStrengths = [];
  const colorSuggestions = [];

  if (colorful.length === 0) {
    colorScore += 16;
    schemeLabel = 'Monokrom Netral';
    toneSummary = 'Palet netral (krem, putih, atau charcoal) memberi kesan quiet luxury yang rapi.';
    colorStrengths.push('Palet netral klasik bersih dan mudah menyatu di berbagai acara');
    if (entries.length >= 2 && darks.length === 0 && lights.length === entries.length) {
      colorSuggestions.push({
        aspect: 'Warna & Kontras',
        text: `Seluruh item bernuansa sangat terang. Beri satu jangkar visual warna gelap atau dusty rose pada sepatu (${resolved.shoes?.name || 'sepatu'}) atau outer agar siluet tidak tenggelam.`,
      });
    }
  } else if (colorful.length === 1) {
    colorScore += 18;
    schemeLabel = 'Statement Pastel + Netral';
    toneSummary = `${colorful[0].item.name} menjadi aksen warna utama yang ditopang warna netral bersih.`;
    colorStrengths.push(`Skema satu fokus warna lewat ${colorful[0].item.name} terlihat terkurasi`);
  } else {
    let maxGap = 0;
    let pair = [colorful[0], colorful[1]];
    for (let i = 0; i < colorful.length; i += 1) {
      for (let j = i + 1; j < colorful.length; j += 1) {
        const gap = hueDistance(colorful[i].color.h, colorful[j].color.h);
        if (gap > maxGap) {
          maxGap = gap;
          pair = [colorful[i], colorful[j]];
        }
      }
    }

    if (maxGap <= 28) {
      colorScore += 20;
      schemeLabel = 'Monokromatik & Tonal';
      toneSummary = 'Perpaduan gradasi satu rumpun warna menciptakan efek vertikal yang mahal dan ramping.';
      colorStrengths.push('Harmonisasi warna monokromatik menciptakan alur visual yang panjang dan elegan');
    } else if (maxGap <= 68) {
      colorScore += 18;
      schemeLabel = 'Analogous Pastel';
      toneSummary = `${pair[0].item.name} dan ${pair[1].item.name} berada dalam spektrum warna bertetangga yang lembut.`;
      colorStrengths.push('Skema warna analogous lembut terasa feminin dan harmonis');
    } else if (maxGap >= 150 && maxGap <= 195 && colorful.length === 2) {
      colorScore += 11;
      schemeLabel = 'Komplementer Kontras';
      toneSummary = `Kontras berseberangan antara ${pair[0].item.name} dan ${pair[1].item.name} cukup berani.`;
      colorSuggestions.push({
        aspect: 'Warna & Undertone',
        text: `Kontras warna ${pair[0].item.name} dan ${pair[1].item.name} cukup tinggi. Ganti warna salah satunya lewat titik warna ke nuansa krem (#faf5ea) atau blush lembut (#f4d3df) sebagai penengah.`,
      });
    } else if (warms.length > 0 && cools.length > 0) {
      colorScore -= 8;
      schemeLabel = 'Tabrakan Undertone';
      toneSummary = `${warms[0].item.name} (warm) bertemu ${cools[0].item.name} (cool) sehingga harmoni terasa kurang menyatu.`;
      colorSuggestions.push({
        aspect: 'Warna & Undertone',
        text: `Undertone hangat pada ${warms[0].item.name} kurang selaras dengan nuansa dingin ${cools[0].item.name}. Samakan undertone ke warna pastel dingin atau netral gading (#faf5ea) lewat titik warna.`,
      });
    } else {
      colorScore -= 6;
      schemeLabel = 'Multi-Hue Beragam';
      toneSummary = `Terlalu banyak warna berseberangan antara ${pair[0].item.name} dan ${pair[1].item.name}.`;
      colorSuggestions.push({
        aspect: 'Harmoni Warna',
        text: `Agar tampilan lebih mahal, terapkan aturan maksimal 2 warna pastel + 1 netral: ubah warna ${pair[1].item.name} menjadi putih gading (#faf5ea) atau slate gelap (#46404f).`,
      });
    }
  }

  // Body-specific color placement check
  const topCol = resolved.top ? classifyColor(resolved.top.col) : null;
  const bottomCol = resolved.bottom ? classifyColor(resolved.bottom.col) : null;

  if (bodyType === 'pear' && topCol && bottomCol && topCol.depth === 'dark' && bottomCol.depth === 'light') {
    colorScore -= 4;
    colorSuggestions.push({
      aspect: 'Penempatan Warna (Bentuk Pear)',
      text: `Untuk bentuk tubuh Pear, warna gelap di ${resolved.top.name} justru mengecilkan bahu sementara ${resolved.bottom.name} berwarna terang melebarkan pinggul. Tukar menjadi atasan pastel terang & bawahan lebih gelap/charcoal.`,
    });
  } else if (
    bodyType === 'inverted' &&
    topCol &&
    bottomCol &&
    topCol.depth === 'light' &&
    bottomCol.depth === 'dark' &&
    !resolved.bottom.fl
  ) {
    colorSuggestions.push({
      aspect: 'Penempatan Warna (Inverted Triangle)',
      text: `Warna terang pada ${resolved.top.name} menekankan area bahu. Coba pilih warna lebih soft/gelap di atasan dan beri nuansa cerah di ${resolved.bottom.name} agar bahu & pinggul tampak seimbang.`,
    });
  } else if (bodyType === 'petite' && topCol && bottomCol && hueDistance(topCol.h, bottomCol.h) > 80) {
    colorSuggestions.push({
      aspect: 'Ilusi Tinggi (Petite)',
      text: `Kontras warna tajam antara ${resolved.top.name} dan ${resolved.bottom.name} memotong garis tubuh secara horizontal. Menyamakan tone warna atasan-bawahan (column dressing) membuat tubuh Petite tampak lebih jenjang.`,
    });
  }

  return {
    colorScore,
    schemeLabel,
    toneSummary,
    colorStrengths,
    colorSuggestions,
  };
}

function analyzeBodyProportion(resolved, bodyType) {
  const top = resolved.top;
  const bottom = resolved.bottom;
  const dress = resolved.dress;
  const outer = resolved.outer;
  const shoes = resolved.shoes;

  let propScore = 0;
  const propStrengths = [];
  const propSuggestions = [];

  const topVoluminous = Boolean(top?.puff || top?.bow || (top?.e || 0) >= 6);
  const topSleek = Boolean(top && !topVoluminous && (top.e || 0) <= 3);
  const hasVOrScoop = Boolean(
    top?.nk === 'v' || top?.nk === 'cami' || top?.nk === 'off' || dress?.nk === 'v' || dress?.nk === 'cami'
  );
  const hasWaistFocus = Boolean(
    dress?.belt || (top && top.h <= 216) || bottom?.pleat || bottom?.k === 'skirt'
  );
  const wideOrFlaredBottom = Boolean(
    (bottom?.k === 'skirt' && bottom.fl >= 10) ||
      (bottom?.k === 'pants' && bottom.ho <= 90) ||
      (dress && dress.fl >= 12)
  );
  const narrowBottom = Boolean(
    (bottom?.k === 'skirt' && bottom.fl <= 4) || (bottom?.k === 'pants' && bottom.ho >= 96)
  );
  const elongatingShoe = Boolean(shoes && (shoes.k === 'heel' || shoes.k === 'plat' || shoes.k === 'mule'));

  if (bodyType === 'hourglass') {
    if (hasWaistFocus) {
      propScore += 14;
      propStrengths.push('Garis pinggang terdefinisi sangat ideal menonjolkan proporsi seimbang Hourglass');
    } else if ((top?.e || 0) >= 7 || (outer && !outer.open && (outer.e || 0) >= 6)) {
      propScore -= 7;
      propSuggestions.push({
        aspect: 'Bentuk Tubuh (Hourglass)',
        text: `Potongan longgar pada ${top ? top.name : outer?.name} menutupi lekuk pinggang alami Hourglass. Ganti dengan atasan fitted/cropped atau padukan dress ber-belt untuk menjaga rasio bahu-pinggang-pinggul.`,
      });
    } else {
      propScore += 6;
    }

    if (outer?.open && outer.h <= 252) {
      propStrengths.push(`Layering terbuka ${outer.name} tetap memperlihatkan siluet pinggang di tengah`);
    }
  } else if (bodyType === 'pear') {
    if (topVoluminous || top?.collar || top?.nk === 'off') {
      propScore += 10;
      propStrengths.push(`Detail bahu/kerah pada ${top?.name || 'atasan'} menarik fokus ke atas & menyeimbangkan pinggul Pear`);
    } else if (topSleek && narrowBottom) {
      propScore -= 8;
      propSuggestions.push({
        aspect: 'Bentuk Tubuh (Pear)',
        text: `${bottom?.name || 'Bawahan'} berpotongan ketat tanpa volume di atas membuat pinggul terlihat lebih dominan. Pilih atasan berdetail puff sleeve/pita (seperti Puff Sleeve Blouse) agar bahu tampak sejajar dengan pinggul.`,
      });
    }

    if ((bottom?.k === 'skirt' && bottom.fl >= 10) || (bottom?.k === 'pants' && bottom.ho <= 92)) {
      propScore += 8;
      propStrengths.push(`Potongan A-line / jatuh rapi pada ${bottom?.name || 'bawahan'} mengalir mulus melewati pinggul`);
    } else if (bottom?.k === 'skirt' && bottom.fl < 0) {
      propScore -= 7;
      propSuggestions.push({
        aspect: 'Siluet Pinggul (Pear)',
        text: `${bottom.name} yang menyempit di lutut cenderung menonjolkan lengkung pinggul. Pertimbangkan A-Line Skirt atau Wide-Leg Trousers agar proporsi lebih anggun.`,
      });
    }
  } else if (bodyType === 'apple') {
    if (hasVOrScoop || outer?.open) {
      propScore += 12;
      propStrengths.push(
        outer?.open
          ? `Garis vertikal terbuka dari ${outer.name} merampingkan area tengah tubuh Apple`
          : 'Garis leher V/terbuka memberi ilusi leher & torso yang lebih jenjang'
      );
    } else if (top?.rib && (top?.e || 0) >= 4) {
      propScore -= 8;
      propSuggestions.push({
        aspect: 'Bentuk Tubuh (Apple)',
        text: `Kerah tinggi rib pada ${top.name} memberi kesan penuh di area dada & perut. Coba atasan V-neck (seperti Cardigan atau Satin Wrap Blouse) atau lapisi dengan blazer terbuka.`,
      });
    }

    if (dress?.belt && dress.fl < 12) {
      propScore -= 5;
      propSuggestions.push({
        aspect: 'Garis Pinggang (Apple)',
        text: `${dress.name} dengan belt ketat bisa menekan area tengah tubuh Apple. Pilih dress flowy empire-waist atau rok bervolume sedang untuk mengalihkan fokus ke kaki jenjang.`,
      });
    } else if (bottom?.ho <= 96 || (bottom?.len && bottom.len <= 365)) {
      propScore += 6;
      propStrengths.push('Proporsi bawahan menonjolkan siluet kaki yang ramping');
    }
  } else if (bodyType === 'rectangle') {
    if (topVoluminous && wideOrFlaredBottom) {
      propScore += 14;
      propStrengths.push('Kombinasi detail atasan & flare bawahan sukses menciptakan ilusi lekuk pinggang');
    } else if (!hasWaistFocus && !wideOrFlaredBottom) {
      propScore -= 8;
      propSuggestions.push({
        aspect: 'Bentuk Tubuh (Rectangle)',
        text: `Siluet masih terlihat terlalu lurus untuk postur Rectangle. Tambahkan dimensi dengan rok berlipit (Pleated/Tiered Skirt), blouse peplum/pita, atau dress bersabuk agar pinggang terlihat lebih terbentuk.`,
      });
    } else {
      propScore += 7;
    }
  } else if (bodyType === 'inverted') {
    if (wideOrFlaredBottom && !top?.puff && !outer?.lap) {
      propScore += 14;
      propStrengths.push(`Volume pada ${bottom?.name || dress?.name} efektif menyeimbangkan garis bahu Inverted Triangle`);
    } else if ((top?.puff || top?.nk === 'off' || outer?.lap) && narrowBottom) {
      propScore -= 10;
      propSuggestions.push({
        aspect: 'Bentuk Tubuh (Inverted Triangle)',
        text: `Detail lebar bahu pada ${top?.puff ? top.name : outer?.name} ditambah bawahan ramping (${bottom?.name}) mempertegas kontras bahu bidang. Padukan dengan A-line/Tiered Skirt atau Wide-Leg Pants dan atasan berleher V.`,
      });
    } else if (!wideOrFlaredBottom && bottom) {
      propSuggestions.push({
        aspect: 'Keseimbangan Bawah (Inverted Triangle)',
        text: `Coba tukar ${bottom.name} dengan rok berlipit atau celana lebar (Wide-leg/Culottes) agar siluet bawah seimbang dengan bahu.`,
      });
    } else {
      propScore += 6;
    }
  } else if (bodyType === 'petite') {
    if (((top && top.h <= 220) || dress?.len <= 365 || elongatingShoe) && !(outer && outer.h >= 305)) {
      propScore += 14;
      propStrengths.push('Proporsi potongan tinggi & alas kaki membantu postur Petite tampak lebih tinggi');
    } else if ((outer && outer.h >= 305) || (top && top.h >= 242 && bottom?.hem >= 400)) {
      propScore -= 8;
      propSuggestions.push({
        aspect: 'Bentuk Tubuh (Petite)',
        text: `Panjang ${outer && outer.h >= 305 ? outer.name : top?.name} berisiko menenggelamkan tubuh mungil. Pilih atasan/outer cropped (panjang pinggang), rok di atas lutut/midi, serta heels atau platform shoes.`,
      });
    } else {
      propScore += 6;
    }

    if (shoes && !elongatingShoe && bottom?.hem >= 370 && bottom?.hem <= 385) {
      propSuggestions.push({
        aspect: 'Alas Kaki (Petite)',
        text: `${bottom.name} berpotongan tanggung (midi/culottes) sebaiknya dipadukan dengan ${shoes.k === 'sneak' ? 'heels atau platform Mary Janes' : 'ujung runcing/heels'} supaya kaki tidak terlihat memendek.`,
      });
    }
  }

  // General garment layering clashes regardless of body type
  if (outer && dress && outer.h > 290 && dress.len < 320) {
    propScore -= 6;
    propSuggestions.push({
      aspect: 'Proporsi Panjang Outer',
      text: `${outer.name} lebih panjang daripada ${dress.name} sehingga menutup siluet mini dress. Ganti dengan Cropped Cardigan atau Bolero agar rasio kaki tetap terjaga.`,
    });
  }

  if (top && bottom && top.h > 236 && (bottom.fl || 0) >= 16) {
    propScore -= 6;
    propSuggestions.push({
      aspect: 'Keseimbangan Atasan & Rok',
      text: `${top.name} yang panjang bertemu rok mengembang (${bottom.name}) membuat bagian pinggang tampak menumpuk. Ganti atasan dengan model crop atau tucked-in blouse.`,
    });
  }

  const silhouetteSummary =
    propStrengths[0] ||
    (propSuggestions[0]
      ? 'Beberapa garis potongan perlu disesuaikan dengan proporsi tubuh agar lebih menyanjung.'
      : 'Siluet keseluruhan sudah cukup seimbang untuk postur yang dipilih.');

  return {
    propScore,
    propStrengths,
    propSuggestions,
    silhouetteSummary,
  };
}

/**
 * Evaluate the currently dressed mannequin outfit like a professional fashion stylist,
 * checking completeness, color theory (hue, undertone, value placement), pattern texture mix,
 * and body-type silhouette alignment.
 *
 * @param {Record<string, [number, number]>} wornMap
 * @param {string} [bodyType='hourglass']
 */
export function evaluateMannequinStyle(wornMap, bodyType = 'hourglass') {
  const bodyCfg = BODY_TYPES.find((b) => b.id === bodyType) || BODY_TYPES[0];
  const entries = Object.entries(wornMap || {});

  if (!entries.length) {
    return {
      tier: 'poor',
      title: 'Mannequin Masih Kosong',
      score: 0,
      bodyTypeLabel: bodyCfg.label,
      colorAnalysis: {
        schemeLabel: 'Belum Tersusun',
        toneSummary: 'Pilih pakaian terlebih dahulu agar konsultan gaya dapat mengevaluasi palet warna.',
      },
      proportionAnalysis: {
        silhouetteSummary: `Belum ada siluet yang dinilai untuk postur ${bodyCfg.label}.`,
      },
      strengths: [],
      summary: 'Yuk kenakan pakaian pada mannequin terlebih dahulu sebelum menjalankan Check Style.',
      suggestions: [
        {
          aspect: 'Struktur Dasar',
          text: 'Mulai dengan memilih Atasan + Bawahan yang lengkap, atau langsung kenakan satu Dress sebagai fondasi utama.',
        },
        {
          aspect: `Rekomendasi ${bodyCfg.label}`,
          text:
            bodyType === 'pear'
              ? 'Untuk bentuk Pear, coba padukan Puff Sleeve Blouse dengan Pleated / A-Line Skirt.'
              : bodyType === 'apple'
              ? 'Untuk bentuk Apple, coba cardigan leher V atau wrap blouse yang dipadu celana straight.'
              : bodyType === 'petite'
              ? 'Untuk Petite, coba atasan crop dengan High-Waist Pants atau Mini Skirt plus platform shoes.'
              : 'Lengkapi look dengan Sepatu (Mary Janes, heels, atau sneakers) agar evaluasi proporsi penuh akurat.',
        },
      ],
    };
  }

  const resolved = {};
  for (const [slot, [itemId, colorIdx]] of entries) {
    const item = getItemWithColor(itemId, colorIdx);
    if (item) resolved[slot] = item;
  }

  const items = Object.values(resolved);
  const hasDress = Boolean(resolved.dress);
  const hasTop = Boolean(resolved.top);
  const hasBottom = Boolean(resolved.bottom);
  const hasOuter = Boolean(resolved.outer);
  const hasShoes = Boolean(resolved.shoes);

  let score = 42;
  const strengths = [];
  const suggestions = [];

  // 1. Completeness
  if (!hasDress && (!hasTop || !hasBottom)) {
    score -= 24;
    if (hasTop && !hasBottom) {
      suggestions.push({
        aspect: 'Kelengkapan Busana',
        text: `${resolved.top.name} masih membutuhkan pasangan bawahan. Pilih rok lipit, A-line skirt, atau celana berpotongan rapi di Wardrobe.`,
      });
    } else if (hasBottom && !hasTop) {
      suggestions.push({
        aspect: 'Kelengkapan Busana',
        text: `${resolved.bottom.name} masih belum memiliki atasan. Tambahkan blouse, cardigan, atau knit top berpotongan sesuai postur ${bodyCfg.label}.`,
      });
    } else {
      suggestions.push({
        aspect: 'Kelengkapan Busana',
        text: 'Lengkapi bagian atas dan bawah (atau pilih satu dress) supaya tampilan utuh.',
      });
    }
  } else {
    score += 20;
    strengths.push(
      hasDress
        ? `${resolved.dress.name} menjadi pusat perhatian siluet yang praktis dan menyatu`
        : `Struktur ${resolved.top.name} + ${resolved.bottom.name} sudah lengkap sebagai satu setelan`
    );
  }

  if (!hasShoes) {
    score -= 16;
    suggestions.push({
      aspect: 'Alas Kaki',
      text:
        bodyType === 'petite'
          ? 'Sepatu belum dipilih! Tambahkan heels atau platform Mary Janes untuk memberi tinggi ekstra pada postur Petite.'
          : 'Outfit belum memakai alas kaki. Pilih Mary Janes, ballet flats, atau sneakers yang selaras dengan nuansa warnanya.',
    });
  } else {
    score += 10;
  }

  // 2. Color Theory Analysis
  const colorEval = analyzeColorTheory(resolved, bodyType);
  score += colorEval.colorScore;
  strengths.push(...colorEval.colorStrengths);
  suggestions.push(...colorEval.colorSuggestions);

  // 3. Texture & Pattern Balance
  const boldPatterns = items.filter((it) =>
    ['floral', 'dot', 'check', 'stripe', 'heart', 'tweed'].includes(it.pat)
  );
  if (boldPatterns.length >= 2) {
    score -= 14;
    suggestions.push({
      aspect: 'Tekstur & Motif',
      text: `Dua motif kuat (${boldPatterns.map((p) => p.name).join(' & ')}) saling berebut fokus. Ganti salah satunya dengan item polos bertekstur halus seperti satin, linen, atau knit ringan.`,
    });
  } else if (boldPatterns.length === 1) {
    score += 6;
    strengths.push(`Satu aksen motif pada ${boldPatterns[0].name} menjaga tampilan tetap hidup tanpa ramai`);
  } else {
    score += 4;
  }

  // 4. Body-Type Proportion Analysis
  const bodyEval = analyzeBodyProportion(resolved, bodyType);
  score += bodyEval.propScore;
  strengths.push(...bodyEval.propStrengths);
  suggestions.push(...bodyEval.propSuggestions);

  // Ensure multi-angle helpful guidance if score isn't yet optimal
  if (score < 88 && suggestions.length < 2) {
    if (!hasOuter && hasTop && hasBottom) {
      suggestions.push({
        aspect: 'Layering Dimensi',
        text: `Tambahkan outer ringan seperti cardigan atau blazer terbuka untuk menciptakan bingkai vertikal yang lebih rapi bagi bentuk tubuh ${bodyCfg.label}.`,
      });
    }
    if (hasShoes && resolved.shoes) {
      const shoeColor = classifyColor(resolved.shoes.col);
      const topOrDress = resolved.top || resolved.dress;
      if (topOrDress && hueDistance(shoeColor.h, classifyColor(topOrDress.col).h) > 95 && !shoeColor.isNeutral) {
        suggestions.push({
          aspect: 'Koordinasi Sepatu',
          text: `Warna ${resolved.shoes.name} terlihat kurang terhubung dengan bagian atas. Selaraskan dengan mengulang warna atasan/netral krem pada sepatu.`,
        });
      }
    }
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const isComplete = (hasDress || (hasTop && hasBottom)) && hasShoes;

  // Deduplicate suggestions by aspect
  const uniqueSuggestions = [];
  const seenAspects = new Set();
  for (const s of suggestions) {
    if (!seenAspects.has(s.aspect)) {
      seenAspects.add(s.aspect);
      uniqueSuggestions.push(s);
    }
  }

  if (!isComplete || clampedScore < 62) {
    return {
      tier: 'poor',
      title: 'Kurang Cocok — Perlu Penyesuaian',
      score: clampedScore,
      bodyTypeLabel: bodyCfg.label,
      colorAnalysis: {
        schemeLabel: colorEval.schemeLabel,
        toneSummary: colorEval.toneSummary,
      },
      proportionAnalysis: {
        silhouetteSummary: bodyEval.silhouetteSummary,
      },
      strengths: strengths.slice(0, 2),
      summary: `Untuk postur ${bodyCfg.label}, paduan saat ini masih memiliki ketidakseimbangan warna atau siluet yang bisa diperbaiki dengan cepat.`,
      suggestions: uniqueSuggestions.slice(0, 4),
    };
  }

  if (clampedScore < 88) {
    return {
      tier: 'decent',
      title: 'Lumayan Manis — Hampir Sempurna!',
      score: clampedScore,
      bodyTypeLabel: bodyCfg.label,
      colorAnalysis: {
        schemeLabel: colorEval.schemeLabel,
        toneSummary: colorEval.toneSummary,
      },
      proportionAnalysis: {
        silhouetteSummary: bodyEval.silhouetteSummary,
      },
      strengths: strengths.slice(0, 3),
      summary: `Dasar gayamu sudah oke untuk bentuk tubuh ${bodyCfg.label}, perhatikan saran stylist di bawah agar naik ke level editorial 90+.`,
      suggestions: uniqueSuggestions.length
        ? uniqueSuggestions.slice(0, 4)
        : [
            {
              aspect: 'Sentuhan Akhir Stylist',
              text: `Coba ulangi warna netral atau pastel lembut dari ${
                (resolved.top || resolved.dress)?.name || 'atasan'
              } pada warna sepatumu agar kesatuan dari atas ke bawah makin solid.`,
            },
            {
              aspect: `Tips ${bodyCfg.label}`,
              text: 'Tambahkan outer berpotongan pas atau cek kembali rasio tinggi pinggang untuk hasil maksimal.',
            },
          ],
    };
  }

  return {
    tier: 'perfect',
    title: 'Sudah Sempurna! ✿',
    score: clampedScore,
    bodyTypeLabel: bodyCfg.label,
    colorAnalysis: {
      schemeLabel: colorEval.schemeLabel,
      toneSummary: colorEval.toneSummary,
    },
    proportionAnalysis: {
      silhouetteSummary: bodyEval.silhouetteSummary,
    },
    strengths: strengths.slice(0, 3),
    summary: `Sangat serasi untuk postur ${bodyCfg.label}! Harmoni warna (${colorEval.schemeLabel}), keseimbangan tekstur, dan proporsi busana mencapai standar stylist terbaik.`,
    suggestions: [
      {
        aspect: 'Pro Stylist Note',
        text: 'Tambahkan tas bahu mini berwarna senada sepatu & aksesori mutiara halus agar look makin siap difoto.',
      },
      {
        aspect: 'Tampak Belakang',
        text: 'Putar mannequin ke 180° untuk memastikan siluet lipit, kerah, dan potongan belakang sudah jatuh dengan rapi!',
      },
    ],
  };
}
