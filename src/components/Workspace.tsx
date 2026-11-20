import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeftRight, Bookmark, Brush, Check, Expand, Eye, GitCompareArrows,
  Hand, Layers3, Maximize2, RotateCcw, ScanSearch, ZoomIn, ZoomOut,
} from 'lucide-react';
import type { StudioAsset, WorkspaceTab, WorkspaceTool } from '../types/studio';

type Point = { x: number; y: number };
type Stroke = Point[];

interface WorkspaceProps {
  assets: StudioAsset[];
  activeAsset: StudioAsset;
  compareAsset: StudioAsset;
  tab: WorkspaceTab;
  tool: WorkspaceTool;
  zoom: number;
  onTabChange: (tab: WorkspaceTab) => void;
  onToolChange: (tool: WorkspaceTool) => void;
  onZoomChange: (zoom: number) => void;
  onSelectAsset: (id: string) => void;
  onToggleKeeper: (id: string) => void;
  onToast: (message: string, detail?: string) => void;
}

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'main', label: 'Main image' },
  { id: 'reference', label: 'Reference image' },
  { id: 'extra', label: 'Extra image' },
];

const tools: Array<{ id: WorkspaceTool; label: string; Icon: typeof Hand }> = [
  { id: 'pan', label: 'Pan image', Icon: Hand },
  { id: 'inspect', label: 'Detail lens', Icon: ScanSearch },
  { id: 'compare', label: 'Compare images', Icon: GitCompareArrows },
  { id: 'mask', label: 'Paint mask', Icon: Brush },
];

