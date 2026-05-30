import React from 'react';
import type { FingerId, UILanguage } from '../../types/game';
import { useTranslation } from '../../i18n/useTranslation';
import { FINGER_METADATA } from '../data/fingerMetadata';

interface FingerGuideProps {
  currentFinger: FingerId | null;
  animationEnabled: boolean;
  uiLanguage: UILanguage;
  currentKey?: string | null;
}

interface FingerShape {
  id: FingerId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tx: number; // Text label X
  ty: number; // Text label Y
}

const LEFT_FINGER_SHAPES: FingerShape[] = [
  { id: 'left-pinky', x1: 82, y1: 135, x2: 70, y2: 80, tx: 70, ty: 64 },
  { id: 'left-ring', x1: 106, y1: 125, x2: 100, y2: 60, tx: 100, ty: 44 },
  { id: 'left-middle', x1: 130, y1: 120, x2: 130, y2: 50, tx: 130, ty: 34 },
  { id: 'left-index', x1: 154, y1: 125, x2: 160, y2: 65, tx: 160, ty: 49 },
  { id: 'left-thumb', x1: 172, y1: 145, x2: 205, y2: 125, tx: 205, ty: 109 },
];

const RIGHT_FINGER_SHAPES: FingerShape[] = [
  { id: 'right-thumb', x1: 348, y1: 145, x2: 315, y2: 125, tx: 315, ty: 109 },
  { id: 'right-index', x1: 366, y1: 125, x2: 360, y2: 65, tx: 360, ty: 49 },
  { id: 'right-middle', x1: 390, y1: 120, x2: 390, y2: 50, tx: 390, ty: 34 },
  { id: 'right-ring', x1: 414, y1: 125, x2: 420, y2: 60, tx: 420, ty: 44 },
  { id: 'right-pinky', x1: 438, y1: 135, x2: 450, y2: 80, tx: 450, ty: 64 },
];

const JOINT_COLORS: Record<FingerId, { stroke: string; fill: string; shadow: string }> = {
  'left-pinky': { stroke: '#f43f5e', fill: 'rgba(244,63,94,0.3)', shadow: 'rgba(244,63,94,0.6)' },
  'left-ring': { stroke: '#f97316', fill: 'rgba(249,115,22,0.3)', shadow: 'rgba(249,115,22,0.6)' },
  'left-middle': { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.3)', shadow: 'rgba(245,158,11,0.6)' },
  'left-index': { stroke: '#10b981', fill: 'rgba(16,185,129,0.3)', shadow: 'rgba(16,185,129,0.6)' },
  'left-thumb': { stroke: '#00f3ff', fill: 'rgba(0,243,255,0.3)', shadow: 'rgba(0,243,255,0.6)' },
  'right-thumb': { stroke: '#00f3ff', fill: 'rgba(0,243,255,0.3)', shadow: 'rgba(0,243,255,0.6)' },
  'right-index': { stroke: '#14b8a6', fill: 'rgba(20,184,166,0.3)', shadow: 'rgba(20,184,166,0.6)' },
  'right-middle': { stroke: '#0ea5e9', fill: 'rgba(14,165,233,0.3)', shadow: 'rgba(14,165,233,0.6)' },
  'right-ring': { stroke: '#4f46e5', fill: 'rgba(79,70,229,0.3)', shadow: 'rgba(79,70,229,0.6)' },
  'right-pinky': { stroke: '#d946ef', fill: 'rgba(217,70,239,0.3)', shadow: 'rgba(217,70,239,0.6)' },
};

