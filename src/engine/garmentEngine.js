import { CATEGORY_VIEWBOXES, getItemWithColor } from '../data/catalog.js';
import { svgToDataUri } from '../utils/format.js';

const GOLD_STITCH = '#d6a85a';
const THUMB_CACHE = new Map();
const EDITORIAL_CACHE = new Map();

function mixHex(hexA, hexB, t) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = parse(hexA);
  const b = parse(hexB);
  return (
    '#' +
    a
      .map((v, i) =>
        Math.round(v + (b[i] - v) * t)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

const lighten = (c, t) => mixHex(c, '#ffffff', t);
const darken = (c, t) => mixHex(c, '#2a1a20', t);

function smoothCurve(points) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const f = (n) => n.toFixed(1);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(
      p2[0] - (p3[0] - p1[0]) / 6
    )} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const mirrorHalf = (svg) => `<g>${svg}</g><g transform="translate(260 0) scale(-1 1)">${svg}</g>`;

const seamLine = (d, col, opacity, width = 1) =>
  `<path d="${d}" fill="none" stroke="${darken(col, 0.5)}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round"/>`;

const TORSO_PROFILE = [
  [96, 82],
  [120, 92],
  [142, 97],
  [170, 100],
  [205, 104],
  [232, 98],
  [258, 92],
  [290, 93],
  [330, 100],
];

function sideWidthAtY(y) {
  for (let i = 1; i < TORSO_PROFILE.length; i += 1) {
    if (y <= TORSO_PROFILE[i][0]) {
      const a = TORSO_PROFILE[i - 1];
      const b = TORSO_PROFILE[i];
      return a[1] + ((b[1] - a[1]) * (y - a[0])) / (b[0] - a[0]);
    }
  }
  return 100;
}

const SHARED_DEFS = `
  <clipPath id="cl"><rect width="129.5" height="500"/></clipPath>
  <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".18"/>
    <stop offset=".5" stop-opacity="0"/>
    <stop offset="1" stop-color="#2a1018" stop-opacity=".17"/>
  </linearGradient>
`;

function buildFabricDefs(item) {
  const c = item.col;
  const id = item.id;
  const pat = item.pat;
  const makePattern = (size, content) =>
    `<pattern id="pt${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${content}</pattern>`;

  let defs = `<linearGradient id="g${id}" gradientUnits="userSpaceOnUse" x1="62" x2="198">
    <stop offset="0" stop-color="${darken(c, 0.2)}"/>
    <stop offset=".3" stop-color="${c}"/>
    <stop offset=".5" stop-color="${lighten(c, 0.22)}"/>
    <stop offset=".7" stop-color="${c}"/>
    <stop offset="1" stop-color="${darken(c, 0.2)}"/>
  </linearGradient>`;

  if (pat === 'stripe') {
    defs += makePattern(8, `<rect width="3.2" height="8" fill="${darken(c, 0.3)}" opacity=".5"/>`);
  } else if (pat === 'knit') {
    defs += makePattern(4, `<path d="M1 0v4M3 0v4" stroke="${darken(c, 0.4)}" stroke-width=".9" opacity=".3"/>`);
  } else if (pat === 'linen') {
    defs += makePattern(5, `<path d="M0 1h5M1 0v5" stroke="${darken(c, 0.4)}" stroke-width=".5" opacity=".18"/>`);
  } else if (pat === 'denim') {
    defs += makePattern(
      3,
      `<path d="M0 3L3 0" stroke="${lighten(c, 0.5)}" stroke-width=".7" opacity=".45"/><path d="M0 1L1 0" stroke="${darken(c, 0.4)}" stroke-width=".5" opacity=".3"/>`
    );
  } else if (pat === 'floral') {
    defs += makePattern(
      15,
      `<circle cx="4" cy="4" r="2.5" fill="#d97b9c" opacity=".8"/><circle cx="4" cy="4" r=".9" fill="#f9e3a0"/><circle cx="11" cy="10" r="1.8" fill="#fff" opacity=".8"/><path d="M9 3q3-1 3 2q-3 1-3-2" fill="#8fb48a" opacity=".7"/>`
    );
  } else if (pat === 'dot') {
    defs += makePattern(
      9,
      `<circle cx="3" cy="3" r="1.6" fill="#fff" opacity=".75"/><circle cx="7.5" cy="7.5" r="1.6" fill="#fff" opacity=".75"/>`
    );
  } else if (pat === 'check') {
    defs += makePattern(
      10,
      `<rect width="5" height="10" fill="${darken(c, 0.25)}" opacity=".3"/><rect width="10" height="5" fill="${darken(c, 0.25)}" opacity=".3"/>`
    );
  } else if (pat === 'satin') {
    defs += `<linearGradient id="pt${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".3" stop-color="#fff" stop-opacity=".5"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".7" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>`;
  } else if (pat === 'heart') {
    defs += makePattern(
      14,
      `<path d="M7 10.5C7 10.5 3.5 8 3.5 5.8A1.9 1.9 0 0 1 7 4.7A1.9 1.9 0 0 1 10.5 5.8C10.5 8 7 10.5 7 10.5Z" fill="#e06f97" opacity=".55"/>`
    );
  } else if (pat === 'lace') {
    defs += makePattern(
      10,
      `<circle cx="5" cy="5" r="3.4" fill="none" stroke="#ffffff" stroke-width=".9" opacity=".65"/><circle cx="5" cy="5" r="1.2" fill="#ffffff" opacity=".7"/>`
    );
  } else if (pat === 'tweed') {
    defs += makePattern(
      8,
      `<path d="M0 2h8M0 6h8M2 0v8M6 0v8" stroke="${darken(c, 0.32)}" stroke-width="1" opacity=".28"/><path d="M1 1h2v2H1zM5 5h2v2H5z" fill="#ffffff" opacity=".45"/>`
    );
  }

  return defs;
}

function fillFabric(pathD, item) {
  return (
    `<path d="${pathD}" fill="url(#g${item.id})"/>` +
    (item.pat ? `<path d="${pathD}" fill="url(#pt${item.id})"/>` : '') +
    `<path d="${pathD}" fill="url(#v)"/>` +
    `<path d="${pathD}" fill="none" clip-path="url(#cl)" stroke="${darken(item.col, 0.4)}" stroke-width="1" stroke-linejoin="round"/>`
  );
}

const topStitch = (d, width = 0.9) =>
  `<path d="${d}" fill="none" stroke="${GOLD_STITCH}" stroke-width="${width}" stroke-dasharray="2 1.6"/>`;

const drawButton = (x, y, col) =>
  `<circle cx="${x}" cy="${y}" r="1.9" fill="${lighten(col, 0.35)}" stroke="${darken(col, 0.5)}" stroke-width=".6"/><circle cx="${x}" cy="${y}" r=".5" fill="${darken(col, 0.5)}"/>`;

const NECKLINES = {
  crew: 'M130.5 106C121 106 117 99 116 91',
  v: 'M130.5 126L116 91',
  cami: 'M130.5 124C121 122 114 112 111 98L109 89L103 89L101 100',
  vest: 'M130.5 128L117 92L108 91',
  off: 'M130.5 108Q108 118 88 112',
};

const BACK_NECKLINES = {
  crew: 'M130.5 93C122 93 117 91 116 89',
  v: 'M130.5 104C121 102 117 95 116 90',
  cami: 'M130.5 112C120 111 114 106 111 98L109 89L103 89L101 100',
  vest: 'M130.5 106C121 103 117 96 116 90L108 91',
  off: 'M130.5 106Q108 114 88 112',
};

function drawTop(item, opts, side = 'front') {
  const isBack = side === 'back';
  const c = item.col;
  const sleeveLen = opts.t || 0;
  const hemY = opts.h;
  const ease = opts.e || 0;
  const nk = opts.nk || 'crew';
  const armholeX = 97 - ease * 0.5;
  const outerSleeveX = 82 - 27 * sleeveLen - ease;
  const outerSleeveY = 100 + 136 * sleeveLen;
  const innerSleeveY = outerSleeveY + 9;
  const innerSleeveX = 96 - 0.29 * (innerSleeveY - 142) + ease * 0.3 + 1;

  const isOpenFront = Boolean(opts.open) && !isBack;
  const neckPaths = isBack ? BACK_NECKLINES : NECKLINES;

  let d = isOpenFront
    ? `M123 ${hemY}L123 112L116 91${sleeveLen ? '' : 'L108 91'}`
    : neckPaths[nk] || neckPaths.crew;

  if (sleeveLen && nk !== 'off') {
    d += `L${84 - ease * 0.3} 98`;
  }
  if (sleeveLen) {
    d +=
      (opts.puff
        ? `Q${outerSleeveX - 9} ${outerSleeveY - 18} ${outerSleeveX} ${outerSleeveY}`
        : `L${outerSleeveX} ${outerSleeveY}`) + `L${innerSleeveX} ${innerSleeveY}L${armholeX} 142`;
  } else {
    d += `C99 108 100 126 ${armholeX} 142`;
  }

  const sideYs = [170, 205, 232, 258].filter((y) => y < hemY - 8);
  d +=
    smoothCurve([
      [armholeX, 142],
      ...sideYs.map((y) => [sideWidthAtY(y) - ease * 0.7, y]),
      [sideWidthAtY(hemY) - ease * 0.7, hemY],
    ]).replace('M', 'L') +
    (isOpenFront ? `L123 ${hemY}Z` : `Q118 ${hemY + 5} 130.5 ${hemY + 2}Z`);

  let half =
    fillFabric(d, item) +
    seamLine(`M${armholeX} 143C${armholeX + 5} 153 ${armholeX + 7} 165 ${armholeX + 6} 180`, c, 0.2) +
    seamLine(`M106 ${hemY - 24}q10 7 24 4`, c, 0.15) +
    seamLine(
      `M${sideWidthAtY(hemY) - ease * 0.7 + 2} ${hemY - 5}Q118 ${hemY} 130 ${hemY - 3}`,
      c,
      0.18
    );

  if (sleeveLen) {
    half += seamLine(`M${outerSleeveX + 4} ${outerSleeveY - 12}L${armholeX - 2} 152`, c, 0.15);
  }
  if (sleeveLen > 0.8) {
    half += seamLine(
      `M${outerSleeveX + 1} ${outerSleeveY - 9}L${innerSleeveX + 1} ${innerSleeveY - 9}`,
      c,
      0.3,
      1.4
    );
  }
  if (opts.puff) {
    half += seamLine(
      `M${outerSleeveX + 1} ${outerSleeveY - 3}L${innerSleeveX} ${innerSleeveY - 3}`,
      c,
      0.35,
      2.2
    );
  }
  if (nk === 'crew' && !isOpenFront && !opts.rib) {
    half += seamLine(neckPaths.crew, c, 0.35, 1.6);
  }

  if (isBack) {
    half +=
      seamLine(`M92 114Q112 119 130.5 118`, c, 0.2) +
      seamLine(`M115 148C113 170 114 192 116 ${Math.min(hemY - 8, 212)}`, c, 0.22);

    if (opts.collar || opts.lap) {
      half += `<path d="M116 88C121 94 126 96 130.5 96L130.5 89C124 89 119 88 116 88Z" fill="${lighten(
        c,
        0.18
      )}" stroke="${darken(c, 0.4)}" stroke-width=".8"/>`;
    }
    if (opts.jean) {
      half +=
        topStitch('M88 114Q110 120 130.5 119') +
        topStitch(`M104 120L108 ${hemY - 12}`) +
        `<path d="M104 ${hemY - 10}h14v8h-14z" fill="${darken(c, 0.06)}" stroke="${darken(
          c,
          0.45
        )}" stroke-width=".7"/>` +
        drawButton(112, hemY - 6, c);
    }
  } else {
    if (opts.collar) {
      half += `<path d="M116 90L105 105L123 114L130.5 108L129 98Z" fill="${lighten(
        c,
        0.2
      )}" stroke="${darken(c, 0.4)}" stroke-width=".8"/>`;
    }
    if (opts.lap) {
      half +=
        `<path d="M116 90L103 106L118 134L124 156L123 112Z" fill="${lighten(
          c,
          0.14
        )}" stroke="${darken(c, 0.4)}" stroke-width=".8"/>` +
        seamLine('M118 134L109 122', c, 0.3);
    }
    if (opts.jean) {
      half +=
        topStitch('M104 143h14v15h-14z') +
        topStitch('M104 149h14') +
        topStitch(
          `M${armholeX - 3} 150C${armholeX - 1} 170 ${armholeX - 2} 200 ${armholeX - 3} ${
            hemY - 6
          }`
        );
    }
  }

  let full = mirrorHalf(half);
  const centerX = isOpenFront ? 123 : 130.5;

  if (isBack) {
    const backNeckY = nk === 'v' ? 104 : nk === 'cami' ? 112 : nk === 'vest' ? 106 : 95;
    full += seamLine(`M130.5 ${backNeckY}V${hemY - (opts.lap || hemY >= 245 ? 24 : 2)}`, c, 0.24);
    if (opts.lap || hemY >= 245) {
      full += `<path d="M128.5 ${hemY - 24}h4v26h-4z" fill="${darken(c, 0.14)}" opacity=".4"/>`;
      full += seamLine(`M130.5 ${hemY - 24}V${hemY + 2}`, c, 0.4, 1.2);
    }
    if (opts.bow) {
      const bowY = hemY > 206 ? 196 : Math.max(118, hemY - 20);
      full += `<path d="M130 ${bowY}C117 ${bowY - 10} 110 ${bowY + 4} 125 ${bowY + 5}ZM130 ${bowY}C143 ${bowY - 10} 150 ${bowY + 4} 135 ${bowY + 5}Z" fill="${lighten(
        c,
        0.12
      )}" stroke="${darken(c, 0.4)}" stroke-width=".8"/><path d="M129 ${bowY + 3}L124 ${
        bowY + 18
      }M131 ${bowY + 3}L136 ${bowY + 18}" stroke="${darken(
        c,
        0.4
      )}" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="130" cy="${
        bowY + 1
      }" r="2.8" fill="${darken(c, 0.05)}" stroke="${darken(c, 0.4)}" stroke-width=".7"/>`;
    }
    if (opts.rib) {
      full +=
        `<ellipse cx="130" cy="91" rx="16" ry="5.5" fill="${darken(c, 0.1)}" stroke="${darken(
          c,
          0.45
        )}" stroke-width=".8"/>` +
        seamLine(
          `M${sideWidthAtY(hemY) - ease * 0.7} ${hemY - 7}Q118 ${hemY - 2} 130.5 ${hemY - 5}`,
          c,
          0.35,
          2
        );
    }
    return full;
  }

  if (opts.btn) {
    const startY = isOpenFront ? 128 : nk === 'v' ? 134 : 116;
    const step = (hemY - 14 - startY) / (opts.btn - 1);
    full += seamLine(`M${centerX} ${startY - 8}V${hemY}`, c, 0.25);
    for (let k = 0; k < opts.btn; k += 1) {
      full += drawButton(centerX, startY + k * step, c);
    }
  }

  if (opts.bow) {
    full += `<path d="M130 109C117 98 110 113 125 114ZM130 109C143 98 150 113 135 114Z" fill="${lighten(
      c,
      0.1
    )}" stroke="${darken(c, 0.4)}" stroke-width=".8"/><path d="M129 112L124 128M131 112L136 128" stroke="${darken(
      c,
      0.4
    )}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="130" cy="110" r="3" fill="${darken(
      c,
      0.05
    )}" stroke="${darken(c, 0.4)}" stroke-width=".7"/>`;
  }

  if (opts.rib) {
    full +=
      `<ellipse cx="130" cy="92" rx="16" ry="6.5" fill="${darken(c, 0.1)}" stroke="${darken(
        c,
        0.45
      )}" stroke-width=".8"/><ellipse cx="130" cy="92" rx="10" ry="3.5" fill="${darken(
        c,
        0.35
      )}" opacity=".5"/>` +
      seamLine(
        `M${sideWidthAtY(hemY) - ease * 0.7} ${hemY - 7}Q118 ${hemY - 2} 130.5 ${hemY - 5}`,
        c,
        0.35,
        2
      );
  }

  return full;
}

function drawSkirt(item, opts, side = 'front') {
  const isBack = side === 'back';
  const c = item.col;
  const L = opts.len;
  const fl = opts.fl;
  const ex = 92 - fl;
  const pl = opts.pl || 3;
  const hemWave =
    fl > 12
      ? `Q${ex + 10} ${L + 9} ${(130 + ex) / 2} ${L + 2}T130.5 ${L + 3}`
      : `Q${(130 + ex) / 2} ${L + 6} 130.5 ${L + 3}`;

  let half = fillFabric(`M130.5 207L104 207C99 224 94 244 91 260L${ex} ${L}${hemWave}Z`, item);

  for (let k = 1; k <= pl; k += 1) {
    const f = k / (pl + 1);
    const x1 = 104 + 26.5 * f;
    const x2 = ex + (130.5 - ex) * f;
    half +=
      seamLine(`M${x1} 216Q${(x1 + x2) / 2 - 1} ${(216 + L) / 2} ${x2} ${L}`, c, opts.pl ? 0.3 : 0.14) +
      `<path d="M${x1 + 2} 216Q${(x1 + x2) / 2 + 1} ${(216 + L) / 2} ${x2 + 2} ${L}" stroke="${lighten(c, 0.7)}" stroke-opacity=".4" fill="none"/>`;
  }

  if (!opts.dress) {
    half += `<path d="M130.5 205L104 205L102.5 216L130.5 216Z" fill="${darken(c, 0.06)}" stroke="${darken(c, 0.45)}" stroke-width=".8"/>`;
  }
  if (isBack) {
    half += seamLine('M116 216L115 240', c, 0.26);
    if (opts.jean && !opts.dress) {
      half += topStitch('M108 225h14v15l-7 4-7-4z');
    }
  } else if (opts.jean && !opts.dress) {
    half += topStitch('M106 222C109 234 118 236 124 226');
  }
  if (opts.jean) {
    half += topStitch(`M${ex + 2} ${L - 5}L130 ${L - 3}`);
  }
  if (L > 400) {
    half += seamLine(`M${ex + 4} 330Q112 340 130 336`, c, 0.2);
  }

  if (isBack) {
    const zipper = opts.dress
      ? seamLine('M130.5 205V265', c, 0.32, 1.2)
      : seamLine('M130.5 206V258', c, 0.35, 1.3) +
        `<rect x="129.4" y="210" width="2.2" height="5" rx="1" fill="#d8ccd2" stroke="${darken(c, 0.4)}" stroke-width=".5"/>`;
    return mirrorHalf(half) + zipper;
  }

  return opts.dress
    ? mirrorHalf(half)
    : mirrorHalf(half) + (opts.jean ? drawButton(126, 211, c) : '') + seamLine('M130.5 216V224', c, 0.2);
}

function drawPants(item, opts, side = 'front') {
  const isBack = side === 'back';
  const c = item.col;
  const { ho, hi, hem: H } = opts;
  const mid = [(92 + ho) / 2, (262 + H) / 2];

  let half = fillFabric(
    smoothCurve([[104, 206], [96, 232], [92, 262], mid, [ho, H]]) +
      `L${hi} ${H}C${hi} ${H - (H - 290) * 0.5} 128 ${290 + (H - 290) * 0.35} 130.5 290L130.5 206Z`,
    item
  );

  half += `<path d="M130.5 205L104 205L102.5 216L130.5 216Z" fill="${darken(c, 0.06)}" stroke="${darken(c, 0.45)}" stroke-width=".8"/>`;

  if (isBack) {
    half +=
      seamLine('M103 222Q117 228 130.5 227', c, 0.28) +
      seamLine(`M${ho + 4} 342Q${(ho + hi) / 2} 346 ${hi - 4} 342`, c, 0.18);
    if (opts.jean) {
      half +=
        topStitch('M103 221Q117 227 130.5 226') +
        `<path d="M107 232h16v17l-8 5-8-5z" fill="${darken(c, 0.05)}" fill-opacity=".28" stroke="${darken(c, 0.4)}" stroke-width=".7"/>` +
        topStitch('M108 233h14v15l-7 4-7-4z') +
        topStitch(`M97 232C94 260 ${ho + 6} 340 ${ho + 2} ${H - 4}`) +
        topStitch(`M${ho + 1} ${H - 5}L${hi - 1} ${H - 5}`);
    } else {
      half += seamLine('M109 235h15', c, 0.34, 1.3);
    }
  } else {
    half += seamLine('M104 214C108 222 110 234 108 246', c, 0.25);

    if (opts.crease) {
      half +=
        seamLine(`M${(104 + ho) / 2 + 4} 264L${(ho + hi) / 2} ${H - 2}`, c, 0.2) +
        `<path d="M${(104 + ho) / 2 + 5} 264L${(ho + hi) / 2 + 1} ${H - 2}" stroke="${lighten(c, 0.7)}" stroke-opacity=".45" fill="none"/>`;
    }
    if (opts.pleat) {
      half +=
        seamLine('M114 216C112 232 112 244 113 258', c, 0.3) +
        seamLine('M120 216C119 230 119 240 120 252', c, 0.2);
    }
    if (opts.cargo) {
      half +=
        `<path d="M92 292h14v26h-14z" fill="${lighten(c, 0.08)}" stroke="${darken(c, 0.45)}" stroke-width=".8"/><path d="M92 292h14v8h-14z" fill="${darken(c, 0.08)}" stroke="${darken(c, 0.4)}" stroke-width=".6"/>` +
        drawButton(99, 300, c);
    }
    if (opts.jean) {
      half +=
        topStitch('M106 218C108 232 114 236 122 230') +
        topStitch(`M97 232C94 260 ${ho + 6} 340 ${ho + 2} ${H - 4}`) +
        topStitch(`M${ho + 1} ${H - 5}L${hi - 1} ${H - 5}`);
    }
  }

  if (opts.cuff) {
    half +=
      `<path d="M${ho} ${H - 11}L${hi} ${H - 11}L${hi} ${H}L${ho} ${H}Z" fill="${darken(c, 0.1)}" stroke="${darken(c, 0.45)}" stroke-width=".8"/>` +
      seamLine(`M${ho + 4} ${H - 10}V${H}M${ho + 9} ${H - 10}V${H}M${ho + 14} ${H - 10}V${H}`, c, 0.25);
  }
  if (H > 380) {
    half += seamLine(`M${ho + 8} 366q8 4 16 0`, c, 0.2) + seamLine(`M${ho + 10} 372q7 3 14 0`, c, 0.14);
  }

  return isBack
    ? mirrorHalf(half) + seamLine('M130.5 206V282', c, 0.32, 1.2)
    : mirrorHalf(half) + seamLine('M130.5 216V250', c, 0.3) + drawButton(126, 210, c);
}

function drawShoe(item, opts, side = 'front') {
  const isBack = side === 'back';
  const c = item.col;
  const k = opts.k;
  const sneakerBody =
    'M101 428C101 420 108 417 114 417C121 417 126 421 126 427L128 448C128 456 122 460 114 460C104 460 98 456 99 448Z';
  const lowBody =
    'M99 450C98 440 104 434 113 434C122 434 128 440 127 450C127 457 122 460 113 460C104 460 99 457 99 450Z';
  const sole = `<path d="M99 452C100 460 106 462 114 462C122 462 127 460 128 452" fill="none" stroke="${
    k === 'sneak' ? '#fffdfa' : darken(c, 0.45)
  }" stroke-width="3" stroke-linecap="round"/>`;

  let s = '';
  if (isBack) {
    if (k === 'boot') {
      s =
        fillFabric(
          'M102 402L120 402L121 424C126 430 128 444 128 452C128 460 122 462 114 462C104 462 98 460 99 450C99 440 101 430 102 424Z',
          item
        ) +
        seamLine('M111 402V452', c, 0.35, 1.3) +
        `<rect x="108" y="398" width="6" height="6" rx="2" fill="${darken(c, 0.2)}"/>` +
        sole;
    } else if (k === 'sneak') {
      s =
        fillFabric(sneakerBody, item) +
        `<path d="M104 426h19v22h-19z" fill="${lighten(c, 0.25)}" opacity=".35"/>` +
        seamLine('M113.5 418V450', c, 0.3, 1.2) +
        `<rect x="110" y="413" width="7" height="5" rx="2" fill="${lighten(c, 0.55)}" stroke="${darken(c, 0.3)}" stroke-width=".6"/>` +
        sole;
    } else if (k === 'heel') {
      s =
        fillFabric(
          'M102 434C104 427 122 427 125 434L126 446C125 452 103 452 101 446Z',
          item
        ) +
        `<rect x="111.5" y="448" width="4" height="17" rx="1.5" fill="${darken(c, 0.42)}"/>` +
        seamLine('M103 428C108 424 119 424 124 428', c, 0.5, 1.6);
    } else if (k === 'plat') {
      s =
        fillFabric(lowBody, item) +
        seamLine('M113 434V452', c, 0.35) +
        seamLine('M100 426C106 423 120 423 126 426', c, 0.5, 2) +
        `<path d="M99 452C100 463 106 466 114 466C122 466 127 463 128 452Z" fill="${lighten(c, 0.55)}" stroke="${darken(c, 0.4)}" stroke-width=".9"/>`;
    } else {
      s =
        fillFabric(lowBody, item) +
        seamLine('M113 434V452', c, 0.32) +
        (k === 'mj' || k === 'sand' ? seamLine('M101 426C106 423 120 423 125 426', c, 0.55, 2) : '') +
        sole;
    }
    return `<g transform="translate(-2 0)">${mirrorHalf(s)}</g>`;
  }

  if (k === 'sneak') {
    s =
      fillFabric(sneakerBody, item) +
      `<path d="M99.5 446C101 436 125 436 127.5 446L128 449C122 455 105 455 99 449Z" fill="${lighten(c, 0.6)}" stroke="${darken(c, 0.25)}" stroke-width=".7"/>` +
      seamLine('M106 422h16M105 426h18M104 430h20', c, 0.3, 1.6) +
      sole;
  } else if (k === 'mj') {
    s = fillFabric(lowBody, item) + seamLine('M99.5 441C105 438 121 438 126.5 441', c, 0.5, 2.4) + drawButton(121, 440, c) + sole;
  } else if (k === 'ballet') {
    s =
      fillFabric(lowBody, item) +
      seamLine('M101 442C106 438 120 438 125 442', c, 0.45, 1.4) +
      `<circle cx="113" cy="440" r="2.4" fill="${lighten(c, 0.2)}" stroke="${darken(c, 0.5)}" stroke-width=".6"/>` +
      sole;
  } else if (k === 'loaf') {
    s =
      fillFabric(
        'M100 430C100 422 108 420 114 420C121 420 126 423 126 430L128 448C128 456 122 460 114 460C104 460 98 456 99 448Z',
        item
      ) +
      `<path d="M100 436C106 433 122 433 126 436L126 441C122 438 106 438 100 441Z" fill="${lighten(c, 0.15)}" stroke="${darken(c, 0.4)}" stroke-width=".7"/><rect x="111" y="435" width="6" height="4" fill="#d4af5a" stroke="#8a6a2a" stroke-width=".5"/>` +
      sole;
  } else if (k === 'sand') {
    s =
      fillFabric('M101 444C101 438 125 438 125 444L127 452C127 458 121 461 113 461C105 461 99 458 100 452Z', item) +
      seamLine('M101 440C108 436 120 436 127 440M103 424C110 427 118 427 124 424M113 427V440', c, 0.6, 2.4) +
      drawButton(122, 425, c);
  } else if (k === 'boot') {
    s =
      fillFabric(
        'M102 402L120 402L121 424C126 430 128 444 128 452C128 460 122 462 114 462C104 462 98 460 99 450C99 440 101 430 102 424Z',
        item
      ) +
      seamLine('M102 410L120 410', c, 0.3, 1.2) +
      seamLine('M111 412V440', c, 0.18) +
      sole;
  } else if (k === 'heel') {
    s =
      fillFabric('M102 436C104 430 111 428 114 428C118 428 124 430 126 436C128 446 122 458 114 466C106 458 100 446 102 436Z', item) +
      seamLine('M104 438C110 434 120 434 125 438', c, 0.35, 1.2);
  } else if (k === 'plat') {
    s =
      fillFabric(lowBody, item) +
      seamLine('M99.5 441C105 438 121 438 126.5 441', c, 0.55, 2.5) +
      `<path d="M99 452C100 463 106 466 114 466C122 466 127 463 128 452Z" fill="${lighten(c, 0.55)}" stroke="${darken(c, 0.4)}" stroke-width=".9"/>` +
      drawButton(113, 440, c);
  } else if (k === 'mule') {
    s =
      fillFabric(lowBody, item) +
      `<path d="M113 440C106 434 103 442 111 443ZM113 440C120 434 123 442 115 443Z" fill="${lighten(c, 0.3)}" stroke="${darken(c, 0.45)}" stroke-width=".7"/>` +
      sole;
  }

  return `<g transform="translate(-2 0)">${mirrorHalf(s)}</g>`;
}

function drawDress(item, side = 'front') {
  const isBack = side === 'back';
  const c = item.col;
  let markup = drawSkirt(item, { ...item, dress: 1 }, side);
  markup += drawTop(
    item,
    {
      t: item.t || 0,
      h: 212,
      nk: item.nk || 'crew',
      puff: item.puff,
      collar: item.collar,
      btn: item.btn,
      bow: item.bow,
      jean: 0,
    },
    side
  );

  if (item.belt) {
    markup +=
      `<path d="M104 206Q117 209 130.5 207L130.5 213Q117 215 103 212Z" fill="${darken(c, 0.25)}" stroke="${darken(c, 0.55)}" stroke-width=".6"/>` +
      `<g transform="translate(260 0) scale(-1 1)"><path d="M104 206Q117 209 130.5 207L130.5 213Q117 215 103 212Z" fill="${darken(c, 0.25)}" stroke="${darken(c, 0.55)}" stroke-width=".6"/></g>`;
    if (isBack) {
      markup += `<path d="M130 207C119 199 114 211 126 212ZM130 207C141 199 146 211 134 212Z" fill="${darken(
        c,
        0.15
      )}" stroke="${darken(c, 0.5)}" stroke-width=".7"/><path d="M128 212L123 229M132 212L137 229" stroke="${darken(
        c,
        0.35
      )}" stroke-width="1.6" stroke-linecap="round"/>`;
    } else {
      markup += `<rect x="125.5" y="206" width="9" height="7" rx="1.5" fill="none" stroke="${GOLD_STITCH}" stroke-width="1.2"/>`;
    }
  }

  return markup;
}

export function drawGarment(item, side = 'front') {
  if (item.cat === 'shoes') return drawShoe(item, item, side);
  if (item.cat === 'dress') return drawDress(item, side);
  if (item.cat === 'bottom') {
    return item.k === 'skirt' ? drawSkirt(item, item, side) : drawPants(item, item, side);
  }
  return drawTop(item, item, side);
}

/* Mannequin Silhouette */
const TORSO_PATH =
  'M130 86L120 88C104 91 88 95 81 104C84 124 94 138 97 150C100 175 104 190 104 205C104 225 97 243 92 258C90 272 91 282 98 292L130 292Z';
const ARM_PATH =
  'M81 103C70 112 66 140 62 176C60 200 57 222 56 238C55 248 60 254 65 250C70 244 69 240 70 236C76 214 84 192 91 170C96 156 99 144 97 130Z';
const LEG_PATH =
  smoothCurve([
    [94, 268],
    [91, 320],
    [100, 375],
    [99, 398],
    [105, 425],
  ]) +
  smoothCurve([
    [116, 425],
    [119, 400],
    [123, 372],
    [127, 330],
    [130, 292],
  ]).replace('M', 'L') +
  'Z';
const FOOT_PATH = 'M104 422L117 422C119 436 121 450 118 458C112 462 106 460 104 452Z';

const BODY_DEFS = `<linearGradient id="sk" gradientUnits="userSpaceOnUse" x1="60" x2="200"><stop offset="0" stop-color="#d9a995"/><stop offset=".5" stop-color="#f8e1d4"/><stop offset="1" stop-color="#d9a995"/></linearGradient><ellipse cx="130" cy="464" rx="48" ry="5" fill="#8a5a4a" opacity=".2"/>`;
const BODY_BASE_LIMBS =
  mirrorHalf(`<path d="${LEG_PATH}" fill="url(#sk)"/><path d="${FOOT_PATH}" fill="url(#sk)"/><path d="${TORSO_PATH}" fill="url(#sk)"/>`) +
  `<rect x="122" y="60" width="16" height="32" rx="6" fill="url(#sk)"/>` +
  mirrorHalf(`<path d="${ARM_PATH}" fill="url(#sk)"/><ellipse cx="62" cy="251" rx="7" ry="9" fill="url(#sk)"/>`);

const BODY_FRONT_HEAD =
  BODY_BASE_LIMBS +
  `<ellipse cx="130" cy="38" rx="21" ry="27" fill="#f6dccf"/><ellipse cx="130" cy="69" rx="12" ry="4" fill="#b88676" opacity=".25"/><path d="M125 52q5 3 10 0" stroke="#c98a8a" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M107 40C104 8 156 6 153 40C153 56 150 64 146 68C152 46 144 24 130 24C116 24 108 46 114 68C110 64 107 56 107 40Z" fill="#3a2a2a"/>`;

const BODY_BACK_HEAD =
  BODY_BASE_LIMBS +
  mirrorHalf(
    `<path d="M113 114Q107 132 115 148" fill="none" stroke="#b88676" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"/><path d="M104 352Q111 356 119 352" fill="none" stroke="#b88676" stroke-opacity=".24" stroke-width="1.1" stroke-linecap="round"/>`
  ) +
  `<path d="M130 92V195" stroke="#b88676" stroke-opacity=".22" stroke-width="1.1" stroke-linecap="round"/>` +
  `<path d="M106 38C104 8 156 6 154 38C154 58 148 70 130 70C112 70 106 58 106 38Z" fill="#3a2a2a"/>` +
  `<path d="M115 24Q130 18 145 24M113 38Q130 33 147 38" fill="none" stroke="#5a4444" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>`;

const BODY_GROUP = BODY_FRONT_HEAD;

/**
 * Render complete mannequin SVG dressed in the supplied worn slots.
 * @param {Record<string, [number, number]>} wornMap
 * @param {{ includeBackdrop?: boolean, animatedSlot?: string, side?: 'front' | 'back' }} [options]
 * @returns {string}
 */
export function renderMannequinOutfitSVG(wornMap, options = {}) {
  const { includeBackdrop = false, animatedSlot = '', side = 'front' } = options;
  let defs = '';
  let layers = '';

  for (const slot of ['shoes', 'bottom', 'dress', 'top', 'outer']) {
    const entry = wornMap[slot];
    if (!entry) continue;
    const item = getItemWithColor(entry[0], entry[1]);
    if (!item) continue;
    defs += buildFabricDefs(item);
    const cls = slot === animatedSlot ? 'garment-pop' : '';
    layers += `<g class="${cls}">${drawGarment(item, side)}</g>`;
  }

  const bodyMarkup = side === 'back' ? BODY_BACK_HEAD : BODY_FRONT_HEAD;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 470" width="260" height="470" role="img" aria-label="Styleverse mannequin preview (${side})"><defs>${SHARED_DEFS}${defs}</defs>${
    includeBackdrop ? '<rect width="260" height="470" fill="#f9d3dd"/>' : ''
  }${BODY_DEFS}${bodyMarkup}${layers}</svg>`;
}

/**
 * Return cached thumbnail data URI for a catalog garment item.
 * @param {number} itemId
 * @param {number} [colorIndex=0]
 * @param {'front' | 'back'} [side='front']
 * @returns {string}
 */
export function getGarmentThumbnailUri(itemId, colorIndex = 0, side = 'front') {
  const key = `${itemId}-${colorIndex}-${side}`;
  if (THUMB_CACHE.has(key)) return THUMB_CACHE.get(key);
  const item = getItemWithColor(itemId, colorIndex);
  if (!item) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CATEGORY_VIEWBOXES[item.cat]}"><defs>${SHARED_DEFS}${buildFabricDefs(
    item
  )}</defs>${drawGarment(item, side)}</svg>`;
  const uri = svgToDataUri(svg);
  THUMB_CACHE.set(key, uri);
  return uri;
}

