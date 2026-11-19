import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Target, Zap, AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * CombatActionPanel Component (Task 10)
 * Notebook-styled combat command bar for selecting targets and executing authoritative attacks.
 */
export const CombatActionPanel = ({
  attackerRow,
  attackerRowData,
  selectedTarget,
  targetOpponent,
  onFireShot,
  onClearTarget,
  onPassTurn,
  isFiring = false,
  isMyTurn = true,
  combatError = null,
  className = ''
}) => {
  const bulletCount = attackerRowData?.bulletCount || 0;
  const drawings = attackerRowData?.drawings || {};
  const hasHead = Boolean(drawings.HEAD);
  const hasBody = Boolean(drawings.BODY);
  const hasGun = Boolean(drawings.GUN);
  const isArmed = hasHead && hasBody && hasGun && bulletCount > 0 && !attackerRowData?.isEliminated;

  const hasTarget = Boolean(selectedTarget && targetOpponent);

  return (
    <div
      className={`relative w-full rounded-2xl border-2 border-[#242730] bg-[#FFFDF9] p-4 sm:p-5 shadow-sketch ${className}`}
    >
      {/* Notebook margin accent line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#D75050]/30 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Attacker Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-xl border-2 shadow-xs shrink-0 ${
              isArmed
                ? 'bg-[#2E8557] border-[#242730] text-white'
                : 'bg-[#FAF6EE] border-[#D5CFC3] text-[#8C929D]'
            }`}
          >
            {attackerRow || 1}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-[#242730]">
                Attacking Station: Row {attackerRow || 1}
              </span>
              {isArmed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2E8557]/15 text-[#2E8557] border border-[#2E8557]/40">
                  <CheckCircle2 className="w-3 h-3" /> ARMED ({bulletCount}/3 BULLETS)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#8C929D]/15 text-[#8C929D] border border-[#8C929D]/30">
                  UNARMED
                </span>
              )}
            </div>

            <p className="font-mono text-xs text-[#5C6069] mt-0.5">
              {!hasHead || !hasBody || !hasGun
                ? 'Requires complete warrior (Head + Body + Gun) to attack.'
                : bulletCount === 0
                ? 'Out of ammunition! Draw a bullet to reload.'
                : !isMyTurn
                ? 'Waiting for your turn in the notebook match.'
                : 'Warrior armed and ready. Select an opponent station to eliminate.'}
            </p>
          </div>
        </div>

        {/* Target Status & Fire Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          {hasTarget ? (
            <div className="flex items-center gap-2 p-2 rounded-xl border border-[#CE4242]/40 bg-[#FFF3F3] w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#CE4242] text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                  {selectedTarget.rowNumber}
                </div>
                <div className="min-w-0 pr-1">
                  <span className="text-[10px] font-mono text-[#CE4242] uppercase tracking-wider block leading-tight">
                    TARGET ACQUIRED
                  </span>
                  <span className="font-display font-bold text-xs text-[#242730] truncate block">
                    {targetOpponent.nickname} (Row {selectedTarget.rowNumber})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onClearTarget();
                }}
                title="Cancel Target"
                className="p-1 hover:bg-[#CE4242]/10 rounded-full text-[#CE4242] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FAF6EE] text-xs font-mono text-[#8C929D] flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <Crosshair className="w-4 h-4 text-[#8C929D]" />
              <span>Click any opponent row to target</span>
            </div>
          )}

          {/* Fire Shot Button */}
          <button
            type="button"
            disabled={!isArmed || !hasTarget || !isMyTurn || isFiring}
            onClick={onFireShot}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-mono font-bold text-sm shadow-sketch transition-all cursor-pointer select-none active:scale-95 shrink-0 border-2 w-full sm:w-auto ${
              isArmed && hasTarget && isMyTurn && !isFiring
                ? 'bg-[#CE4242] hover:bg-[#B03535] text-white border-[#242730] animate-bounce-subtle'
                : 'bg-[#FAF6EE] text-[#8C929D] border-[#D5CFC3] cursor-not-allowed opacity-60'
            }`}
          >
            <Zap className={`w-4 h-4 ${isArmed && hasTarget ? 'text-[#FFD166]' : ''}`} />
            <span>
              {isFiring
                ? 'FIRING...'
                : hasTarget
                ? `FIRE AT ROW ${selectedTarget.rowNumber}`
                : 'SELECT TARGET'}
            </span>
          </button>

          {/* Pass Turn Button (Task 11) */}
          {isMyTurn && typeof onPassTurn === 'function' && (
            <button
              type="button"
              onClick={onPassTurn}
              className="inline-flex items-center justify-center px-3.5 py-3 rounded-xl font-mono text-xs font-semibold border border-[#D5CFC3] bg-[#FCFAF5] hover:bg-[#F4EFE6] text-[#5C6069] shadow-xs cursor-pointer transition-colors w-full sm:w-auto"
            >
              Pass Turn
            </button>
          )}
        </div>
      </div>

      {/* Combat Error Alert */}
      {combatError && (
        <div className="mt-3 p-2.5 rounded-lg border border-[#CE4242]/30 bg-[#FDF2F2] text-[#CE4242] font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{combatError}</span>
        </div>
      )}
    </div>
  );
};
