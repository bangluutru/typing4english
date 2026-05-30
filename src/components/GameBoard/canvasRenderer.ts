import type { LaserBeam, WordAircraft, Particle, GameSettings } from '../../types/game';

interface FloatingMeaning {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
  emoji?: string;
  color: string;
}

export function drawGameBoardCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  state: {
    lasers: LaserBeam[];
    particles: Particle[];
    floatingMeanings: FloatingMeaning[];
    aircrafts: WordAircraft[];
    lockedTargetId: string | null;
  },
  gameSettings: GameSettings
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // A. Update and Draw Laser beams
  state.lasers.forEach((laser) => {
    laser.alpha -= 0.15; // Fast decay
    if (laser.alpha > 0) {
      ctx.strokeStyle = laser.color;
      ctx.lineWidth = laser.thickness * laser.alpha;
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(laser.startX, laser.startY);
      ctx.lineTo(laser.endX, laser.endY);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  });
  state.lasers = state.lasers.filter((l) => l.alpha > 0);

  // B. Draw Laser Target Beam if target is locked
  if (state.lockedTargetId) {
    const target = state.aircrafts.find((a) => a.id === state.lockedTargetId && a.active);
    if (target) {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const startShipX =
        canvasWidth / 2 -
        (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'right' ? 180 : 0);
      const startShipY =
        canvasHeight -
        (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'bottom' ? 135 : 30);
      ctx.moveTo(startShipX, startShipY);
      ctx.lineTo(target.x + target.width / 2, target.y + target.height / 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }
  }

  // C. Update and Draw Particles
  state.particles.forEach((p) => {
    p.life += 1;
    if (p.life <= p.maxLife) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = 1 - p.life / p.maxLife;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0; // reset
    }
  });
  state.particles = state.particles.filter((p) => p.life <= p.maxLife);

  // D. Update Floating Translations with customizable decay rates
  state.floatingMeanings.forEach((m) => {
    m.y -= 1.2 * gameSettings.meaningFadeSpeedMultiplier; // Float upwards based on multiplier
    m.alpha = Math.max(0, m.alpha - 0.015 * gameSettings.meaningFadeSpeedMultiplier); // slow fade based on multiplier

    if (m.alpha > 0) {
      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.alpha;
      const baseFontSize = 18;
      const sizeMultiplier = gameSettings.meaningFontSizeMultiplier ?? 1.0;
      const fontSize = Math.round(baseFontSize * sizeMultiplier);
      ctx.font = `bold ${fontSize}px "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';

      const textToDraw = m.emoji ? `${m.emoji} ${m.text}` : m.text;
      ctx.fillText(textToDraw, m.x, m.y);

      ctx.globalAlpha = 1.0; // reset
    }
  });
  state.floatingMeanings = state.floatingMeanings.filter((m) => m.alpha > 0);
}
