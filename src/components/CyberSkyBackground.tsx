import React, { useEffect, useRef } from 'react';

export const CyberSkyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Create randomized star field
    const starCount = 120;
    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.8 + 0.1, // Move downwards
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    // Grid scroll animation properties
    let gridOffset = 0;
    const gridSpeed = 2.0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing background nebulas (procedural radial gradients)
      const nebula1 = ctx.createRadialGradient(
        width * 0.2, height * 0.3, 10,
        width * 0.2, height * 0.3, width * 0.4
      );
      nebula1.addColorStop(0, 'rgba(79, 70, 229, 0.12)'); // Indigo accent
      nebula1.addColorStop(1, 'rgba(7, 3, 20, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(
        width * 0.8, height * 0.7, 10,
        width * 0.8, height * 0.7, width * 0.3
      );
      nebula2.addColorStop(0, 'rgba(255, 0, 85, 0.06)'); // Magenta glow
      nebula2.addColorStop(1, 'rgba(7, 3, 20, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // 2. Render stars
      stars.forEach(star => {
        // Draw star with soft opacity glow
        ctx.fillStyle = `rgba(0, 243, 255, ${star.opacity * (0.6 + Math.sin(Date.now() * 0.002 + star.x) * 0.4)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Animate star
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });

      // 3. Render Cyberpunk Grid in perspective (drawn dynamically at the bottom)
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
      ctx.lineWidth = 1;

      gridOffset = (gridOffset + gridSpeed) % 40;

      // Draw horizontal grid lines with simple perspective
      const gridStartY = height * 0.45;
      const gridHeight = height * 0.55;
      const step = 40;

      // Draw vertical vanishing lines mapping to center
      const centerVanishingX = width / 2;
      const lineCount = 30;
      for (let i = -lineCount; i <= lineCount; i++) {
        ctx.beginPath();
        ctx.moveTo(centerVanishingX + i * 20, gridStartY);
        ctx.lineTo(centerVanishingX + i * 150, height);
        ctx.stroke();
      }

      // Draw horizontal horizontal lines fading out in distance
      for (let y = gridStartY; y < height; y += step) {
        // Dynamic horizontal lines offset by gridOffset
        const animatedY = y + (gridOffset * ((y - gridStartY) / gridHeight));
        if (animatedY > height) continue;

        // Fading grid colors
        const alpha = Math.min(0.2, ((animatedY - gridStartY) / gridHeight) * 0.18);
        ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, animatedY);
        ctx.lineTo(width, animatedY);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
};
