import React, { useMemo } from 'react';
import type { FingerId } from '../../types/game';
import { KEY_POSITIONS, getKeyPosition, HOME_ROW_CENTERS, PALM_BASES } from '../data/keyPositionMap';
import { FINGER_METADATA } from '../data/fingerMetadata';

interface KeyboardHandsOverlayProps {
  currentKey: string | null;
  currentFinger: FingerId | null;
  showHomeRowHint: boolean;
  animationEnabled: boolean;
  compact?: boolean;
  keyboardSize?: number;
}

// ── Finger color palette ──
// Designed for readability: softer saturation than pure neon, but still vivid
const FINGER_COLORS: Record<FingerId, {
  key: string;       // key fill tint (low alpha)
  keyBorder: string;  // key border color
  glow: string;       // active glow color
  finger: string;     // finger/bone color
  fingerFill: string; // finger fill (translucent)
  shadow: string;     // drop shadow color
}> = {
  'left-pinky':  { key: 'rgba(244,114,94,0.12)', keyBorder: '#e85d5d', glow: '#f87171', finger: '#f87171', fingerFill: 'rgba(248,113,113,0.3)', shadow: 'rgba(248,113,113,0.6)' },
  'left-ring':   { key: 'rgba(251,176,59,0.12)', keyBorder: '#f59e0b', glow: '#fbbf24', finger: '#fbbf24', fingerFill: 'rgba(251,191,36,0.3)',  shadow: 'rgba(251,191,36,0.6)'  },
  'left-middle': { key: 'rgba(74,222,128,0.12)', keyBorder: '#22c55e', glow: '#4ade80', finger: '#4ade80', fingerFill: 'rgba(74,222,128,0.3)',  shadow: 'rgba(74,222,128,0.6)'  },
  'left-index':  { key: 'rgba(56,189,248,0.12)', keyBorder: '#0ea5e9', glow: '#38bdf8', finger: '#38bdf8', fingerFill: 'rgba(56,189,248,0.3)',  shadow: 'rgba(56,189,248,0.6)'  },
  'left-thumb':  { key: 'rgba(0,243,255,0.10)',  keyBorder: '#00dce6', glow: '#00f3ff', finger: '#00e5f0', fingerFill: 'rgba(0,229,240,0.3)',   shadow: 'rgba(0,243,255,0.5)'   },
  'right-thumb': { key: 'rgba(0,243,255,0.10)',  keyBorder: '#00dce6', glow: '#00f3ff', finger: '#00e5f0', fingerFill: 'rgba(0,229,240,0.3)',   shadow: 'rgba(0,243,255,0.5)'   },
  'right-index': { key: 'rgba(45,212,191,0.12)', keyBorder: '#14b8a6', glow: '#2dd4bf', finger: '#2dd4bf', fingerFill: 'rgba(45,212,191,0.3)',  shadow: 'rgba(45,212,191,0.6)'  },
  'right-middle':{ key: 'rgba(99,102,241,0.12)', keyBorder: '#6366f1', glow: '#818cf8', finger: '#818cf8', fingerFill: 'rgba(129,140,248,0.3)', shadow: 'rgba(129,140,248,0.6)' },
  'right-ring':  { key: 'rgba(192,132,252,0.12)', keyBorder: '#a855f7', glow: '#c084fc', finger: '#c084fc', fingerFill: 'rgba(192,132,252,0.3)', shadow: 'rgba(192,132,252,0.6)' },
  'right-pinky': { key: 'rgba(244,114,182,0.12)', keyBorder: '#ec4899', glow: '#f472b6', finger: '#f472b6', fingerFill: 'rgba(244,114,182,0.3)', shadow: 'rgba(244,114,182,0.6)' },
};

// SVG viewBox dimensions
const VB_W = 860;
const VB_H = 300;

