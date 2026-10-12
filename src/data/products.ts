/**
 * Product data for the NEXMOTION concept demo.
 *
 * Every number here is tagged with where it came from:
 *  - "catalog"  : value printed in the source catalog (spec block, drawing dimension, or reference-RPM table)
 *  - "drawing"  : measured from a catalog dimension drawing by scaling against a printed dimension
 *                 (used only to proportion the 3D model — never shown as a specification)
 *  - "concept"  : not in the catalog; a visual assumption for the 3D scene
 *
 * Public names (AXIS 08 / 10 / 15) are fictional. The mapping to source model numbers is kept
 * outside this repository on purpose.
 */

export type Source = 'catalog' | 'drawing' | 'concept'

export type Suit = 'good' | 'fair' | 'no'

export interface MotorType {
  id: 'A' | 'B' | 'C' | 'D'
  /** kW, catalog */
  powerKw: number
  /** N·m, catalog (listed next to output in the spec block) */
  torqueNm: number
  /** rpm at maximum output, catalog */
  rpmAtMaxOutput: number
  /** free (unloaded) rotation speed, catalog */
  rpmFree: number
  /** Reference no-load RPM table (no shaft/propeller), catalog */
  noLoad: {
    p03: { rpm: number; airLpm: number }
    p06: { rpm: number; airLpm: number }
  }
}

export interface Product {
  id: 'axis08' | 'axis10' | 'axis15'
  name: string
  code: string
  tagline: string
  taglineJa: string
  category: string
  catalogPages: string
  accent: string
  /** catalog spec block */
  maxPressureMPa: number
  maxAirLpm: number
  motors: MotorType[]
  shaft: { diameterMm: number; lengthMm: number; material: string }
  propeller: { blades: number; diameterMm: number; material: string; label: string }
  shaftFixing: { kind: 'chuck' | 'setbolt'; label: string; note: string }
  stand: { type: string; label: string }
  arm: { diameterMm: number; lengthMm: number; reachMm: number }
  /** catalog drawing dimensions (mm) */
  drawing: {
    variantLabel: string
    totalHeightMm: number
    inletHeightMm: number // shown in parentheses in the drawing
    reducerTopMm: number
    shaftToReducerEdgeMm: number
    shaftToArmMountMm: number
  }
  /** drawing-derived proportions for the 3D model only */
  geom: {
    motorOffsetMm: number
    housingRightMm: number
    housingDepthMm: number
    housingBottomMm: number
    bossTopMm: number
    bossDiaMm: number
    fixingHeightMm: number
    fixingDiaMm: number
    motorBaseDiaMm: number
    motorBaseTopMm: number
    neckDiaMm: number
    neckTopMm: number
    bodyDiaMm: number
    bodyTopMm: number
    armYMm: number
    valve: 'needle' | 'ball'
  }
  suitability: {
    mixing: Suit
    antiSettling: Suit
    highViscosity: Suit
    dispersion: Suit
    emulsification: Suit
  }
  mounting: { arm: Suit; clamp: Suit; ferrule: Suit; flange: Suit }
  fixingOptions: { setbolt: Suit; chuck: Suit; etp: Suit }
  /** Highlighted range of the liquid-volume bar (read from the catalog graphic) */
  volumeBand: { from: number; to: number; label: string }
  /** Selection chart (catalog p.05): liquid volume / mounting / speed class */
  selectionChart: string
  reducerMaterial: string
  motorMaterial: string
  chuckMaterial: string | null
}

