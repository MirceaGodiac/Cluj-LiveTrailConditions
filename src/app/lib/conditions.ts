export type MoistureCondition = {
  name: string;
  tailwindColor: string;
  hexColor: string;
  warning?: string;
  rangeLabel: string;
};

const CONDITION_LEVELS: MoistureCondition[] = [
  {
    name: "Slippery",
    tailwindColor: "bg-rose-500",
    hexColor: "#f43f5e",
    rangeLabel: "< 300",
  },
  {
    name: "Wet / Damp",
    tailwindColor: "bg-sky-500",
    hexColor: "#0ea5e9",
    warning: "Some parts may still be slippery",
    rangeLabel: "300 - 330",
  },
  {
    name: "Hero Dirt",
    tailwindColor: "bg-emerald-500",
    hexColor: "#10b981",
    warning: "Lower section of trails may still be slippery",
    rangeLabel: "330 - 350",
  },
  {
    name: "Dry",
    tailwindColor: "bg-amber-400",
    hexColor: "#fbbf24",
    rangeLabel: "350 - 400",
  },
  {
    name: "Dusty",
    tailwindColor: "bg-orange-400",
    hexColor: "#fb923c",
    rangeLabel: "> 400",
  },
];

export const getCondition = (val: number): MoistureCondition => {
  if (val <= 300) return CONDITION_LEVELS[0];
  if (val <= 330) return CONDITION_LEVELS[1];
  if (val <= 350) return CONDITION_LEVELS[2];
  if (val <= 400) return CONDITION_LEVELS[3];
  return CONDITION_LEVELS[4];
};

export const getConditionColorHex = (val: number): string => getCondition(val).hexColor;
export const getConditionPalette = () => CONDITION_LEVELS;
