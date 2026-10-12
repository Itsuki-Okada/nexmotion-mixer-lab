import type { Product, Source } from './products'

export type PartId = 'inlet' | 'exhaust' | 'motor' | 'reducer' | 'arm' | 'fixing' | 'shaft' | 'propeller' | 'stand'

export interface PartInfo {
  id: PartId
  name: string
  en: string
  rotates: boolean
  /** How the part's 3D shape was derived */
  shapeSource: Source
  role: (p: Product) => string
  material: (p: Product) => string
}

export const PARTS: PartInfo[] = [
  {
    id: 'inlet', name: 'エアー供給口・バルブ', en: 'AIR INLET', rotates: false, shapeSource: 'drawing',
    role: (p) => `圧縮空気を受け入れる配管部。図面ではエルボ・${p.geom.valve === 'ball' ? 'ボールバルブ' : 'ニードル式バルブ'}・継手が確認できる。運転速度は1次側レギュレーターの圧力調整で制御（カタログ記載）。`,
    material: () => '材質：カタログ未記載',
  },
  {
    id: 'exhaust', name: 'サイレンサー部', en: 'EXHAUST / SILENCER', rotates: false, shapeSource: 'concept',
    role: () => '排気は撹拌機に付属のサイレンサーから排出される（カタログ記載）。図面では破線表示のため、形状・配置は製品写真を参考にした概念表現。透明ボウル部品の機能はカタログ未記載。',
    material: () => '材質：カタログ未記載',
  },
  {
    id: 'motor', name: 'エアーモーター', en: 'AIR MOTOR', rotates: false, shapeSource: 'drawing',
    role: (p) => `オイルレス（無給油式）エアーモーター。モータータイプ ${p.motors.map((m) => m.id).join(' / ')} から選択し、タイプにより回転数とトルクが変わる。内部構造はカタログ未記載のため外装のみ表現。`,
    material: (p) => `材質：${p.motorMaterial}（写真では外装が黒色）`,
  },
  {
    id: 'reducer', name: '減速機', en: 'BELT REDUCER', rotates: false, shapeSource: 'drawing',
    role: () => 'タイミングベルト式の減速機。ギア式ではないためオイル・オイルシールが不要（カタログ記載）。プーリー径・減速比・内部配置はカタログ未記載のため、透視表示は概念図。',
    material: (p) => `材質：${p.reducerMaterial}`,
  },
  {
    id: 'arm', name: 'アーム・クランプ', en: 'ARM CLAMP', rotates: false, shapeSource: 'drawing',
    role: (p) => `スタンドの支柱に撹拌機を固定するアーム。図面寸法：アーム φ${p.arm.diameterMm}、全長 ${p.arm.lengthMm} mm。`,
    material: () => '材質：カタログ未記載',
  },
  {
    id: 'fixing', name: 'シャフト固定部', en: 'SHAFT COUPLING', rotates: true, shapeSource: 'drawing',
    role: (p) => p.shaftFixing.kind === 'chuck'
      ? 'キーレスドリルチャックでシャフトを把持する。出力軸と一体で回転。'
      : 'セットボルト（2-M6）でシャフトを点固定する出力カップリング。ETPブッシュ（面圧固定）仕様も設定あり（カタログ記載）。',
    material: (p) => (p.chuckMaterial ? `材質：${p.chuckMaterial}` : '材質：カタログ未記載'),
  },
  {
    id: 'shaft', name: 'シャフト', en: 'SHAFT', rotates: true, shapeSource: 'catalog',
    role: (p) => `減速機の出力を撹拌羽根へ伝える回転軸。φ${p.shaft.diameterMm} × ${p.shaft.lengthMm} mm（カタログ記載）。`,
    material: (p) => `標準材質：${p.shaft.material}（別材質・別サイズ特注可）`,
  },
  {
    id: 'propeller', name: '撹拌羽根', en: 'PROPELLER', rotates: true, shapeSource: 'concept',
    role: (p) => `${p.propeller.label}（カタログ記載）。羽根のピッチ角・断面形状はカタログ未記載のため、写真・イラストを参考にした概念形状。`,
    material: (p) => `標準材質：${p.propeller.material}`,
  },
  {
    id: 'stand', name: 'スタンド', en: 'STAND', rotates: false, shapeSource: 'concept',
    role: (p) => `標準スタンド：${p.stand.label}（カタログ記載）。支柱高さ・ベース寸法はカタログ未記載のため概念形状。`,
    material: () => '材質：カタログ未記載',
  },
]

export const partById = (id: PartId) => PARTS.find((p) => p.id === id)!
