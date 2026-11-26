// Interim enamel plates. An approved painting replaces the complete image window.
import { isUnit } from "../data/cards.ts";
import type { Card } from "../data/cards.ts";
type Ctx = CanvasRenderingContext2D;
const palettes: Record<string, string[]> = {
  horse_archer: ["#182f31", "#42665e", "#daac65", "#f1d093"],
  cavalry: ["#242f3d", "#53647d", "#c4a06d", "#eee0b1"],
  knight: ["#2c2738", "#6c536e", "#caa270", "#f1d7af"],
  swordsman: ["#3a2424", "#865448", "#d8a967", "#f6d898"],
  pikeman: ["#272e26", "#63714d", "#c5a768", "#ebe3ac"],
  archer: ["#183332", "#487268", "#d9ab65", "#f3d599"],
  lancer: ["#35282b", "#836057", "#cf9863", "#efd6a5"],
};
function path(c: Ctx, d: string, fill: string, stroke?: string, width = 1) {
  const p = new Path2D(d);
  c.fillStyle = fill;
  c.fill(p);
  if (stroke) {
    c.lineWidth = width;
    c.strokeStyle = stroke;
    c.stroke(p);
  }
}
function line(c: Ctx, points: number[][], colour: string, w = 1) {
  c.beginPath();
  for (const [i, p] of points.entries())
    i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
  c.strokeStyle = colour;
  c.lineWidth = w;
  c.stroke();
}
function disc(c: Ctx, x: number, y: number, r: number, colour: string) {
  c.fillStyle = colour;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function peaks(
  c: Ctx,
  width: number,
  height: number,
  base: number,
  amp: number,
  seed: number,
  color: string,
) {
  c.beginPath();
  c.moveTo(0, height);
  for (let x = 0; x <= width + 4; x += 4) {
    const y =
      base +
      amp *
        (Math.sin(x * 0.009 + seed) +
          0.5 * Math.sin(x * 0.025 + seed * 3) +
          0.24 * Math.cos(x * 0.047 + seed) +
          0.1 * Math.cos(x * 0.093));
    c.lineTo(x, y);
  }
  c.lineTo(width, height);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function castle(c: Ctx, x: number, y: number, scale: number, ink: string) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  path(
    c,
    "M-132 24 L-132 -13 -126 -13 -126 -18 -121 -18 -121 -13 -106 -13 -106 -46 -101 -46 -101 -53 -97 -53 -97 -46 -92 -46 -92 -53 -88 -53 -88 -46 -82 -46 -82 -21 -56 -29 -56 -66 -65 -66 -46 -96 -29 -66 -36 -66 -36 -32 -18 -34 -18 -78 -22 -78 -22 -86 -14 -86 -14 -91 -8 -91 -8 -86 -1 -86 -1 -91 5 -91 5 -86 13 -86 13 -78 9 -78 9 -32 24 -21 24 -53 19 -53 34 -77 49 -53 44 -53 44 -21 72 -18 72 -34 77 -34 77 -40 82 -40 82 -34 89 -34 89 -40 94 -40 94 -34 99 -34 99 -8 124 -3 124 26 Z",
    ink,
  );
  line(
    c,
    [
      [-46, -96],
      [-46, -118],
    ],
    ink,
    2,
  );
  path(c, "M-46 -118 q11 -4 23 2 q-10 1 -23 5Z", ink);
  c.restore();
}
export function landscape(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1500;
  canvas.height = 740;
  const c = canvas.getContext("2d")!;
  const sky = c.createLinearGradient(0, 0, 0, 740);
  sky.addColorStop(0, "#142323");
  sky.addColorStop(0.43, "#687568");
  sky.addColorStop(0.72, "#d4a575");
  sky.addColorStop(1, "#354441");
  c.fillStyle = sky;
  c.fillRect(0, 0, 1500, 740);
  const x = 1160,
    y = 234;
  disc(c, x, y, 61, "#d7ba83");
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = "rgba(233,207,151,.14)";
    c.beginPath();
    c.arc(x, y, 73 + i * 15, 0, Math.PI * 2);
    c.stroke();
  }
  peaks(c, 1500, 740, 413, 66, 6, "#778273");
  peaks(c, 1500, 740, 457, 48, 1, "#596d64");
  castle(c, 1260, 443, 1.36, "#536259");
  peaks(c, 1500, 740, 534, 49, 3, "#3d544d");
  castle(c, 829, 518, 0.75, "#3a4e48");
  peaks(c, 1500, 740, 611, 60, 18, "#263c37");
  for (let i = 0; i < 180; i++) {
    const px = (i * 151) % 1500,
      py = 643 + Math.cos(i * 2.61) * 45;
    line(
      c,
      [
        [px, py],
        [px + 8 + (i % 25), py - 2],
      ],
      "rgba(178,173,122,.09)",
    );
  }
  return canvas;
}
function horse(c: Ctx, ink: string, lit: string, accent: string) {
  // A collected horse in profile, with a high arched neck and separate near/far legs.
  path(
    c,
    "M92 204 Q74 216 76 238 L72 256 63 260 66 265 81 261 88 242 105 217 M157 201 L161 224 176 241 170 248 175 251 184 242 172 219 176 198Z",
    ink,
    lit,
    1.6,
  );
  path(
    c,
    "M77 192 Q60 184 51 196 Q42 211 31 213 Q44 215 49 209 Q44 219 30 224 Q49 225 62 207 Q69 199 81 204 Z",
    ink,
    lit,
    1.4,
  );
  path(
    c,
    "M79 190 Q87 177 108 181 Q129 185 147 177 Q166 166 172 147 L183 126 187 114 191 126 200 117 197 133 Q211 144 212 150 L226 163 222 170 211 168 197 162 187 162 Q187 182 175 196 L159 214 149 234 153 255 160 260 157 264 144 260 140 232 145 212 Q126 220 102 214 L89 222 78 233 65 249 64 259 58 261 55 251 67 231 77 216 Q71 201 79 190Z",
    ink,
    lit,
    2.5,
  );
  path(
    c,
    "M162 172 Q167 148 182 127 L180 137 174 143 175 149 168 156 169 161Z",
    accent,
  );
  line(
    c,
    [
      [190, 144],
      [197, 150],
      [211, 159],
      [219, 160],
    ],
    accent,
    1.8,
  );
  disc(c, 199, 146, 1.8, lit);
  line(
    c,
    [
      [214, 165],
      [196, 164],
      [178, 175],
      [155, 175],
    ],
    lit,
    1.2,
  );
  path(
    c,
    "M100 184 Q116 191 146 180 L141 200 119 210 99 198 Z",
    accent,
    lit,
    1.2,
  );
  line(
    c,
    [
      [103, 193],
      [119, 203],
      [139, 194],
    ],
    ink,
    2,
  );
  line(
    c,
    [
      [82, 198],
      [93, 197],
      [104, 200],
    ],
    accent,
    1.5,
  );
}
function rider(c: Ctx, kind: string, ink: string, lit: string, accent: string) {
  path(
    c,
    "M122 133 Q115 146 104 151 L90 163 111 160 99 171 125 163 138 147 Z",
    accent,
    lit,
    1.6,
  );
  path(
    c,
    "M120 126 Q128 122 135 127 L145 153 158 160 172 154 175 158 160 168 142 162 140 176 150 184 147 199 137 214 142 218 130 221 128 217 136 199 137 188 117 181 111 171 118 145Z",
    ink,
    lit,
    2,
  );
  path(
    c,
    "M122 128 L120 115 Q119 104 130 102 Q141 103 141 113 L145 118 140 121 137 130 131 133Z",
    ink,
    lit,
    1.8,
  );
  path(
    c,
    "M116 114 Q117 101 125 99 L129 92 133 99 Q142 101 144 111Z",
    accent,
    lit,
    1.6,
  );
  line(
    c,
    [
      [122, 141],
      [132, 144],
      [137, 157],
    ],
    accent,
    2,
  );
  if (kind === "horse_archer") {
    path(
      c,
      "M164 101 Q184 124 176 145 Q177 163 162 181 Q185 153 182 140 Q187 119 164 101Z",
      lit,
    );
    line(
      c,
      [
        [164, 101],
        [150, 139],
        [162, 181],
      ],
      lit,
      1.2,
    );
    line(
      c,
      [
        [137, 140],
        [198, 133],
      ],
      lit,
      1.6,
    );
    path(c, "M194 131 L203 132 195 137Z", lit);
    line(
      c,
      [
        [131, 146],
        [145, 151],
        [159, 140],
        [176, 137],
      ],
      lit,
      3,
    );
    line(
      c,
      [
        [100, 159],
        [105, 127],
        [112, 120],
      ],
      accent,
      4,
    );
  } else if (kind === "knight") {
    path(
      c,
      "M123 144 L139 140 149 146 145 163 136 174 126 167Z",
      accent,
      lit,
      2,
    );
    line(
      c,
      [
        [157, 152],
        [175, 118],
      ],
      lit,
      3,
    );
  } else {
    line(
      c,
      [
        [139, 189],
        [182, 74],
      ],
      lit,
      2.7,
    );
    path(c, "M179 81 L185 61 185 82Z", lit);
    if (kind === "cavalry")
      path(c, "M181 78 Q164 70 153 83 Q167 80 172 89Z", accent, lit, 1);
  }
}
function foot(c: Ctx, kind: string, ink: string, lit: string, accent: string) {
  path(
    c,
    "M116 143 Q107 163 93 172 L73 213 111 194 124 157Z",
    accent,
    lit,
    1.8,
  );
  path(
    c,
    "M118 125 L116 111 Q118 98 130 97 Q142 97 143 110 L147 116 141 118 139 130 131 136Z",
    ink,
    lit,
    2,
  );
  path(
    c,
    "M110 113 Q112 98 125 94 L131 86 135 95 Q146 98 148 109Z",
    accent,
    lit,
    2,
  );
  path(
    c,
    "M119 134 L135 132 148 149 151 169 166 160 171 164 153 181 141 174 144 197 153 216 145 220 151 249 159 253 158 258 142 257 134 226 129 211 120 228 111 252 115 257 97 257 99 251 107 226 110 206 101 209 111 179 109 150Z",
    ink,
    lit,
    2.4,
  );
  path(c, "M109 177 L141 176 148 199 132 205 109 199Z", accent, lit, 1.3);
  line(
    c,
    [
      [116, 149],
      [134, 155],
      [139, 166],
    ],
    accent,
    2.5,
  );
  line(
    c,
    [
      [113, 180],
      [140, 180],
    ],
    ink,
    3,
  );
  if (kind === "archer") {
    path(
      c,
      "M167 99 Q199 144 177 178 Q172 196 161 202 Q187 163 181 145 Q183 122 167 99Z",
      lit,
    );
    line(
      c,
      [
        [167, 99],
        [145, 153],
        [161, 202],
      ],
      lit,
    );
    line(
      c,
      [
        [134, 155],
        [205, 147],
      ],
      lit,
      2,
    );
    path(c, "M200 144 L211 146 201 151Z", lit);
    line(
      c,
      [
        [120, 147],
        [140, 158],
        [163, 151],
        [182, 150],
      ],
      lit,
      3,
    );
  } else if (kind === "pikeman") {
    line(
      c,
      [
        [145, 239],
        [183, 76],
      ],
      lit,
      3,
    );
    path(c, "M179 85 L186 59 187 84 182 91Z", lit);
  } else {
    path(c, "M96 151 L111 147 125 152 124 176 111 191 99 182Z", accent, lit, 2);
    path(c, "M163 161 L181 114 186 107 185 118 168 165Z", lit);
    line(
      c,
      [
        [158, 161],
        [174, 167],
      ],
      lit,
      3,
    );
  }
}
const cache = new Map<string, string>();
export function plate(kind: Card): string {
  const known = cache.get(kind);
  if (known) return known;
  const cv = document.createElement("canvas");
  cv.width = 520;
  cv.height = 728;
  const c = cv.getContext("2d")!;
  c.scale(2, 2);
  const [ink, mid, accent, lit] = palettes[kind] ?? [
    "#282b36",
    "#576375",
    "#b6a487",
    "#ecd4a5",
  ];
  const g = c.createLinearGradient(0, 0, 210, 315);
  g.addColorStop(0, ink);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, ink);
  c.fillStyle = g;
  c.fillRect(0, 0, 260, 364);
  const x = 141,
    y = 130;
  disc(c, x, y, 57, accent);
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(x, y, 62 + i * 4, 0, Math.PI * 2);
    c.lineWidth = 0.8;
    c.strokeStyle = lit;
    c.globalAlpha = 0.52;
    c.stroke();
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    line(
      c,
      [
        [x + Math.cos(a) * 73, y + Math.sin(a) * 73],
        [
          x + Math.cos(a) * (i % 3 ? 76 : 86),
          y + Math.sin(a) * (i % 3 ? 76 : 86),
        ],
      ],
      accent,
      0.7,
    );
  }
  peaks(c, 260, 364, 209, 22, 2, mid);
  castle(c, 207, 204, 0.29, ink + "aa");
  peaks(c, 260, 364, 238, 26, 4, ink + "aa");
  peaks(c, 260, 364, 277, 13, 1, ink);
  for (let i = 0; i < 80; i++) {
    const px = (i * 41) % 250,
      py = 271 + ((i * 17) % 80);
    line(
      c,
      [
        [px, py],
        [px + 3 + (i % 12), py - 1 - (i % 4)],
      ],
      accent + "62",
      0.7,
    );
  }
  if (isUnit(kind)) {
    const isMounted = ["cavalry", "horse_archer", "lancer", "knight"].includes(
      kind,
    );
    if (isMounted) {
      horse(c, ink, lit, accent);
      rider(c, kind, ink, lit, accent);
    } else foot(c, kind, ink, lit, accent);
  } else {
    c.save();
    c.translate(130, 165);
    c.rotate(Math.PI / 4);
    c.fillStyle = ink;
    c.fillRect(-39, -39, 78, 78);
    c.strokeStyle = lit;
    c.strokeRect(-35, -35, 70, 70);
    c.restore();
    const symbols: Record<string, string> = {
      resupply: "+",
      shield_screen: "⬟",
      field_rest: "✚",
      fort_rally: "♜",
      scout_ledger: "◎",
      change_standard: "⇄",
    };
    c.fillStyle = lit;
    c.textAlign = "center";
    c.font = "44px Georgia, serif";
    c.fillText(symbols[kind], 130, 179);
  }
  const src = cv.toDataURL("image/webp", 0.9);
  cache.set(kind, src);
  return src;
}