export const PRODUCTS: Product[] = [
  {
    id: 'axis08',
    name: 'AXIS 08',
    code: 'NXM-AX08-R',
    tagline: 'Compact bench mixer · φ8 shaft',
    taglineJa: '小容量・アーム式の卓上クラス',
    category: '減速機付き撹拌機 / Geared air-motor mixer',
    catalogPages: 'p.07–08',
    accent: '#3ee6ff',
    maxPressureMPa: 0.63,
    maxAirLpm: 240,
    motors: [
      { id: 'A', powerKw: 0.16, torqueNm: 1.7, rpmAtMaxOutput: 886, rpmFree: 1933, noLoad: { p03: { rpm: 1352, airLpm: 108 }, p06: { rpm: 1806, airLpm: 200 } } },
      { id: 'B', powerKw: 0.16, torqueNm: 4.3, rpmAtMaxOutput: 353, rpmFree: 760, noLoad: { p03: { rpm: 527, airLpm: 109 }, p06: { rpm: 674, airLpm: 201 } } },
      { id: 'C', powerKw: 0.16, torqueNm: 7.2, rpmAtMaxOutput: 213, rpmFree: 466, noLoad: { p03: { rpm: 293, airLpm: 109 }, p06: { rpm: 382, airLpm: 204 } } },
    ],
    shaft: { diameterMm: 8, lengthMm: 500, material: 'SUS304' },
    propeller: { blades: 4, diameterMm: 50, material: 'SUS304', label: '4枚プロペラ φ50' },
    shaftFixing: { kind: 'chuck', label: 'キーレスドリルチャック', note: '材質 SUS' },
    stand: { type: 'U', label: 'U型スタンド' },
    arm: { diameterMm: 15, lengthMm: 233, reachMm: 192 },
    drawing: { variantLabel: 'Motor A / アーム式', totalHeightMm: 233, inletHeightMm: 78, reducerTopMm: 108.5, shaftToReducerEdgeMm: 33, shaftToArmMountMm: 138 },
    geom: {
      motorOffsetMm: 43, housingRightMm: 75, housingDepthMm: 66, housingBottomMm: 72, bossTopMm: 72, bossDiaMm: 26,
      fixingHeightMm: 52, fixingDiaMm: 40, motorBaseDiaMm: 49, motorBaseTopMm: 135, neckDiaMm: 28, neckTopMm: 160,
      bodyDiaMm: 46, bodyTopMm: 205, armYMm: 77, valve: 'needle',
    },
    suitability: { mixing: 'good', antiSettling: 'good', highViscosity: 'fair', dispersion: 'fair', emulsification: 'no' },
    mounting: { arm: 'good', clamp: 'no', ferrule: 'no', flange: 'no' },
    fixingOptions: { setbolt: 'no', chuck: 'good', etp: 'no' },
    volumeBand: { from: 0, to: 20, label: '〜20 L' },
    selectionChart: '〜10 L・アーム（スタンド）・中速',
    reducerMaterial: 'アルミ（無電解ニッケルメッキ処理）',
    motorMaterial: 'SUS',
    chuckMaterial: 'SUS',
  },
  {
    id: 'axis10',
    name: 'AXIS 10',
    code: 'NXM-AX10-R',
    tagline: 'Mid-volume mixer · φ10 shaft',
    taglineJa: '20〜50 L クラス・4種の取付方法に対応',
    category: '減速機付き撹拌機 / Geared air-motor mixer',
    catalogPages: 'p.09–10',
    accent: '#3ee6ff',
    maxPressureMPa: 0.63,
    maxAirLpm: 318,
    motors: [
      { id: 'A', powerKw: 0.27, torqueNm: 3.2, rpmAtMaxOutput: 795, rpmFree: 1775, noLoad: { p03: { rpm: 1116, airLpm: 149 }, p06: { rpm: 1505, airLpm: 269 } } },
      { id: 'B', powerKw: 0.27, torqueNm: 5.4, rpmAtMaxOutput: 480, rpmFree: 1050, noLoad: { p03: { rpm: 674, airLpm: 150 }, p06: { rpm: 925, airLpm: 270 } } },
      { id: 'C', powerKw: 0.26, torqueNm: 10.6, rpmAtMaxOutput: 240, rpmFree: 520, noLoad: { p03: { rpm: 356, airLpm: 157 }, p06: { rpm: 475, airLpm: 274 } } },
      { id: 'D', powerKw: 0.26, torqueNm: 23.6, rpmAtMaxOutput: 105, rpmFree: 240, noLoad: { p03: { rpm: 126, airLpm: 135 }, p06: { rpm: 174, airLpm: 260 } } },
    ],
    shaft: { diameterMm: 10, lengthMm: 600, material: 'SUS304' },
    propeller: { blades: 3, diameterMm: 140, material: 'SUS304', label: '3枚プロペラ φ140' },
    shaftFixing: { kind: 'chuck', label: 'キーレスドリルチャック', note: '材質 SUS' },
    stand: { type: 'V2', label: 'V2型スタンド' },
    arm: { diameterMm: 20, lengthMm: 226, reachMm: 174 },
    drawing: { variantLabel: 'Motor A / アーム式', totalHeightMm: 293.5, inletHeightMm: 62, reducerTopMm: 165.5, shaftToReducerEdgeMm: 47.5, shaftToArmMountMm: 174 },
    geom: {
      motorOffsetMm: 57, housingRightMm: 91, housingDepthMm: 95, housingBottomMm: 116, bossTopMm: 116, bossDiaMm: 64,
      fixingHeightMm: 58, fixingDiaMm: 41, motorBaseDiaMm: 68, motorBaseTopMm: 200, neckDiaMm: 36, neckTopMm: 223,
      bodyDiaMm: 56, bodyTopMm: 276, armYMm: 121, valve: 'ball',
    },
    suitability: { mixing: 'good', antiSettling: 'good', highViscosity: 'fair', dispersion: 'fair', emulsification: 'no' },
    mounting: { arm: 'good', clamp: 'good', ferrule: 'good', flange: 'good' },
    fixingOptions: { setbolt: 'fair', chuck: 'good', etp: 'no' },
    volumeBand: { from: 20, to: 50, label: '20〜50 L' },
    selectionChart: '〜50 L・アーム / クランプ / ヘルール / フランジ・中速',
    reducerMaterial: 'アルミ（無電解ニッケルメッキ処理）',
    motorMaterial: 'SUS',
    chuckMaterial: 'SUS',
  },
  {
    id: 'axis15',
    name: 'AXIS 15',
    code: 'NXM-AX15-R',
    tagline: 'Drum-class mixer · φ15 shaft',
    taglineJa: '100〜200 L クラス・セットボルト固定',
    category: '減速機付き撹拌機 / Geared air-motor mixer',
    catalogPages: 'p.11–12',
    accent: '#3ee6ff',
    maxPressureMPa: 0.63,
    maxAirLpm: 486,
    motors: [
      { id: 'A', powerKw: 0.39, torqueNm: 6.5, rpmAtMaxOutput: 580, rpmFree: 1200, noLoad: { p03: { rpm: 805, airLpm: 239 }, p06: { rpm: 1121, airLpm: 437 } } },
      { id: 'B', powerKw: 0.39, torqueNm: 8.0, rpmAtMaxOutput: 468, rpmFree: 960, noLoad: { p03: { rpm: 691, airLpm: 239 }, p06: { rpm: 971, airLpm: 430 } } },
      { id: 'C', powerKw: 0.38, torqueNm: 16.0, rpmAtMaxOutput: 232, rpmFree: 472, noLoad: { p03: { rpm: 344, airLpm: 243 }, p06: { rpm: 463, airLpm: 437 } } },
      { id: 'D', powerKw: 0.38, torqueNm: 35.5, rpmAtMaxOutput: 104, rpmFree: 208, noLoad: { p03: { rpm: 147, airLpm: 240 }, p06: { rpm: 203, airLpm: 438 } } },
    ],
    shaft: { diameterMm: 15, lengthMm: 1000, material: 'SUS304' },
    propeller: { blades: 3, diameterMm: 200, material: 'SUS304', label: '3枚プロペラ φ200' },
    shaftFixing: { kind: 'setbolt', label: 'セットボルト固定（2-M6）', note: '図面記載 2-M6' },
    stand: { type: 'H2', label: 'H2型スタンド' },
    arm: { diameterMm: 20, lengthMm: 226, reachMm: 174 },
    drawing: { variantLabel: 'Motor B / アーム式', totalHeightMm: 288, inletHeightMm: 87, reducerTopMm: 145, shaftToReducerEdgeMm: 60, shaftToArmMountMm: 213 },
    geom: {
      motorOffsetMm: 79, housingRightMm: 117, housingDepthMm: 120, housingBottomMm: 94, bossTopMm: 94, bossDiaMm: 70,
      fixingHeightMm: 39, fixingDiaMm: 32, motorBaseDiaMm: 74, motorBaseTopMm: 187, neckDiaMm: 44, neckTopMm: 202,
      bodyDiaMm: 59, bodyTopMm: 262, armYMm: 99, valve: 'ball',
    },
    suitability: { mixing: 'good', antiSettling: 'good', highViscosity: 'fair', dispersion: 'fair', emulsification: 'no' },
    mounting: { arm: 'good', clamp: 'good', ferrule: 'good', flange: 'good' },
    fixingOptions: { setbolt: 'good', chuck: 'no', etp: 'good' },
    volumeBand: { from: 100, to: 200, label: '100〜200 L' },
    selectionChart: '〜200 L・アーム / クランプ / ヘルール / フランジ・中速',
    reducerMaterial: 'アルミ（無電解ニッケルメッキ処理）',
    motorMaterial: 'SUS',
    chuckMaterial: null,
  },
]