export const KeyboardHandsOverlay: React.FC<KeyboardHandsOverlayProps> = React.memo(({
  currentKey,
  currentFinger,
  showHomeRowHint,
  animationEnabled,
  compact = false,
  keyboardSize = 100,
}) => {
  const normalizedActiveKey = currentKey ? currentKey.toLowerCase() : null;

  // Resolve active key position
  const activeKeyPos = useMemo(() => {
    if (!normalizedActiveKey) return null;
    return getKeyPosition(normalizedActiveKey);
  }, [normalizedActiveKey]);

  // Compute dynamic fingertip positions
  const fingerTips = useMemo(() => {
    const coords = { ...HOME_ROW_CENTERS };
    if (currentFinger && activeKeyPos) {
      coords[currentFinger] = { x: activeKeyPos.centerX, y: activeKeyPos.centerY };
    }
    return coords;
  }, [currentFinger, activeKeyPos]);

  const fingerTransition = animationEnabled ? 'all 220ms ease-out' : 'none';

  const baseWidth = compact ? 440 : 1035;
  const dynamicMaxWidth = `${baseWidth * (keyboardSize / 100)}px`;

  return (
    <div 
      className={`flex flex-col items-center justify-center select-none font-mono w-full mx-auto relative`}
      style={{ maxWidth: dynamicMaxWidth }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto"
        style={{ maxHeight: compact ? '180px' : '300px' }}
      >
        {/* ── SVG Definitions: gradients, filters, patterns ── */}
        <defs>
          {/* Keyboard base gradient */}
          <linearGradient id="kb-base-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(28,22,55,0.8)" />
            <stop offset="100%" stopColor="rgba(14,10,32,0.9)" />
          </linearGradient>

          {/* Key cap gradient (3D depth effect) — bright enough to see clearly */}
          <linearGradient id="key-cap-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(85,75,120,0.95)" />
            <stop offset="55%" stopColor="rgba(55,45,85,0.95)" />
            <stop offset="100%" stopColor="rgba(38,30,65,0.95)" />
          </linearGradient>

          {/* Home key gradient (brighter than standard) */}
          <linearGradient id="home-key-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(95,82,135,0.95)" />
            <stop offset="55%" stopColor="rgba(65,55,100,0.95)" />
            <stop offset="100%" stopColor="rgba(42,34,72,0.95)" />
          </linearGradient>

          {/* Modifier key gradient (subtler than letter keys) */}
          <linearGradient id="mod-key-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(55,45,80,0.85)" />
            <stop offset="100%" stopColor="rgba(30,22,52,0.9)" />
          </linearGradient>

          {/* Glow filter for active key */}
          <filter id="active-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle key shadow filter */}
          <filter id="key-shadow" x="-5%" y="-5%" width="110%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(0,0,0,0.4)" floodOpacity="0.4" />
          </filter>

          {/* Pulse animation for active key ring */}
          <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ══════════════════════════════════════════════════════════════
            LAYER 1: Keyboard base plate
            ══════════════════════════════════════════════════════════════ */}
        <rect
          x="2" y="2" width={VB_W - 4} height={VB_H - 4}
          rx="16" ry="16"
          fill="url(#kb-base-grad)"
          stroke="rgba(0,243,255,0.08)"
          strokeWidth="1"
        />

        {/* ══════════════════════════════════════════════════════════════
            LAYER 2: Key caps (rendered with 3D depth)
            ══════════════════════════════════════════════════════════════ */}
        {KEY_POSITIONS.map(k => {
          const isTarget = normalizedActiveKey === k.key;
          const isHome = showHomeRowHint && k.isHomeKey;
          const isMod = k.isModifier;
          const colors = FINGER_COLORS[k.finger];
          const hasNotch = showHomeRowHint && (k.key === 'f' || k.key === 'j');

          // Key fill logic
          let fillGrad = 'url(#key-cap-grad)';
          let borderColor = 'rgba(100,90,145,0.7)';
          let borderWidth = 1;
          let labelOpacity = 0.92;
          let labelColor = 'rgba(215,210,235,0.95)';
          const labelSize = isMod ? '10px' : '13px';
          let filterAttr: string | undefined = 'url(#key-shadow)';

          if (isMod) {
            fillGrad = 'url(#mod-key-grad)';
            borderColor = 'rgba(80,70,115,0.55)';
            labelOpacity = 0.6;
            labelColor = 'rgba(170,160,200,0.8)';
          } else if (isHome) {
            fillGrad = 'url(#home-key-grad)';
            borderColor = `${colors.keyBorder}70`;
            labelOpacity = 0.95;
            labelColor = 'rgba(240,235,255,0.98)';
          }

          if (isTarget && !isMod) {
            filterAttr = 'url(#active-glow)';
            borderColor = colors.glow;
            borderWidth = 2.5;
            labelOpacity = 1;
            labelColor = '#ffffff';
          }

          // Finger color zone tint for regular keys
          const zoneTint = !isMod ? colors.key : undefined;

          return (
            <g key={k.key}>
              {/* Key cap 3D base (bottom shadow layer) */}
              <rect
                x={k.x} y={k.y + 3}
                width={k.width} height={k.height}
                rx={8} ry={8}
                fill="rgba(0,0,0,0.35)"
              />

              {/* Key cap main body */}
              <rect
                x={k.x} y={k.y}
                width={k.width} height={k.height - 3}
                rx={8} ry={8}
                fill={fillGrad}
                stroke={borderColor}
                strokeWidth={borderWidth}
                filter={filterAttr}
                className="transition-all duration-150"
              />

              {/* Finger zone color overlay (subtle tint) */}
              {zoneTint && !isTarget && (
                <rect
                  x={k.x + 1} y={k.y + 1}
                  width={k.width - 2} height={k.height - 4}
                  rx={7} ry={7}
                  fill={zoneTint}
                  className="transition-all duration-150"
                />
              )}

              {/* Active key glow overlay */}
              {isTarget && !isMod && (
                <>
                  <rect
                    x={k.x + 1} y={k.y + 1}
                    width={k.width - 2} height={k.height - 4}
                    rx={7} ry={7}
                    fill={`${colors.glow}25`}
                    className="transition-all duration-150"
                  />
                  {/* Pulsing outer ring */}
                  {animationEnabled && (
                    <rect
                      x={k.x - 3} y={k.y - 3}
                      width={k.width + 6} height={k.height + 3}
                      rx={11} ry={11}
                      fill="none"
                      stroke={`${colors.glow}60`}
                      strokeWidth="1.5"
                      filter="url(#pulse-glow)"
                      className="animate-pulse"
                    />
                  )}
                </>
              )}

              {/* Home row highlight ring */}
              {isHome && !isTarget && (
                <rect
                  x={k.x + 2} y={k.y + 2}
                  width={k.width - 4} height={k.height - 7}
                  rx={6} ry={6}
                  fill="none"
                  stroke={`${colors.keyBorder}30`}
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
              )}

              {/* Index notch bumps (F and J) */}
              {hasNotch && (
                <rect
                  x={k.centerX - 8} y={k.y + k.height - 14}
                  width={16} height={2}
                  rx={1} ry={1}
                  fill={isTarget ? colors.glow : 'rgba(200,195,220,0.5)'}
                  className="transition-colors duration-200"
                />
              )}

              {/* Key label */}
              <text
                x={k.centerX}
                y={k.centerY + (isMod ? 1 : 2)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={labelColor}
                opacity={labelOpacity}
                fontSize={labelSize}
                fontFamily="'Outfit', 'SF Pro', system-ui, sans-serif"
                fontWeight={isTarget ? 800 : isMod ? 500 : 700}
                className="select-none transition-all duration-150"
                style={{
                  filter: isTarget && !isMod ? `drop-shadow(0 0 4px ${colors.glow})` : 'none',
                }}
              >
                {k.display}
              </text>
            </g>
          );
        })}

        {/* ══════════════════════════════════════════════════════════════
            LAYER 3: Guide line from home key to target key
            ══════════════════════════════════════════════════════════════ */}
        {currentFinger && activeKeyPos && (() => {
          const meta = FINGER_METADATA[currentFinger];
          const homePos = HOME_ROW_CENTERS[currentFinger];
          const colors = FINGER_COLORS[currentFinger];
          if (activeKeyPos.key === meta.homeKey.toLowerCase()) return null;
          return (
            <line
              x1={homePos.x} y1={homePos.y}
              x2={activeKeyPos.centerX} y2={activeKeyPos.centerY}
              stroke={`${colors.glow}35`}
              strokeWidth={1.5}
              strokeDasharray="5,4"
              className={animationEnabled ? 'animate-pulse' : ''}
            />
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            LAYER 4: Hand silhouettes (palm outlines at wrist level)
            ══════════════════════════════════════════════════════════════ */}
        {renderHandSilhouettes(currentFinger)}

        {/* ══════════════════════════════════════════════════════════════
            LAYER 5: Finger bones and fingertip circles
            ══════════════════════════════════════════════════════════════ */}
        {(Object.keys(HOME_ROW_CENTERS) as FingerId[]).map(fid => {
          const isActive = currentFinger === fid;
          const isAtRest = !currentFinger;
          const colors = FINGER_COLORS[fid];
          const meta = FINGER_METADATA[fid];
          const base = PALM_BASES[fid];
          const tip = fingerTips[fid];

          // Bone visual params
          let boneStroke = `${colors.finger}18`;
          let boneWidth = 10;
          let tipFill = `${colors.fingerFill}`;
          let tipStroke = `${colors.finger}40`;
          let tipSW = 1.5;
          let tipR = 8;
          let glowFilter = '';

          if (isActive) {
            boneStroke = `${colors.finger}90`;
            boneWidth = 14;
            tipFill = `${colors.finger}50`;
            tipStroke = colors.finger;
            tipSW = 2.5;
            tipR = 10;
            glowFilter = `drop-shadow(0 0 6px ${colors.shadow})`;
          } else if (isAtRest) {
            boneStroke = `${colors.finger}28`;
            boneWidth = 11;
            tipFill = `${colors.fingerFill}`;
            tipStroke = `${colors.finger}45`;
            tipSW = 1.5;
            tipR = 8;
          }

          return (
            <g key={fid}>
              {/* Finger bone line */}
              <line
                x1={base.x} y1={base.y}
                x2={tip.x} y2={tip.y}
                stroke={boneStroke}
                strokeWidth={boneWidth}
                strokeLinecap="round"
                style={{
                  transition: fingerTransition,
                  filter: glowFilter,
                }}
              />

              {/* Active fingertip pulse halo */}
              {isActive && animationEnabled && (
                <circle
                  cx={tip.x} cy={tip.y} r={16}
                  fill="none"
                  stroke={`${colors.finger}50`}
                  strokeWidth="1.5"
                  className="animate-ping"
                  style={{ transition: fingerTransition, transformOrigin: `${tip.x}px ${tip.y}px` }}
                />
              )}

              {/* Fingertip circle */}
              <circle
                cx={tip.x} cy={tip.y} r={tipR}
                fill={tipFill}
                stroke={tipStroke}
                strokeWidth={tipSW}
                style={{
                  transition: fingerTransition,
                  filter: glowFilter,
                  transform: isActive && animationEnabled ? 'scale(1.12)' : 'none',
                  transformOrigin: `${tip.x}px ${tip.y}px`,
                }}
              />

              {/* Fingertip label */}
              <text
                x={tip.x} y={tip.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7px"
                fontWeight={isActive ? 800 : 600}
                fill={isActive ? '#ffffff' : `${colors.finger}80`}
                className="select-none"
                style={{
                  transition: fingerTransition,
                  filter: isActive ? `drop-shadow(0 0 3px ${colors.shadow})` : 'none',
                }}
              >
                {meta.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

KeyboardHandsOverlay.displayName = 'KeyboardHandsOverlay';

// ── Helper: Render hand palm silhouettes ──
function renderHandSilhouettes(currentFinger: FingerId | null) {
  const leftActive = currentFinger?.startsWith('left');
  const rightActive = currentFinger?.startsWith('right');

  // Palm silhouette colors
  const leftFill = leftActive ? 'rgba(15,12,35,0.65)' : 'rgba(15,12,35,0.45)';
  const leftStroke = leftActive ? 'rgba(56,189,248,0.35)' : 'rgba(100,90,140,0.2)';
  const rightFill = rightActive ? 'rgba(15,12,35,0.65)' : 'rgba(15,12,35,0.45)';
  const rightStroke = rightActive ? 'rgba(45,212,191,0.35)' : 'rgba(100,90,140,0.2)';

  return (
    <>
      {/* Left palm */}
      <ellipse
        cx={200} cy={252}
        rx={80} ry={32}
        fill={leftFill}
        stroke={leftStroke}
        strokeWidth={1.5}
        className="transition-all duration-300"
      />
      {/* Left wrist */}
      <rect
        x={165} y={270}
        width={70} height={24}
        rx={10} ry={10}
        fill={leftFill}
        stroke={leftStroke}
        strokeWidth={1}
        className="transition-all duration-300"
      />

      {/* Right palm */}
      <ellipse
        cx={560} cy={252}
        rx={80} ry={32}
        fill={rightFill}
        stroke={rightStroke}
        strokeWidth={1.5}
        className="transition-all duration-300"
      />
      {/* Right wrist */}
      <rect
        x={525} y={270}
        width={70} height={24}
        rx={10} ry={10}
        fill={rightFill}
        stroke={rightStroke}
        strokeWidth={1}
        className="transition-all duration-300"
      />
    </>
  );
}
