import type { CSSProperties } from 'react';

/** Ark-owned dot-matrix activity indicator, inspired by the earlier Flickering Grid / Glyph Matrix research.
 * Indeterminate: the backend does not provide a reliable percentage yet.
 * Mounted only while a generation is active; no animation timers or canvas loop.
 */
export function GenerationMatrix({ model }: { model: string }) {
  return (
    <div className="ark-generation-overlay" role="status" aria-live="polite">
      <div className="ark-generation-card canvas-glass">
        <div className="ark-generation-kicker"><span className="status-dot"/> GENERATION / ACTIVE</div>
        <div className="ark-generation-matrix" aria-hidden="true">
          {Array.from({ length: 105 }, (_, i) => {
            const x = i % 15;
            const y = Math.floor(i / 15);
            const phase = Math.hypot(x - 7, y - 3) * .105 + ((i * 17) % 9) * .035;
            return <span key={i} className="ark-generation-dot" style={{ '--dot-delay': `${-phase}s` } as CSSProperties}/>;
          })}
        </div>
        <strong>Creating your image</strong>
        <span className="ark-generation-model">{model} · Simulated preview</span>
        <span className="ark-generation-note">Your current image stays in view until the new iteration is ready.</span>
      </div>
    </div>
  );
}
