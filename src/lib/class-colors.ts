// Curated set of sophisticated class colors for instructors
export interface ClassColor {
  id: string;
  name: string;
  value: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

export const CLASS_COLORS: ClassColor[] = [
  {
    id: 'navy',
    name: 'Navy',
    value: '#2d3142',
    bgClass: 'bg-[#2d3142]',
    textClass: 'text-white',
    borderClass: 'border-[#2d3142]',
    description: 'Professional navy blue'
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    value: '#4a5568',
    bgClass: 'bg-[#4a5568]',
    textClass: 'text-white',
    borderClass: 'border-[#4a5568]',
    description: 'Sophisticated charcoal gray'
  },
  {
    id: 'indigo',
    name: 'Indigo',
    value: '#4c51bf',
    bgClass: 'bg-[#4c51bf]',
    textClass: 'text-white',
    borderClass: 'border-[#4c51bf]',
    description: 'Rich indigo blue'
  },
  {
    id: 'slate',
    name: 'Slate',
    value: '#475569',
    bgClass: 'bg-[#475569]',
    textClass: 'text-white',
    borderClass: 'border-[#475569]',
    description: 'Elegant slate blue'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    value: '#059669',
    bgClass: 'bg-[#059669]',
    textClass: 'text-white',
    borderClass: 'border-[#059669]',
    description: 'Professional emerald green'
  },
  {
    id: 'teal',
    name: 'Teal',
    value: '#0d9488',
    bgClass: 'bg-[#0d9488]',
    textClass: 'text-white',
    borderClass: 'border-[#0d9488]',
    description: 'Refined teal blue'
  },
  {
    id: 'amber',
    name: 'Amber',
    value: '#d97706',
    bgClass: 'bg-[#d97706]',
    textClass: 'text-white',
    borderClass: 'border-[#d97706]',
    description: 'Warm amber orange'
  },
  {
    id: 'rose',
    name: 'Rose',
    value: '#e11d48',
    bgClass: 'bg-[#e11d48]',
    textClass: 'text-white',
    borderClass: 'border-[#e11d48]',
    description: 'Sophisticated rose red'
  },
  {
    id: 'violet',
    name: 'Violet',
    value: '#7c3aed',
    bgClass: 'bg-[#7c3aed]',
    textClass: 'text-white',
    borderClass: 'border-[#7c3aed]',
    description: 'Elegant violet purple'
  },
  {
    id: 'stone',
    name: 'Stone',
    value: '#78716c',
    bgClass: 'bg-[#78716c]',
    textClass: 'text-white',
    borderClass: 'border-[#78716c]',
    description: 'Neutral stone gray'
  }
];

export const getClassColorById = (id: string): ClassColor | undefined => {
  return CLASS_COLORS.find(color => color.id === id);
};

export const getDefaultClassColor = (): ClassColor => {
  return CLASS_COLORS[0]; // Navy as default
};
