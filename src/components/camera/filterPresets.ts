export type FilterKey = 'normal' | 'grayscale' | 'vivid';

export type FilterPreset = {
  key: FilterKey;
  title: string;
  caption: string;
  swatch: string;
  matrix: number[];
};

const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

// Luminance: R' = G' = B' = 0.299R + 0.587G + 0.114B
const GRAYSCALE = [
  0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0,
];

// Saturation 1.35 + contrast 1.10 + slight lift, encoded into one matrix.
const VIVID = [
  1.393, -0.27, -0.027, 0, -0.038, -0.08, 1.204, -0.027, 0, -0.038, -0.08, -0.27, 1.447, 0, -0.038,
  0, 0, 0, 1, 0,
];

export const FILTER_PRESETS: readonly FilterPreset[] = [
  {
    key: 'normal',
    title: 'ปกติ',
    caption: 'สีต้นฉบับ',
    swatch: '#EAF3FF',
    matrix: IDENTITY,
  },
  {
    key: 'grayscale',
    title: 'ขาวดำ',
    caption: 'ความสว่างจริง',
    swatch: '#AAB4BF',
    matrix: GRAYSCALE,
  },
  {
    key: 'vivid',
    title: 'สดใส',
    caption: 'สีสดมีมิติ',
    swatch: '#FF8F70',
    matrix: VIVID,
  },
] as const;

export const presetFor = (key: FilterKey) =>
  FILTER_PRESETS.find((preset) => preset.key === key) ?? FILTER_PRESETS[0];
