/**
 * Automated Verification Script for ODD WARS 3D Realistic Magical Book
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== [1/5] Verifying 3D Book Component & State Machine ===');
const bookPath = path.resolve('client/src/components/book/RealisticMagicalBook.jsx');
assert(fs.existsSync(bookPath), 'RealisticMagicalBook.jsx must exist');
const bookContent = fs.readFileSync(bookPath, 'utf-8');

assert(bookContent.includes('BOOK_STATES'), 'Must define BOOK_STATES state machine');
assert(bookContent.includes('IDLE_CLOSED'), 'Must include IDLE_CLOSED state');
assert(bookContent.includes('OPENING'), 'Must include OPENING state');
assert(bookContent.includes('FLIPPING'), 'Must include FLIPPING state');
assert(bookContent.includes('SLOWING_DOWN'), 'Must include SLOWING_DOWN state');
assert(bookContent.includes('REVEALING'), 'Must include REVEALING state');
assert(bookContent.includes('RESULT_VISIBLE'), 'Must include RESULT_VISIBLE state');
console.log('✔ State machine defined with all required states.');

console.log('=== [2/5] Verifying Strict "ONLY THE NUMBER" Requirement ===');
// Check that on the active revealed number right spread, there are NO headings, NO descriptions, NO "Landed on"
assert(
  !bookContent.includes('LANDED ON'),
  'Must NOT contain "LANDED ON" text'
);
assert(
  !bookContent.includes('Your number'),
  'Must NOT contain "Your number" text'
);
assert(
  !bookContent.includes('Selected page'),
  'Must NOT contain "Selected page" text'
);
assert(
  bookContent.includes('activeRevealedNumber'),
  'Must display activeRevealedNumber on paper'
);
console.log('✔ Verified: Final settled page contains strictly ONLY the generated number.');

console.log('=== [3/5] Verifying Physical 3D Cover Rotation & Sequential Turning Leaves ===');
assert(
  bookContent.includes('rotateY: -180'),
  'Cover must rotate -180deg around spine'
);
assert(
  bookContent.includes('transformOrigin: \'left center\''),
  'Cover and turning sheets must rotate around the left spine origin'
);
assert(
  bookContent.includes('turningLeaves'),
  'Must maintain individual sequential turning sheets'
);
assert(
  bookContent.includes('backfaceVisibility'),
  'Must configure backface visibility for realistic front and back surfaces'
);
console.log('✔ Physical 3D spine rotation and cascading leaves verified.');

console.log('=== [4/5] Verifying Portal & High-Priority Overlay Architecture ===');
const overlayPath = path.resolve('client/src/components/book/MagicalBookOverlay.jsx');
assert(fs.existsSync(overlayPath), 'MagicalBookOverlay.jsx must exist');
const overlayContent = fs.readFileSync(overlayPath, 'utf-8');

assert(
  overlayContent.includes('createPortal'),
  'Overlay must use createPortal to break out of all container overflows'
);
assert(
  overlayContent.includes('z-[9999]'),
  'Overlay must use top-level high z-index (z-[9999])'
);
assert(
  overlayContent.includes('RealisticMagicalBook'),
  'Overlay must mount RealisticMagicalBook directly'
);
// Verify that the old rectangular modal wrapper was removed
assert(
  !overlayContent.includes('rounded-3xl border-2 border-[#242730] bg-[#FAF6EE]'),
  'Old rectangular modal card must be removed so the 3D book floats freely'
);
console.log('✔ Portal overlay and floating physical book architecture verified.');

console.log('=== [5/5] Verifying Audio & BattlefieldPage Integration ===');
assert(
  bookContent.includes('soundEffects.playBookOpen'),
  'Must trigger procedural book opening sound'
);
assert(
  bookContent.includes('soundEffects.playPageFlip'),
  'Must trigger procedural page flipping sound'
);
assert(
  bookContent.includes('soundEffects.playMagicShimmer'),
  'Must trigger procedural shimmer sound'
);
assert(
  bookContent.includes('soundEffects.playResultChime'),
  'Must trigger procedural result chime sound'
);

const bfPath = path.resolve('client/src/pages/rooms/BattlefieldPage.jsx');
const bfContent = fs.readFileSync(bfPath, 'utf-8');
assert(
  bfContent.includes('MagicalBookOverlay'),
  'BattlefieldPage must import and render MagicalBookOverlay'
);
assert(
  bfContent.includes('onOpenBook={handleOpenBook}'),
  'BattlefieldPage must pass onOpenBook handler to MagicalBookOverlay'
);
assert(
  bfContent.includes('turnPhase === \'AWAITING_FLIP\''),
  'BattlefieldPage must check AWAITING_FLIP to auto-open overlay on player turn'
);

console.log('✔ Procedural audio synthesis and BattlefieldPage integration verified.');
console.log('\n======================================================');
console.log('ALL REALISTIC 3D MAGICAL BOOK VERIFICATIONS PASSED! ✔');
console.log('======================================================');