export const productById = (id: Product['id']) => PRODUCTS.find((p) => p.id === id)!

/** Operating points the simulator can lock to. All are catalog values. */
export type OpPoint = 'noload06' | 'noload03' | 'maxOutput' | 'free'

export const OP_POINTS: { id: OpPoint; label: string; short: string; note: string }[] = [
  { id: 'noload06', label: '参考回転数 0.6 MPa', short: '0.6 MPa', note: '無負荷（シャフト・プロペラ無し）の参考回転数' },
  { id: 'noload03', label: '参考回転数 0.3 MPa', short: '0.3 MPa', note: '無負荷（シャフト・プロペラ無し）の参考回転数' },
  { id: 'maxOutput', label: '最大出力時', short: 'MAX OUT', note: '仕様欄記載の最大出力時回転数' },
  { id: 'free', label: '自由回転数', short: 'FREE', note: '仕様欄記載の自由回転数' },
]

export function rpmFor(m: MotorType, op: OpPoint): number {
  switch (op) {
    case 'noload06': return m.noLoad.p06.rpm
    case 'noload03': return m.noLoad.p03.rpm
    case 'maxOutput': return m.rpmAtMaxOutput
    case 'free': return m.rpmFree
  }
}

export function airFor(m: MotorType, op: OpPoint): number | null {
  if (op === 'noload06') return m.noLoad.p06.airLpm
  if (op === 'noload03') return m.noLoad.p03.airLpm
  return null
}

export const SUIT_LABEL: Record<Suit, string> = { good: '適', fair: '△', no: '—' }

/** Facts shared by the whole series (catalog p.02–03). */
export const SERIES_FACTS = [
  { k: '駆動源', v: '圧縮空気（ドライエアー）', src: 'p.02' },
  { k: '減速機構', v: 'タイミングベルト式・オイル不要（オイルシール不要）', src: 'p.02' },
  { k: '供給エアー圧力', v: '0.3〜0.63 MPa（ドライクリーンエアー）', src: 'p.03' },
  { k: '速度調整', v: 'レギュレーターによる供給エアー圧力の調整', src: 'p.03' },
  { k: '排気', v: '付属のサイレンサーから排出', src: 'p.03' },
  { k: '接液部標準材質', v: 'シャフト・プロペラ SUS304', src: 'p.02' },
]