const SCENE_PALETTES = {
  terrace: { bgTop: '#fdf0f3', bgBot: '#f5dce2', arch: '#fffaf4', accent: '#d998ad', floor: '#edd9c6' },
  city: { bgTop: '#edf1f5', bgBot: '#dfe6ee', arch: '#f9fafc', accent: '#9fb4cb', floor: '#e2dcd4' },
  campus: { bgTop: '#f5efe4', bgBot: '#eadcc7', arch: '#fffaf0', accent: '#b7906e', floor: '#dfd0ba' },
  cafe: { bgTop: '#f8ece4', bgBot: '#eed9ce', arch: '#fff9f4', accent: '#c98879', floor: '#e7d2c4' },
  coastal: { bgTop: '#e9f4f8', bgBot: '#d3e8f0', arch: '#fbfdfe', accent: '#8cb8cc', floor: '#f2e4cf' },
  minimal: { bgTop: '#f6f3ee', bgBot: '#eae4db', arch: '#ffffff', accent: '#b5aca0', floor: '#e4ddd2' },
  modest: { bgTop: '#f4efe9', bgBot: '#e8dfd6', arch: '#fffcf7', accent: '#b79e8d', floor: '#e3d5c6' },
  formal: { bgTop: '#f7e9ee', bgBot: '#ebd3dc', arch: '#fff9fb', accent: '#c8839d', floor: '#e7d4dc' },
  garden: { bgTop: '#eff4ec', bgBot: '#dfeadb', arch: '#fcfdf9', accent: '#95b28b', floor: '#e3e8d8' },
};

