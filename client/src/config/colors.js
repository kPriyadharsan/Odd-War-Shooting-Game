/**
 * ODD WARS Color Family System
 * Defines the 5 primary character color families and their future room shade scales.
 *
 * Architecture note:
 * In a match, a player selects their preferred primary color family.
 * If 2-4 players choose the same family in a room, the future room engine
 * will assign distinct shades from that family's shades palette.
 */

export const COLOR_FAMILIES = {
  RED: {
    id: 'RED',
    name: 'Red',
    label: 'Red Ink',
    hex: '#CE4242',
    bgClass: 'bg-[#CE4242]',
    borderClass: 'border-[#CE4242]',
    lightBg: 'bg-[#FDF2F2]',
    textClass: 'text-[#CE4242]',
    // Future Room Shade Scale: [dark, medium (primary), light, muted]
    shades: [
      { id: 'dark-red', name: 'Dark Red', hex: '#8A1F1F' },
      { id: 'medium-red', name: 'Medium Red', hex: '#CE4242', isPrimary: true },
      { id: 'light-red', name: 'Light Red', hex: '#E56F6F' },
      { id: 'muted-red', name: 'Muted Red', hex: '#F4A5A5' }
    ]
  },
  GREEN: {
    id: 'GREEN',
    name: 'Green',
    label: 'Chalk Green',
    hex: '#2E8557',
    bgClass: 'bg-[#2E8557]',
    borderClass: 'border-[#2E8557]',
    lightBg: 'bg-[#F0F7F3]',
    textClass: 'text-[#2E8557]',
    // Future Room Shade Scale: [dark, medium (primary), light, muted]
    shades: [
      { id: 'dark-green', name: 'Forest Green', hex: '#1C5236' },
      { id: 'medium-green', name: 'Chalk Green', hex: '#2E8557', isPrimary: true },
      { id: 'light-green', name: 'Sage Green', hex: '#48A874' },
      { id: 'muted-green', name: 'Mint Green', hex: '#85CCA5' }
    ]
  },
  BLUE: {
    id: 'BLUE',
    name: 'Blue',
    label: 'Blue Ink',
    hex: '#2B68B4',
    bgClass: 'bg-[#2B68B4]',
    borderClass: 'border-[#2B68B4]',
    lightBg: 'bg-[#F0F5FB]',
    textClass: 'text-[#2B68B4]',
    // Future Room Shade Scale: [dark, medium (primary), light, muted]
    shades: [
      { id: 'dark-blue', name: 'Navy Blue', hex: '#1A4375' },
      { id: 'medium-blue', name: 'Blue Ink', hex: '#2B68B4', isPrimary: true },
      { id: 'light-blue', name: 'Sky Blue', hex: '#558FD6' },
      { id: 'muted-blue', name: 'Pale Blue', hex: '#98BFEC' }
    ]
  },
  YELLOW: {
    id: 'YELLOW',
    name: 'Yellow',
    label: 'Pencil Yellow',
    hex: '#D59926',
    bgClass: 'bg-[#D59926]',
    borderClass: 'border-[#D59926]',
    lightBg: 'bg-[#FCF8EE]',
    textClass: 'text-[#D59926]',
    // Future Room Shade Scale: [dark, medium (primary), light, muted]
    shades: [
      { id: 'dark-yellow', name: 'Mustard', hex: '#8C6314' },
      { id: 'medium-yellow', name: 'Pencil Yellow', hex: '#D59926', isPrimary: true },
      { id: 'light-yellow', name: 'Warm Amber', hex: '#E4B55C' },
      { id: 'muted-yellow', name: 'Pastel Yellow', hex: '#F2D396' }
    ]
  },
  BLACK: {
    id: 'BLACK',
    name: 'Black',
    label: 'Graphite Black',
    hex: '#23252A',
    bgClass: 'bg-[#23252A]',
    borderClass: 'border-[#23252A]',
    lightBg: 'bg-[#F2F3F5]',
    textClass: 'text-[#23252A]',
    // Future Room Shade Scale: [dark, medium (primary), light, muted]
    shades: [
      { id: 'pitch-black', name: 'Ink Black', hex: '#111215' },
      { id: 'graphite-black', name: 'Graphite', hex: '#23252A', isPrimary: true },
      { id: 'pencil-grey', name: 'Pencil Grey', hex: '#5C6069' },
      { id: 'light-pencil', name: 'Light Lead', hex: '#8E949F' }
    ]
  }
};

export const COLOR_LIST = Object.values(COLOR_FAMILIES);

export const getColorFamily = (colorKey) => {
  if (!colorKey) return COLOR_FAMILIES.BLUE;
  const upperKey = colorKey.toUpperCase();
  return COLOR_FAMILIES[upperKey] || COLOR_FAMILIES.BLUE;
};