export const FingerGuide: React.FC<FingerGuideProps> = React.memo(({
  currentFinger,
  animationEnabled,
  uiLanguage,
  currentKey = null,
}) => {
  const t = useTranslation(uiLanguage);

  const renderFingerItem = (f: FingerShape) => {
    const meta = FINGER_METADATA[f.id];
    const isAtRest = !currentFinger; // Rest state highlights all home row keys softly
    const isActive = currentFinger === f.id;
    const colors = JOINT_COLORS[f.id];

    // Determine path styling based on active/rest status
    let strokeColor = 'rgba(0, 243, 255, 0.08)';
    let strokeWidth = 10;
    let tipFill = 'rgba(13, 8, 31, 0.6)';
    let tipStroke = 'rgba(0, 243, 255, 0.15)';
    let tipStrokeWidth = 1;
    let tipRadius = 6;
    let isGlowing = false;

    if (isActive) {
      strokeColor = colors.stroke;
      strokeWidth = 16;
      tipFill = colors.fill;
      tipStroke = colors.stroke;
      tipStrokeWidth = 2;
      tipRadius = 8;
      isGlowing = true;
    } else if (isAtRest) {
      // Highlight home row fingers lightly when waiting
      strokeColor = `${colors.stroke}25`; // ~15% opacity hex
      strokeWidth = 12;
      tipFill = 'rgba(13, 8, 31, 0.4)';
      tipStroke = `${colors.stroke}50`; // ~30% opacity
      tipStrokeWidth = 1.5;
      tipRadius = 7;
    }

    return (
      <g key={f.id} className="transition-all duration-200">
        {/* Glowing finger line */}
        <line
          x1={f.x1}
          y1={f.y1}
          x2={f.x2}
          y2={f.y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-200"
          style={{
            filter: isGlowing ? `drop-shadow(0 0 6px ${colors.shadow})` : 'none',
          }}
        />

        {/* Pulsating tip ring */}
        {isActive && animationEnabled && (
          <circle
            cx={f.x2}
            cy={f.y2}
            r={13}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="1.5"
            className="animate-ping"
            style={{ transformOrigin: `${f.x2}px ${f.y2}px` }}
          />
        )}

        {/* Joint fingertip node */}
        <circle
          cx={f.x2}
          cy={f.y2}
          r={tipRadius}
          fill={tipFill}
          stroke={tipStroke}
          strokeWidth={tipStrokeWidth}
          className="transition-all duration-200"
          style={{
            filter: isGlowing ? `drop-shadow(0 0 4px ${colors.shadow})` : 'none',
            transform: isActive && animationEnabled ? 'scale(1.1)' : 'none',
            transformOrigin: `${f.x2}px ${f.y2}px`,
          }}
        >
          <title>{t(meta.nameKey as Parameters<typeof t>[0])}</title>
        </circle>

        {/* Fingertip label text */}
        <text
          x={f.tx}
          y={f.ty}
          textAnchor="middle"
          className={`text-[8px] font-sans font-extrabold transition-all duration-200 ${
            isActive ? 'fill-white scale-110 font-black' : isAtRest ? 'fill-gray-400 opacity-60' : 'fill-gray-600 opacity-30'
          }`}
          style={{ transformOrigin: `${f.tx}px ${f.ty}px` }}
        >
          {meta.shortLabel}
        </text>
      </g>
    );
  };

  // Text details card below the SVG
  const renderInstructionCard = () => {
    if (!currentFinger) {
      return (
        <div className="flex flex-col items-center justify-center p-3.5 bg-cyber-dark/45 border border-cyber-accent/10 rounded-2xl text-center w-full min-h-[64px] animate-pulse">
          <span className="text-[10px] text-cyber-accent uppercase tracking-widest font-bold font-display mb-1">{t('placeHomeRow')}</span>
          <span className="text-[9px] text-gray-400 font-sans">{t('homeRowHint')}</span>
        </div>
      );
    }

    const meta = FINGER_METADATA[currentFinger];
    const fingerName = t(meta.nameKey as Parameters<typeof t>[0]);
    const displayKey = currentKey === ' ' ? 'Space' : currentKey?.toUpperCase();

    return (
      <div className="grid grid-cols-3 gap-2 w-full p-2.5 bg-cyber-dark/50 border border-cyber-accent/15 rounded-2xl text-center font-mono text-[9px] relative overflow-hidden">
        {/* Glow ambient background depending on current finger */}
        <div className={`absolute -inset-1 opacity-5 bg-gradient-to-r from-transparent via-${meta.colorClass} to-transparent pointer-events-none`} />
        
        {/* Column 1: Current Key */}
        <div className="flex flex-col items-center justify-center border-r border-cyber-accent/10">
          <span className="text-gray-400 uppercase text-[8px] mb-0.5">{t('nextKey')}</span>
          <span className="text-sm font-black text-white">{displayKey}</span>
        </div>

        {/* Column 2: Recommended Finger */}
        <div className="flex flex-col items-center justify-center border-r border-cyber-accent/10">
          <span className="text-gray-400 uppercase text-[8px] mb-0.5">{t('useFingerInstruction')}</span>
          <span className="text-[10px] font-bold text-cyber-accent truncate max-w-full px-1">{fingerName}</span>
        </div>

        {/* Column 3: Home Return Key */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-400 uppercase text-[8px] mb-0.5">{t('homeKey')}</span>
          <span className="text-sm font-black text-cyber-green">{meta.homeKey}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-2xl bg-cyber-dark/45 border border-cyber-accent/10 backdrop-blur-md font-mono w-full max-w-[340px] shrink-0">
      
      {/* 2D Cyber Hand SVG Canvas */}
      <svg viewBox="0 0 520 220" className="w-full h-36 filter drop-shadow-[0_0_8px_rgba(0,243,255,0.15)] select-none">
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Left Hand wrist outline */}
        <path 
          d="M 95,182 L 95,205 C 95,210 160,210 160,205 L 160,182 Z" 
          fill="rgba(13, 8, 31, 0.4)" 
          stroke={currentFinger?.startsWith('left') ? '#00f3ff' : 'rgba(0, 243, 255, 0.15)'} 
          strokeWidth={currentFinger?.startsWith('left') ? 2 : 1}
          className="transition-all duration-200"
        />
        {/* Left Palm shape */}
        <path 
          d="M 82,180 C 70,165 74,135 82,130 C 95,120 165,120 172,135 C 182,145 180,165 172,180 Z" 
          fill="rgba(13, 8, 31, 0.55)" 
          stroke={currentFinger?.startsWith('left') ? '#00f3ff' : 'rgba(0, 243, 255, 0.15)'} 
          strokeWidth={currentFinger?.startsWith('left') ? 2 : 1}
          className="transition-all duration-200"
        />

        {/* Right Hand wrist outline */}
        <path 
          d="M 360,182 L 360,205 C 360,210 425,210 425,205 L 425,182 Z" 
          fill="rgba(13, 8, 31, 0.4)" 
          stroke={currentFinger?.startsWith('right') ? '#00f3ff' : 'rgba(0, 243, 255, 0.15)'} 
          strokeWidth={currentFinger?.startsWith('right') ? 2 : 1}
          className="transition-all duration-200"
        />
        {/* Right Palm shape */}
        <path 
          d="M 348,180 C 340,165 338,145 348,135 C 355,120 425,120 438,130 C 446,135 450,165 438,180 Z" 
          fill="rgba(13, 8, 31, 0.55)" 
          stroke={currentFinger?.startsWith('right') ? '#00f3ff' : 'rgba(0, 243, 255, 0.15)'} 
          strokeWidth={currentFinger?.startsWith('right') ? 2 : 1}
          className="transition-all duration-200"
        />

        {/* Hands descriptors text */}
        <text x="130" y="215" textAnchor="middle" className="fill-gray-500 text-[8px] font-sans font-bold uppercase tracking-widest">{t('leftHand')}</text>
        <text x="390" y="215" textAnchor="middle" className="fill-gray-500 text-[8px] font-sans font-bold uppercase tracking-widest">{t('rightHand')}</text>

        {/* Render Left and Right Fingers */}
        {LEFT_FINGER_SHAPES.map(f => renderFingerItem(f))}
        {RIGHT_FINGER_SHAPES.map(f => renderFingerItem(f))}
      </svg>

      {/* Recommended finger card alert instruction */}
      {renderInstructionCard()}

    </div>
  );
});

FingerGuide.displayName = 'FingerGuide';
