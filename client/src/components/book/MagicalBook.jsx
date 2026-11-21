import React from 'react';
import { RealisticMagicalBook } from './RealisticMagicalBook.jsx';

/**
 * 3D-Style Magical Book Component (Task 08 Upgraded)
 * Re-exports the RealisticMagicalBook implementation for full architectural continuity.
 */
export const MagicalBook = (props) => {
  return <RealisticMagicalBook {...props} />;
};

export default MagicalBook;
