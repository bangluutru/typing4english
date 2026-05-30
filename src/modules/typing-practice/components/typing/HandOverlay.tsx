import React, { useState, useEffect } from 'react';
import { fingerMapping } from '../../data/fingerMapping';
import type { KeyboardGeometry } from './useKeyboardGeometry';
import type { FingerType } from '../../data/fingerMapping';

// Import SVG Assets directly as Vite static URLs for the palm/hand background layers
import leftHandSvg from '../../assets/left.svg';
import rightHandSvg from '../../assets/right.svg';

interface HandOverlayProps {
  geometry: KeyboardGeometry;
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
}

interface FingerConfig {
  id: FingerType;
  name: string;
  width: number; // base size in SVG coordinates
  height: number;
  color: string;
  isLeft: boolean;
  angle: number; // visual slanting angle at home position
}

const FINGER_CONFIGS: FingerConfig[] = [
  { id: 'lp', name: 'leftPinky', width: 113, height: 368, color: '#FF7BD5', isLeft: true, angle: -8 },
  { id: 'lr', name: 'leftRing', width: 119, height: 424, color: '#C58DFF', isLeft: true, angle: -4 },
  { id: 'lm', name: 'leftMiddle', width: 124, height: 467, color: '#A6DBFF', isLeft: true, angle: 0 },
  { id: 'li', name: 'leftIndex', width: 124, height: 424, color: '#8EE7B5', isLeft: true, angle: 4 },
  { id: 'lt', name: 'leftThumb', width: 127, height: 311, color: '#6EE7E0', isLeft: true, angle: -22 },
  { id: 'rt', name: 'rightThumb', width: 127, height: 311, color: '#6EE7E0', isLeft: false, angle: 22 },
  { id: 'ri', name: 'rightIndex', width: 124, height: 424, color: '#FFB455', isLeft: false, angle: -4 },
  { id: 'rm', name: 'rightMiddle', width: 124, height: 467, color: '#A6DBFF', isLeft: false, angle: 0 },
  { id: 'rr', name: 'rightRing', width: 119, height: 424, color: '#C58DFF', isLeft: false, angle: 4 },
  { id: 'rp', name: 'rightPinky', width: 113, height: 368, color: '#FF7BD5', isLeft: false, angle: 8 },
];

const fingerHomeKeys: Record<FingerType, string> = {
  lp: 'a',
  lr: 's',
  lm: 'd',
  li: 'f',
  lt: 'space',
  rt: 'space',
  ri: 'j',
  rm: 'k',
  rr: 'l',
  rp: ';',
};

