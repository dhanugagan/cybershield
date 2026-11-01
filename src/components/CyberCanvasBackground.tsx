/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface CyberCanvasBackgroundProps {
  reducedMotion?: boolean;
  highContrast?: boolean;
  alertMode?: boolean; // When active threat or DEFCON 1-2
}

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  color: string;
}

export const CyberCanvasBackground: React.FC<CyberCanvasBackgroundProps> = ({
  reducedMotion = false,
  highContrast = false,
  alertMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    if (highContrast) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Create interactive cyber nodes
    const nodeCount = Math.min(50, Math.floor((width * height) / 30000));
    const nodes: NodePoint[] = [];

    const colors = alertMode
      ? ['#ef4444', '#f97316', '#fbbf24']
      : ['#00f0ff', '#06b6d4', '#6366f1', '#10b981'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: 1.5 + Math.random() * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let radarAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw digital circuit grid lines
      ctx.strokeStyle = alertMode ? 'rgba(239, 68, 68, 0.04)' : 'rgba(0, 240, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Subtle Radar Sweep from center top
      if (!reducedMotion) {
        radarAngle += alertMode ? 0.025 : 0.015;
        const centerX = width * 0.5;
        const centerY = Math.min(height * 0.35, 300);
        const radarRadius = Math.max(width, height) * 0.75;

        const sweepGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radarRadius
        );
        sweepGrad.addColorStop(0, alertMode ? 'rgba(239, 68, 68, 0.06)' : 'rgba(0, 240, 255, 0.05)');
        sweepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radarRadius, radarAngle - 0.25, radarAngle);
        ctx.closePath();
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Radar line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(radarAngle) * radarRadius,
          centerY + Math.sin(radarAngle) * radarRadius
        );
        ctx.strokeStyle = alertMode ? 'rgba(239, 68, 68, 0.18)' : 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Update & render interconnected cyber nodes
      const mouse = mouseRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        if (!reducedMotion) {
          n.x += n.vx;
          n.y += n.vy;
          n.pulsePhase += 0.03;

          // Bounce off screen borders
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;

          // Mouse gravity / repulsion
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          if (distMouse < 180 && distMouse > 10) {
            n.x -= (dxMouse / distMouse) * 0.8;
            n.y -= (dyMouse / distMouse) * 0.8;
          }
        }

        // Draw node dot
        const pulse = 1 + Math.sin(n.pulsePhase) * 0.35;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * (alertMode ? 0.22 : 0.14);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = alertMode
              ? `rgba(239, 68, 68, ${alpha})`
              : `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      if (!reducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion, highContrast, alertMode]);

  if (highContrast) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full opacity-70" />
      {/* Scanline CRT overlay effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25 pointer-events-none" />
      {/* Vignette border */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#030612]/90 pointer-events-none" />
    </div>
  );
};