export function Workspace({
  assets, activeAsset, compareAsset, tab, tool, zoom, onTabChange,
  onToolChange, onZoomChange, onSelectAsset, onToggleKeeper, onToast,
}: WorkspaceProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [comparison, setComparison] = useState(50);
  const [lens, setLens] = useState<Point | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [toolsOpen, setToolsOpen] = useState(true);

  const lineage = [activeAsset, ...assets.filter((asset) => asset.id !== activeAsset.id)].slice(0, 6);
  const source = tab === 'main' ? activeAsset : tab === 'reference' ? compareAsset : assets[2] ?? activeAsset;

  useEffect(() => {
    setStrokes([]);
    setPan({ x: 0, y: 0 });
  }, [source.id]);

  function localPoint(event: ReactPointerEvent<HTMLDivElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (tool === 'mask') {
      drawingRef.current = true;
      setStrokes((current) => [...current, [localPoint(event)]]);
      event.currentTarget.setPointerCapture(event.pointerId);
    } else if (tool === 'pan') {
      dragRef.current = { x: event.clientX, y: event.clientY, startX: pan.x, startY: pan.y };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const point = localPoint(event);
    if (tool === 'inspect') setLens(point);
    if (tool === 'mask' && drawingRef.current) {
      setStrokes((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last) next[next.length - 1] = [...last, point];
        return next;
      });
    }
    if (tool === 'pan' && dragRef.current) {
      setPan({
        x: dragRef.current.startX + event.clientX - dragRef.current.x,
        y: dragRef.current.startY + event.clientY - dragRef.current.y,
      });
    }
  }

  function pointerUp() {
    drawingRef.current = false;
    dragRef.current = null;
  }

  function resetView() {
    setPan({ x: 0, y: 0 });
    onZoomChange(100);
  }

  const toolCursor = tool === 'mask' ? 'crosshair' : tool === 'inspect' ? 'none' : tool === 'pan' ? 'grab' : 'default';

  return (
    <section className="workspace-panel" aria-label="Image workspace">
      <div className="panel-heading workspace-heading">
        <div className="heading-left">
          <span className="eyebrow">01 / Workspace</span>
          <span className="heading-separator" />
          <span className="heading-subtitle">Image canvas</span>
        </div>
        <div className="workspace-meta"><span className="status-dot" /> Canvas ready <span className="meta-separator">/</span> {zoom}%</div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Image source">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={`workspace-tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            {tab === item.id && <motion.span layoutId="workspace-tab-glow" className="tab-active-glow" transition={{ type: 'spring', stiffness: 360, damping: 34 }} />}
            <span>{item.label}</span>
          </button>
        ))}
        <div className="tabs-tail"><Layers3 size={13} /> 03 surfaces</div>
      </div>

      <div className="image-shell">
        <div
          ref={stageRef}
          className={`image-stage mode-${tool}`}
          style={{ cursor: toolCursor }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onPointerLeave={() => setLens(null)}
          aria-label="Interactive image canvas"
        >
          <div className="stage-ambient" style={{ backgroundImage: `url("${source.src}")` }} />
          <div className="stage-image-transform" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}>
            <img className="stage-image" src={source.src} alt={source.title} draggable={false} />
            {tool === 'compare' && tab === 'main' && (
              <div className="comparison-layer" style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}>
                <img src={compareAsset.src} alt={`Comparison: ${compareAsset.title}`} draggable={false} />
              </div>
            )}
          </div>

          <div className="image-top-overlay">
            <span className="image-index">ARK / IMG {activeAsset.id.replace('demo-', '').slice(-3)}</span>
            <span className="image-flag"><span className="flag-pip" /> {tool === 'mask' ? 'Mask editing' : tool === 'inspect' ? 'Detail inspection' : tool === 'compare' ? 'A / B comparison' : 'Preview mode'}</span>
          </div>

          {tool === 'compare' && tab === 'main' && (
            <div className="compare-control" style={{ left: `${comparison}%` }}>
              <span className="compare-label compare-label-a">A / Original</span>
              <div className="compare-line" />
              <span className="compare-handle"><ArrowLeftRight size={17} /></span>
              <span className="compare-label compare-label-b">B / Variant</span>
            </div>
          )}
          {tool === 'compare' && tab === 'main' && (
            <input
              className="compare-range"
              type="range" min="0" max="100" value={comparison}
              aria-label="Image comparison split"
              onChange={(event) => setComparison(Number(event.target.value))}
            />
          )}

          {tool === 'mask' && (
            <svg className="mask-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Painted mask overlay">
              {strokes.map((stroke, index) => (
                <polyline key={index} points={stroke.map((p) => `${p.x},${p.y}`).join(' ')} stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".9" />
              ))}
            </svg>
          )}

          {tool === 'inspect' && lens && (
            <div
              className="inspection-lens"
              style={{
                left: `${lens.x}%`, top: `${lens.y}%`,
                backgroundImage: `url("${source.src}")`,
                backgroundPosition: `${lens.x}% ${lens.y}%`,
              }}
            >
              <span className="lens-crosshair" />
            </div>
          )}

          <div className="image-bottom-info">
            <div className="image-title-block">
              <span className="image-caption">CURRENT STUDY / {activeAsset.collection.toUpperCase()}</span>
              <h2>{source.title}</h2>
            </div>
            <button
              type="button" className={`image-keeper ${activeAsset.keeper ? 'is-keeper' : ''}`}
              aria-label={activeAsset.keeper ? 'Remove from Keepers' : 'Mark as Keeper'}
              onClick={() => onToggleKeeper(activeAsset.id)}
            >
              {activeAsset.keeper ? <Check size={15} /> : <Bookmark size={15} />}
              {activeAsset.keeper ? 'Keeper' : 'Keep'}
            </button>
          </div>
        </div>

        <div className="floating-toolbar" aria-label="Image tools">
          <button type="button" className="toolbar-head" aria-label={toolsOpen ? 'Collapse tools' : 'Expand tools'} onClick={() => setToolsOpen((open) => !open)}>
            <span className="toolbar-head-dots"><i /><i /><i /></span>
            <span className="toolbar-head-text">Tools</span>
            <span className="toolbar-chevron">{toolsOpen ? '−' : '+'}</span>
          </button>
          {toolsOpen && (
            <div className="toolbar-body">
              {tools.map(({ id, label, Icon }) => (
                <button type="button" key={id} title={label} aria-label={label} aria-pressed={tool === id} className={`tool-button ${tool === id ? 'selected' : ''}`} onClick={() => { onToolChange(id); setLens(null); }}>
                  <Icon size={17} strokeWidth={1.8} />
                </button>
              ))}
              <span className="tool-divider" />
              <button type="button" className="tool-button" title="Fit image" aria-label="Fit image" onClick={resetView}><Maximize2 size={16} /></button>
              <button type="button" className="tool-button" title="Fullscreen" aria-label="Fullscreen" onClick={() => { void stageRef.current?.requestFullscreen?.(); }}><Expand size={16} /></button>
            </div>
          )}
        </div>

        <div className="floating-iterations" aria-label="Iteration history">
          <div className="iteration-heading"><span>ITERATIONS</span><span className="iteration-count">{String(lineage.length).padStart(2, '0')} / 06</span></div>
          <div className="iteration-list">
            {lineage.map((asset, index) => (
              <motion.button
                layout
                type="button"
                key={asset.id}
                className={`iteration-thumb ${asset.id === activeAsset.id ? 'selected' : ''}`}
                title={asset.title}
                aria-label={`View iteration ${index + 1}: ${asset.title}`}
                aria-pressed={asset.id === activeAsset.id}
                onClick={() => onSelectAsset(asset.id)}
                whileHover={{ y: -7 }}
                transition={{ type: 'spring', stiffness: 390, damping: 29 }}
              >
                <img src={asset.thumb} alt="" draggable={false} />
                <span className="iteration-number">{String(index + 1).padStart(2, '0')}</span>
                {asset.keeper && <Bookmark className="iteration-bookmark" size={12} fill="currentColor" />}
              </motion.button>
            ))}
          </div>
          <div className="iteration-hint">Select a frame to revisit an iteration</div>
        </div>

        <div className="viewport-foot">
          <div className="foot-image-meta"><span className="mono-dot" /> {activeAsset.model} <span className="meta-separator">/</span> {activeAsset.ratio} <span className="meta-separator">/</span> Seed {activeAsset.seed}</div>
          <div className="viewport-zoom">
            {tool === 'mask' && (
              <>
                <button type="button" title="Undo mask stroke" onClick={() => setStrokes((current) => current.slice(0, -1))}><RotateCcw size={14} /></button>
                <button type="button" title="Clear mask" onClick={() => { setStrokes([]); onToast('Mask cleared', 'Preview-only mask strokes were reset.'); }}><Brush size={14} /></button>
                <span className="zoom-separator" />
              </>
            )}
            <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => onZoomChange(Math.max(50, zoom - 25))}><ZoomOut size={15} /></button>
            <button type="button" className="zoom-readout" onClick={resetView} title="Reset zoom">{zoom}%</button>
            <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => onZoomChange(Math.min(250, zoom + 25))}><ZoomIn size={15} /></button>
            <span className="zoom-separator" />
            <Eye size={14} className="muted-icon" />
          </div>
        </div>
      </div>
    </section>
  );
}
