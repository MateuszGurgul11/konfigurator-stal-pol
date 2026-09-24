export type PatternId =
  | "pattern-3d"
  | "pattern-palisade"
  | "pattern-panel-horizontal";

export const PATTERN_OPTIONS: { id: PatternId; label: string }[] = [
  { id: "pattern-3d", label: "Panel 3D" },
  { id: "pattern-palisade", label: "Palisada pionowa" },
  { id: "pattern-panel-horizontal", label: "Palisada pozioma" },
];
