/**
 * ODD WARS — 6 Distinct Notebook Paper Styles (Task Redesign)
 *
 * Requirements:
 * - All styles are rendered using lightweight, performant CSS gradients & colors.
 * - Text, graphite strokes, and character drawings remain clearly readable on all styles.
 * - One style is chosen authoritatively on the backend upon match start and synchronized to all players.
 */

export const NOTEBOOK_PAPER_STYLES = {
  'classic-blue': {
    id: 'classic-blue',
    name: 'Classic School Blue',
    description: 'Traditional school notebook with warm ivory paper and clean blue ruled lines.',
    bgHex: '#FAF6ED',
    lineColor: 'rgba(43, 104, 180, 0.22)',
    lineSpacing: 32, // px
    marginLine: 'single-red',
    marginColor: 'rgba(215, 65, 65, 0.45)',
    className: 'paper-style-classic-blue',
    dividerColor: '#242730'
  },
  'cream-faded': {
    id: 'cream-faded',
    name: 'Aged Cream Faded',
    description: 'Old warm cream notebook with gentle, faded blue horizontal ruling.',
    bgHex: '#F4EFE2',
    lineColor: 'rgba(74, 110, 150, 0.16)',
    lineSpacing: 36, // px
    marginLine: 'faded-blue',
    marginColor: 'rgba(74, 110, 150, 0.30)',
    className: 'paper-style-cream-faded',
    dividerColor: '#2C3038'
  },
  'red-margin-vintage': {
    id: 'red-margin-vintage',
    name: 'Vintage Red Margin',
    description: 'Antique ivory sheet with soft slate-grey ruling and bold double red margins.',
    bgHex: '#F6F1E5',
    lineColor: 'rgba(90, 100, 115, 0.20)',
    lineSpacing: 30, // px
    marginLine: 'double-red',
    marginColor: 'rgba(215, 55, 55, 0.55)',
    className: 'paper-style-red-margin-vintage',
    dividerColor: '#23252A'
  },
  'yellowed-grey': {
    id: 'yellowed-grey',
    name: 'Yellowed Legal Grey',
    description: 'Slightly yellowed retro notebook with graphite-grey ruling and dark margin.',
    bgHex: '#F5ECCF',
    lineColor: 'rgba(70, 75, 85, 0.22)',
    lineSpacing: 28, // px
    marginLine: 'graphite-black',
    marginColor: 'rgba(50, 55, 65, 0.38)',
    className: 'paper-style-yellowed-grey',
    dividerColor: '#22252B'
  },
  'narrow-ruled': {
    id: 'narrow-ruled',
    name: 'Narrow College Ruled',
    description: 'Clean off-white college ruled paper with crisp thin blue lines.',
    bgHex: '#F9F6F0',
    lineColor: 'rgba(50, 100, 165, 0.24)',
    lineSpacing: 24, // px
    marginLine: 'crisp-pink',
    marginColor: 'rgba(220, 60, 80, 0.50)',
    className: 'paper-style-narrow-ruled',
    dividerColor: '#202328'
  },
  'double-margin-aged': {
    id: 'double-margin-aged',
    name: 'Aged Double-Margin Ledger',
    description: 'Deeply aged ledger sheet with sepia ruling and double left & right guidelines.',
    bgHex: '#EFE8D6',
    lineColor: 'rgba(95, 85, 75, 0.20)',
    lineSpacing: 34, // px
    marginLine: 'double-aged',
    marginColor: 'rgba(185, 60, 50, 0.40)',
    className: 'paper-style-double-margin-aged',
    dividerColor: '#282522'
  }
};

export const DEFAULT_PAPER_STYLE = 'classic-blue';

export const getPaperStyle = (styleId) => {
  return NOTEBOOK_PAPER_STYLES[styleId] || NOTEBOOK_PAPER_STYLES[DEFAULT_PAPER_STYLE];
};
