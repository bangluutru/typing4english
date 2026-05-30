import type { WordAircraft } from '../types/game';

/**
 * Calculates the next position (x, y) and visual tilt (rotation) of a word aircraft
 * based on its path configurations and the elapsed game time.
 */
export const updateAircraftPosition = (
  aircraft: WordAircraft,
  time: number,
  canvasWidth: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _canvasHeight: number
): { x: number; y: number; rotation: number } => {
  const elapsed = (time - aircraft.spawnTime) / 1000; // in seconds
  let nextX: number;
  let nextY = aircraft.y;

  switch (aircraft.pathType) {
    case 'sinusoidal': {
      // Move downward, with sinusoidal wobble on X-axis
      nextY += aircraft.speed;
      const sinOffset = Math.sin(elapsed * aircraft.frequency + aircraft.phaseOffset) * aircraft.amplitude;
      nextX = aircraft.targetX + sinOffset;
      break;
    }
    case 's-curve': {
      // Wide curves
      nextY += aircraft.speed;
      const wave = Math.sin(elapsed * aircraft.frequency * 0.7 + aircraft.phaseOffset);
      nextX = aircraft.targetX + wave * aircraft.amplitude;
      break;
    }
    case 'swoop': {
      // Fast drop, then glides horizontally, then drops again
      nextY += aircraft.speed * (1.2 + Math.cos(elapsed * 2) * 0.5);
      const swoopX = Math.sin(elapsed * aircraft.frequency) * aircraft.amplitude * 0.8;
      nextX = aircraft.targetX + swoopX;
      break;
    }
    case 'linear':
    default: {
      // Direct approach
      nextY += aircraft.speed;
      nextX = aircraft.targetX;
      break;
    }
  }

  // Bound within canvas width limits (padding 40px)
  nextX = Math.max(40, Math.min(canvasWidth - 120, nextX));

  return {
    x: nextX,
    y: nextY,
    rotation: 0, // Keep rotation = 0 for horizontal, stable, and highly legible text
  };
};

/**
 * Generate random flight configuration variables
 */
export const createRandomPathConfig = (
  _startX: number,
  isBoss: boolean
): {
  pathType: 'sinusoidal' | 'linear' | 's-curve' | 'swoop';
  amplitude: number;
  frequency: number;
  phaseOffset: number;
} => {
  const pathTypes: ('sinusoidal' | 'linear' | 's-curve' | 'swoop')[] = isBoss
    ? ['linear', 'sinusoidal'] // Keep bosses relatively stable so they are readable
    : ['sinusoidal', 's-curve', 'swoop', 'linear'];

  const type = pathTypes[Math.floor(Math.random() * pathTypes.length)];
  
  return {
    pathType: type,
    amplitude: 10 + Math.random() * 25, // Restrict horizontal swing strictly between 10px and 35px
    frequency: 1.0 + Math.random() * 1.5, // gentle wobble
    phaseOffset: Math.random() * Math.PI * 2,
  };
};