/**
 * Render an editorial 3:4 fashion illustration portrait for a curated Look.
 * Completely self-contained (zero external image host dependencies).
 * @param {{ id: number, name: string, scene?: string, outfitSpec: Record<string, [number, number]> }} look
 * @returns {string}
 */
export function renderEditorialLookUri(look) {
  const key = `look-${look.id}`;
  if (EDITORIAL_CACHE.has(key)) return EDITORIAL_CACHE.get(key);

  const pal = SCENE_PALETTES[look.scene] || SCENE_PALETTES.terrace;
  let defs = '';
  let layers = '';

  for (const slot of ['shoes', 'bottom', 'dress', 'top', 'outer']) {
    const entry = look.outfitSpec?.[slot];
    if (!entry) continue;
    const item = getItemWithColor(entry[0], entry[1]);
    if (!item) continue;
    defs += buildFabricDefs(item);
    layers += `<g>${drawGarment(item)}</g>`;
  }

  const sceneDecor =
    look.scene === 'coastal'
      ? `<rect x="0" y="290" width="300" height="40" fill="#c7e0eb" opacity=".6"/><path d="M0 328 H300 V400 H0 Z" fill="${pal.floor}"/>`
      : look.scene === 'garden'
      ? `<path d="M22 40 Q58 68 48 118" fill="none" stroke="${pal.accent}" stroke-width="2" opacity=".6"/><circle cx="38" cy="64" r="9" fill="#e8b8c9" opacity=".6"/><circle cx="54" cy="84" r="7" fill="#fff" opacity=".75"/><path d="M0 330 H300 V400 H0 Z" fill="${pal.floor}"/>`
      : look.scene === 'cafe'
      ? `<circle cx="248" cy="285" r="24" fill="${pal.arch}" stroke="${pal.accent}" stroke-width="1.2" opacity=".8"/><path d="M248 309 V355 M232 355 H264" stroke="${pal.accent}" stroke-width="1.5" opacity=".7"/><path d="M0 332 H300 V400 H0 Z" fill="${pal.floor}"/>`
      : `<path d="M0 332 H300 V400 H0 Z" fill="${pal.floor}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
    <defs>
      <linearGradient id="bg_${look.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pal.bgTop}"/>
        <stop offset="1" stop-color="${pal.bgBot}"/>
      </linearGradient>
      ${SHARED_DEFS}
      ${defs}
    </defs>
    <rect width="300" height="400" fill="url(#bg_${look.id})"/>
    <path d="M36 332 V138 A114 114 0 0 1 264 138 V332 Z" fill="${pal.arch}" stroke="${pal.accent}" stroke-width="1.2" stroke-opacity=".45"/>
    <path d="M46 332 V142 A104 104 0 0 1 254 142 V332 Z" fill="none" stroke="${pal.accent}" stroke-width=".8" stroke-dasharray="3 4" stroke-opacity=".4"/>
    ${sceneDecor}
    <g transform="translate(20 12) scale(1)">
      ${BODY_DEFS}
      ${BODY_GROUP}
      ${layers}
    </g>
    <rect x="10" y="10" width="280" height="380" fill="none" stroke="${pal.accent}" stroke-opacity=".35" stroke-width="1"/>
  </svg>`;

  const uri = svgToDataUri(svg);
  EDITORIAL_CACHE.set(key, uri);
  return uri;
}