export const HandOverlay: React.FC<HandOverlayProps> = ({
  geometry,
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
}) => {
  const [pressedFinger, setPressedFinger] = useState<FingerType | null>(null);

  // Detect correct key strokes to trigger transient tapping down animation
  useEffect(() => {
    if (lastPressedCorrect === true && lastPressedKey) {
      const keyChar = lastPressedKey === 'Space' ? ' ' : lastPressedKey;
      const config = fingerMapping[keyChar.toLowerCase()] || fingerMapping[keyChar];
      if (config) {
        setPressedFinger(config.finger);
        const timer = setTimeout(() => {
          setPressedFinger(null);
        }, 110); // Tap down duration: 110ms
        return () => clearTimeout(timer);
      }
    }
  }, [lastPressedCorrect, lastPressedKey]);

  // Hide overlay if keyboard geometry hasn't been measured yet to avoid jumping
  if (Object.keys(geometry).length === 0) return null;

  // Resolve target mapping configuration
  const targetConfig = fingerMapping[targetChar] || null;
  const activeFinger = targetConfig ? targetConfig.finger : null;
  const targetKeyId = targetConfig ? targetConfig.key : targetChar.toLowerCase();

  // HOME KEY REFERENCE NODES
  const rectA = geometry['a'];
  const rectF = geometry['f'];
  const rectJ = geometry['j'];
  const rectPinkyRight = geometry[';'];
  const spaceRect = geometry['space'];

  if (!rectA || !rectF || !rectJ || !rectPinkyRight || !spaceRect) return null;

  // Spacebar Thumbs center offsets
  const leftSpaceX = spaceRect.x + spaceRect.width * 0.38;
  const rightSpaceX = spaceRect.x + spaceRect.width * 0.62;
  const spaceY = spaceRect.centerY - spaceRect.height * 0.15;

  // 1. Left Palm Background Positioning (Calibrated: Index center at 1045, 196; Pinky center at 635, 289.5; distance = 410)
  const leftDistance = rectF.centerX - rectA.centerX;
  const scaleLeft = leftDistance / 410;
  const leftSvgWidth = 1536 * scaleLeft;
  const leftSvgHeight = 1024 * scaleLeft;
  const leftSvgLeft = rectF.centerX - 1045 * scaleLeft;
  const leftSvgTop = rectF.centerY - 196 * scaleLeft;

  // 2. Right Palm Background Positioning (Mirrored: Index center at 491, 196)
  // We use scaleLeft to ensure the left and right background palms are exactly equal in size!
  const rightSvgWidth = 1536 * scaleLeft;
  const rightSvgHeight = 1024 * scaleLeft;
  const rightSvgLeft = rectJ.centerX - 491 * scaleLeft;
  const rightSvgTop = rectJ.centerY - 196 * scaleLeft;

  // Get Home position of any finger
  const getHomePosition = (fid: FingerType): { x: number; y: number } => {
    if (fid === 'lt') return { x: leftSpaceX, y: spaceY };
    if (fid === 'rt') return { x: rightSpaceX, y: spaceY };
    const hkey = fingerHomeKeys[fid];
    const rect = geometry[hkey];
    if (rect) {
      return { x: rect.centerX, y: rect.centerY };
    }
    return { x: 0, y: 0 };
  };

  // Get active or home position of any finger
  const getFingerPosition = (fid: FingerType): { x: number; y: number } => {
    if (fid === activeFinger) {
      let destRect = geometry[targetKeyId.toLowerCase()];
      if (!destRect && targetKeyId === 'space') {
        destRect = spaceRect;
      }
      if (destRect) {
        if (targetKeyId === 'space') {
          return fid === 'lt' ? { x: leftSpaceX, y: spaceY } : { x: rightSpaceX, y: spaceY };
        }
        return { x: destRect.centerX, y: destRect.centerY };
      }
    }
    return getHomePosition(fid);
  };

  // Dynamic SVG Renderer for the finger capsule
  const renderFingerSvg = (config: FingerConfig, w: number, h: number, isActive: boolean) => {
    const { color } = config;
    const isTypingError = lastPressedCorrect === false && isActive;
    const activeColor = isTypingError ? '#ef4444' : color;
    
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`finger-grad-${config.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={activeColor} stopOpacity={isActive ? 0.90 : 0.65} />
            <stop offset="60%" stopColor={activeColor} stopOpacity={isActive ? 0.60 : 0.40} />
            <stop offset="100%" stopColor={activeColor} stopOpacity={0.05} />
          </linearGradient>
          {isActive && (
            <filter id={`glow-${config.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={activeColor} floodOpacity="0.75" />
            </filter>
          )}
        </defs>
        
        {/* Finger Body Capsule */}
        <rect
          x="0"
          y="0"
          width={w}
          height={h}
          rx={w / 2}
          fill={`url(#finger-grad-${config.id})`}
          stroke={activeColor}
          strokeWidth={isActive ? 2.5 : 1.2}
          strokeOpacity={isActive ? 0.85 : 0.40}
          filter={isActive ? `url(#glow-${config.id})` : undefined}
          style={{ transition: 'stroke-width 0.2s ease, stroke-opacity 0.2s ease' }}
        />
        
        {/* Rounded Fingernail */}
        <ellipse
          cx={w / 2}
          cy={w / 2 + 3}
          rx={w / 2 - 5}
          ry={w / 2 - 4}
          fill="rgba(255, 255, 255, 0.45)"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth="1"
          style={{ mixBlendMode: 'overlay' }}
        />
        
        {/* Knuckle Crease 1 */}
        <path
          d={`M ${w * 0.15} ${h * 0.42} Q ${w / 2} ${h * 0.38} ${w * 0.85} ${h * 0.42}`}
          fill="none"
          stroke={activeColor}
          strokeWidth="1.2"
          strokeOpacity="0.30"
        />
        <path
          d={`M ${w * 0.15} ${h * 0.46} Q ${w / 2} ${h * 0.42} ${w * 0.85} ${h * 0.46}`}
          fill="none"
          stroke={activeColor}
          strokeWidth="1"
          strokeOpacity="0.20"
        />
        
        {/* Knuckle Crease 2 */}
        <path
          d={`M ${w * 0.15} ${h * 0.72} Q ${w / 2} ${h * 0.68} ${w * 0.85} ${h * 0.72}`}
          fill="none"
          stroke={activeColor}
          strokeWidth="1.2"
          strokeOpacity="0.30"
        />
        <path
          d={`M ${w * 0.15} ${h * 0.76} Q ${w / 2} ${h * 0.72} ${w * 0.85} ${h * 0.76}`}
          fill="none"
          stroke={activeColor}
          strokeWidth="1"
          strokeOpacity="0.20"
        />
      </svg>
    );
  };

  return (
    <>
      {/* 1. FAINT LEFT PALM BACKGROUND LAYER (Static) */}
      <div
        style={{
          position: 'absolute',
          left: `${leftSvgLeft}px`,
          top: `${leftSvgTop}px`,
          width: `${leftSvgWidth}px`,
          height: `${leftSvgHeight}px`,
          pointerEvents: 'none',
          zIndex: 24,
          opacity: 0.18,
          filter: 'grayscale(25%)',
          transition: 'opacity 0.3s ease',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1536 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <image
            href={leftHandSvg}
            width="1536"
            height="1024"
            x="0"
            y="0"
          />
        </svg>
      </div>

      {/* 2. FAINT RIGHT PALM BACKGROUND LAYER (Static) */}
      <div
        style={{
          position: 'absolute',
          left: `${rightSvgLeft}px`,
          top: `${rightSvgTop}px`,
          width: `${rightSvgWidth}px`,
          height: `${rightSvgHeight}px`,
          pointerEvents: 'none',
          zIndex: 24,
          opacity: 0.18,
          filter: 'grayscale(25%)',
          transition: 'opacity 0.3s ease',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1536 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <image
            href={rightHandSvg}
            width="1536"
            height="1024"
            x="0"
            y="0"
          />
        </svg>
      </div>

      {/* 3. INDEPENDENT DYNAMIC INTERACTIVE FINGERS */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 25,
        }}
        className="hand-overlay"
      >
        {FINGER_CONFIGS.map((finger) => {
          const isActive = activeFinger === finger.id;
          const pos = getFingerPosition(finger.id);
          if (!pos) return null;

          const scale = scaleLeft;
          const w = finger.width * scale;
          const h = finger.height * scale;
          const isPressed = pressedFinger === finger.id;

          return (
            <div
              key={finger.id}
              style={{
                position: 'absolute',
                left: `${pos.x - w / 2}px`,
                top: `${pos.y - w / 2}px`, // anchor fingertip circle center to key center
                width: `${w}px`,
                height: `${h}px`,
                pointerEvents: 'none',
                zIndex: isActive ? 30 : 26,
                opacity: isActive ? 0.90 : 0.60,
                transform: `translateY(${isPressed ? '6px' : '0px'}) scale(${isPressed ? 0.93 : 1.0}) rotate(${finger.angle}deg)`,
                transformOrigin: 'top center', // rotate slanting from the fingernail anchor tip
                transition: 'left 200ms cubic-bezier(0.25, 1, 0.5, 1), top 200ms cubic-bezier(0.25, 1, 0.5, 1), transform 90ms ease, opacity 200ms ease',
              }}
              className="finger"
            >
              {renderFingerSvg(finger, finger.width, finger.height, isActive)}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default HandOverlay;
