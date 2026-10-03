export const EYE_KINDS = ['dot', 'oval', 'happyArc', 'star', 'shades', 'closed'] as const;
export const MOUTH_KINDS = ['smile', 'grinOpen', 'oh', 'tongue', 'teeth', 'line', 'frown'] as const;
export const EXTRA_KINDS = ['blush', 'brows', 'browsSad', 'freckles'] as const;
export const EXPRESSION_NAMES = ['idle', 'hype', 'victory', 'lose'] as const;

export type EyeKind = (typeof EYE_KINDS)[number];
export type MouthKind = (typeof MOUTH_KINDS)[number];
export type ExtraKind = (typeof EXTRA_KINDS)[number];
export type ExpressionName = (typeof EXPRESSION_NAMES)[number];

export interface FaceSpec {
  eyes: EyeKind;
  mouth: MouthKind;
  extras: ExtraKind[];
}

export interface ExpressionOverride {
  eyes?: EyeKind;
  mouth?: MouthKind;
  extras?: ExtraKind[];
}