/**
 * Shared dress form illustration markup used in hero and CTA band.
 * @param {string} className
 * @returns {string}
 */
export function renderDressFormSVG(className = '') {
  return `<svg class="${className}" viewBox="0 0 100 190" aria-hidden="true">
    <defs>
      <pattern id="dressform-grid" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 0H7M0 0V7" stroke="#2a1a1a" stroke-width=".8"/>
      </pattern>
    </defs>
    <path d="M30 20C30 6 70 6 70 20C70 35 88 45 80 110C78 125 82 138 60 145L40 145C18 138 22 125 20 110C12 45 30 35 30 20Z" fill="url(#dressform-grid)" stroke="#2a1a1a" stroke-width="2"/>
    <path d="M50 145V176M30 188C36 176 64 176 70 188Z" stroke="#2a1a1a" stroke-width="3" fill="#2a1a1a"/>
  </svg>`;
}

/**
 * Export current dressed mannequin look as a high-resolution PNG file.
 * @param {Record<string, [number, number]>} wornMap
 * @param {'front' | 'back'} [side='front']
 * @returns {Promise<void>}
 */
export function exportOutfitPng(wornMap, side = 'front') {
  return new Promise((resolve, reject) => {
    const svgString = renderMannequinOutfitSVG(wornMap, { includeBackdrop: true, side });
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 780;
        canvas.height = 1410;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context unavailable');
        }
        ctx.drawImage(img, 0, 0, 780, 1410);

        const link = document.createElement('a');
        link.download = 'styleverse-look.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
