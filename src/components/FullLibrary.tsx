import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowUpDown, Bookmark, CalendarDays, Check, ChevronRight, Copy, Folder,
  FolderOpen, GitCompareArrows, ImagePlus, Images, Info, Layers3,
  LayoutGrid, Maximize2, Search, SlidersHorizontal, Sparkles, Trash2, X,
} from 'lucide-react';
import { AssetActionMenu } from './library/AssetActionMenu';
import type { AssetMenuTarget } from './library/AssetActionMenu';
import { LibraryTile } from './library/LibraryTile';
import {
  createStressLibrary, filterLibrary, libraryAspect, resolveLibraryAssetId,
} from '../lib/library';
import type { LibraryScope, LibrarySort } from '../lib/library';
import type { StudioAsset } from '../types/studio';

interface FullLibraryProps {
  assets: StudioAsset[];
  activeId: string;
  initialInspectId?: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCompare: (id: string) => void;
  onAddReference: (id: string) => void;
  onToggleKeeper: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onToast: (message: string, detail?: string) => void;
}

const views: Array<{ id: LibraryScope; label: string; icon: typeof Images }> = [
  { id: 'all', label: 'All images', icon: Images },
  { id: 'keepers', label: 'Keepers', icon: Bookmark },
  { id: 'recent', label: 'Recently added', icon: CalendarDays },
  { id: 'imports', label: 'Imports', icon: ImagePlus },
  { id: 'generations', label: 'Generations', icon: Sparkles },
];

const GAP = 6;

export function FullLibrary({
  assets, activeId, initialInspectId, onClose,
  onSelect, onCompare, onAddReference, onToggleKeeper,
  onDelete, onImport, onToast,
}: FullLibraryProps) {
  const [scope, setScope] = useState<LibraryScope>('all');
  const [collection, setCollection] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [sort, setSort] = useState<LibrarySort>('newest');
  const [search, setSearch] = useState('');
  const [compact, setCompact] = useState(false);
  const [stressMode, setStressMode] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(Boolean(initialInspectId));
  const [inspectedId, setInspectedId] = useState<string | null>(initialInspectId ?? null);
  const [menu, setMenu] = useState<AssetMenuTarget | null>(null);
  const [viewportWidth, setViewportWidth] = useState(940);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dismissMenu = useCallback(() => setMenu(null), []);

  const catalog = useMemo(() => stressMode ? createStressLibrary(assets) : assets, [assets, stressMode]);
  const collections = useMemo(() => [...new Set(assets.map((asset) => asset.collection))].sort(), [assets]);
  const models = useMemo(() => [...new Set(assets.map((asset) => asset.model))].sort(), [assets]);

  const visible = useMemo(() => filterLibrary(catalog, {
    search, scope, collection: collection ?? undefined, model: model ?? undefined,
    sort, recentLimit: 36,
  }), [catalog, collection, model, scope, search, sort]);

  const selected = useMemo(() => catalog.find((asset) => asset.id === inspectedId)
    ?? assets.find((asset) => asset.id === resolveLibraryAssetId(inspectedId ?? ''))
    ?? null, [assets, catalog, inspectedId]);

  const availableWidth = Math.max(340, viewportWidth - 30);
  const columns = Math.max(2, Math.min(7, Math.floor(availableWidth / (compact ? 155 : 218))));
  const columnWidth = (availableWidth - GAP * (columns - 1)) / columns;

  const getItemKey = useCallback((index: number) => visible[index]?.id ?? index, [visible]);
  const estimateSize = useCallback((index: number) => Math.ceil(columnWidth / libraryAspect(visible[index])), [columnWidth, visible]);

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollerRef.current,
    getItemKey,
    estimateSize,
    lanes: columns,
    gap: GAP,
    overscan: 6,
    laneAssignmentMode: 'estimate',
  });

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setViewportWidth(width);
    });
    observer.observe(element);
    setViewportWidth(element.clientWidth);
    return () => observer.disconnect();
  }, [inspectorOpen]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [scope, search, collection, model, sort, stressMode, compact]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = bodyOverflow;
      previous?.focus();
    };
  }, []);

  function selectScope(next: LibraryScope) {
    setScope(next);
    setCollection(null);
    setModel(null);
  }

  function inspect(id: string) {
    setInspectedId(id);
    setInspectorOpen(true);
  }

  function openWorkspace(id: string) {
    onSelect(resolveLibraryAssetId(id));
    onClose();
  }

  function compareAsset(id: string) {
    onCompare(resolveLibraryAssetId(id));
    onClose();
  }

  function sendReference(id: string) {
    onAddReference(resolveLibraryAssetId(id));
    onToast('Sent to reference slot', 'The image is available in Studio Controls.');
  }

  function toggleKeeper(id: string) {
    onToggleKeeper(resolveLibraryAssetId(id));
  }

  function deletePreview(id: string) {
    if (!window.confirm('Remove this image from the browser preview? No files will be deleted from disk.')) return;
    onDelete(resolveLibraryAssetId(id));
    setInspectedId(null);
    setInspectorOpen(false);
  }

  function contextMenu(event: MouseEvent<HTMLElement>, id: string) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ id, x: event.clientX || event.currentTarget.getBoundingClientRect().right, y: event.clientY || event.currentTarget.getBoundingClientRect().top });
  }

  function dialogKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !menu) {
      event.preventDefault();
      onClose();
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
    )).filter((node) => node.getBoundingClientRect().width > 0);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      setScope('all');
      setCollection(null);
      setModel(null);
      setSearch('');
      setStressMode(false);
    }
    event.target.value = '';
  }

  async function copyPrompt(asset: StudioAsset) {
    try {
      await navigator.clipboard.writeText(asset.prompt);
      onToast('Prompt copied', asset.title);
    } catch {
      onToast('Clipboard unavailable', 'Allow clipboard access in this browser.');
    }
  }

  const menuAsset = catalog.find((asset) => asset.id === menu?.id);
  const realCount = assets.length;

  return (
    <div ref={dialogRef} className="ark-full-library" role="dialog" aria-modal="true" aria-label="Full Image Library" onKeyDown={dialogKeys}>
      <header className="ark-library-topbar">
        <div className="ark-library-mark"><Layers3 size={20}/></div>
        <div className="ark-library-brand"><span>ARK / ARCHIVE</span><strong>Image Library</strong></div>
        <div className="ark-library-breadcrumb"><ChevronRight size={13}/>{collection ?? views.find((view) => view.id === scope)?.label}<span>/</span>{visible.length} images</div>
        <div className="ark-library-topbar-spacer"/>
        <div className="ark-library-topbar-meta"><span className="status-dot"/> FRONTEND PREVIEW <span>·</span> {realCount} assets</div>
        <label className="ark-library-import">
          <ImagePlus size={16}/><span>Import image</span>
          <input type="file" accept="image/*" onChange={importFile} aria-label="Import an image into preview"/>
        </label>
        <button ref={closeRef} type="button" className="ark-library-close" onClick={onClose} title="Return to studio (Esc)" aria-label="Close Full Library"><X size={21}/></button>
      </header>

      <div className={`ark-library-shell ${inspectorOpen ? 'inspector-visible' : ''}`}>
        <nav className="ark-library-sidebar" aria-label="Library navigation">
          <div className="ark-sidebar-section-label">QUICK VIEWS</div>
          <div className="ark-sidebar-nav">
            {views.map(({ id, label, icon: Icon }) => {
              const count = id === 'all' ? catalog.length
                : id === 'keepers' ? catalog.filter((asset) => asset.keeper).length
                : id === 'recent' ? Math.min(36, catalog.length)
                : id === 'imports' ? catalog.filter((asset) => asset.collection === 'Imports').length
                : catalog.filter((asset) => asset.collection === 'New Generations').length;
              return (
                <button type="button" key={id} className={scope === id && !collection && !model ? 'active' : ''} onClick={() => selectScope(id)}>
                  <Icon size={16}/><span>{label}</span><small>{count}</small>
                </button>
              );
            })}
          </div>

          <div className="ark-sidebar-section-label">COLLECTIONS <span>{collections.length}</span></div>
          <div className="ark-sidebar-nav ark-sidebar-folders">
            {collections.map((name) => (
              <button type="button" key={name} className={collection === name ? 'active' : ''} onClick={() => { setScope('all'); setCollection(name); setModel(null); }}>
                {collection === name ? <FolderOpen size={15}/> : <Folder size={15}/>}
                <span>{name}</span><small>{assets.filter((asset) => asset.collection === name).length}</small>
              </button>
            ))}
          </div>

          <div className="ark-sidebar-section-label">IMAGE ENGINES</div>
          <div className="ark-sidebar-nav ark-sidebar-models">
            {models.map((name) => (
              <button type="button" key={name} className={model === name ? 'active' : ''} onClick={() => { setScope('all'); setCollection(null); setModel(name); }}>
                <Layers3 size={14}/><span>{name}</span>
              </button>
            ))}
          </div>
          <div className="ark-library-sidebar-foot"><Info size={15}/><span>The browser library uses mock data. Your Windows library and backend remain untouched.</span></div>
        </nav>

        <main className="ark-library-main">
          <div className="ark-library-workhead">
            <div>
              <span className="section-kicker">VISUAL ASSET WORKSPACE</span>
              <h1>{collection ?? model ?? views.find((view) => view.id === scope)?.label}</h1>
              <p>Browse visually, inspect metadata, and send images straight into your studio.</p>
            </div>
            <button type="button" className="ark-library-inspector-toggle" onClick={() => {
              if (!inspectorOpen && !selected) setInspectedId(visible[0]?.id ?? null);
              setInspectorOpen((open) => !open);
            }}>
              <Info size={16}/>{inspectorOpen ? 'Hide details' : 'Show details'}
            </button>
          </div>

          <div className="ark-library-tools">
            <label className="ark-library-global-search">
              <Search size={17}/>
              <input type="search" placeholder="Search titles, prompts, models, seeds or IDs…" aria-label="Search Full Library" value={search} onChange={(event) => setSearch(event.target.value)}/>
              {search && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => setSearch('')}><X size={15}/></button>}
            </label>
            <label className="ark-library-sort">
              <ArrowUpDown size={15}/>
              <select aria-label="Sort images" value={sort} onChange={(event) => setSort(event.target.value as LibrarySort)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">By title</option>
                <option value="model">By model</option>
              </select>
            </label>
            <button type="button" className={compact ? 'ark-library-icon-button selected' : 'ark-library-icon-button'} title={compact ? 'Comfortable thumbnails' : 'Compact thumbnails'} aria-label="Toggle thumbnail density" aria-pressed={compact} onClick={() => setCompact((value) => !value)}>
              <LayoutGrid size={18}/>
            </button>
            <button type="button" className={stressMode ? 'ark-library-stress selected' : 'ark-library-stress'} aria-pressed={stressMode} title="Test virtual scrolling with 5,000 synthetic image records" onClick={() => { setStressMode((value) => !value); setInspectedId(null); setInspectorOpen(false); }}>
              <SlidersHorizontal size={15}/>{stressMode ? '5K DEMO ON' : '5K TEST'}
            </button>
          </div>

          <div className="ark-library-grid-summary">
            <span><LayoutGrid size={14}/> {visible.length.toLocaleString()} {stressMode ? 'SYNTHETIC PREVIEW IMAGES' : 'IMAGES'} <span className="ark-library-summary-separator">/</span> {columns} COLUMNS</span>
            <span>CLICK TO INSPECT <span>·</span> DOUBLE-CLICK TO OPEN <span>·</span> RIGHT-CLICK FOR ACTIONS</span>
          </div>

          <div className="ark-library-scroller" ref={scrollerRef} tabIndex={0} aria-label="Scrollable image grid">
            {visible.length ? (
              <div className="ark-library-virtual-plane" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const asset = visible[item.index];
                  if (!asset) return null;
                  return (
                    <div
                      className="ark-library-virtual-cell"
                      key={item.key}
                      data-index={item.index}
                      ref={virtualizer.measureElement}
                      style={{
                        width: columnWidth,
                        height: item.size,
                        transform: `translate3d(${item.lane * (columnWidth + GAP)}px, ${item.start}px, 0)`,
                      }}
                    >
                      <LibraryTile
                        asset={asset}
                        size="full"
                        selected={inspectedId === asset.id}
                        onOpen={() => inspect(asset.id)}
                        onInspect={() => inspect(asset.id)}
                        onDoubleClick={() => openWorkspace(asset.id)}
                        onContextMenu={(event) => contextMenu(event, asset.id)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ark-library-empty">
                <Images size={32}/><h3>Nothing in this view</h3>
                <p>Try a different search, collection, or image engine.</p>
                <button type="button" onClick={() => { setScope('all'); setCollection(null); setModel(null); setSearch(''); }}>Clear all filters</button>
              </div>
            )}
          </div>

          <footer className="ark-library-footer">
            <span><span className="status-dot"/> {stressMode ? '5,000 synthetic records · virtual scrolling' : 'Browser preview assets · no disk changes'}</span>
            <span><Maximize2 size={13}/> {inspectorOpen ? 'Inspector active' : 'Image-only view'} <span className="ark-library-foot-dot">·</span> Esc to studio</span>
          </footer>
        </main>

        {inspectorOpen && (
          <aside className="ark-library-inspector" aria-label="Asset inspector">
            <div className="ark-inspector-heading"><span>IMAGE INSPECTOR</span><button type="button" title="Hide details" aria-label="Hide details panel" onClick={() => setInspectorOpen(false)}><X size={18}/></button></div>
            {selected ? (
              <div className="ark-inspector-scroll">
                <div className="ark-inspector-preview"><img src={selected.src} alt={selected.title}/></div>
                <div className="ark-inspector-title">
                  <span>SELECTED ASSET</span>
                  <h2>{selected.title}</h2>
                  {selected.keeper && <small><Bookmark size={13} fill="currentColor"/> Keeper</small>}
                </div>
                <div className="ark-inspector-primary-actions">
                  <button type="button" className="primary" onClick={() => openWorkspace(selected.id)}><Images size={15}/> Open in studio</button>
                  <button type="button" onClick={() => compareAsset(selected.id)} title="Compare with active canvas image"><GitCompareArrows size={16}/></button>
                  <button type="button" onClick={() => sendReference(selected.id)} title="Send to reference"><ImagePlus size={16}/></button>
                </div>
                <div className="ark-inspector-section-heading">TECHNICAL DETAILS</div>
                <dl className="ark-inspector-facts">
                  <div><dt>Model</dt><dd>{selected.model}</dd></div>
                  <div><dt>Aspect</dt><dd>{selected.ratio}</dd></div>
                  <div><dt>Seed</dt><dd>{selected.seed || 'Unknown'}</dd></div>
                  <div><dt>Created</dt><dd>{selected.createdAt}</dd></div>
                  <div><dt>Collection</dt><dd>{selected.collection}</dd></div>
                  <div><dt>Keeper</dt><dd>{selected.keeper ? 'Yes' : 'No'}</dd></div>
                </dl>
                <div className="ark-inspector-section-heading">PROMPT <button type="button" title="Copy prompt" aria-label="Copy prompt" onClick={() => { void copyPrompt(selected); }}><Copy size={15}/></button></div>
                <p className="ark-inspector-prompt">{selected.prompt || 'No prompt recorded for this image.'}</p>
                <div className="ark-inspector-section-heading">IDENTIFIERS</div>
                <dl className="ark-inspector-ids">
                  <div><dt>Asset ID</dt><dd>{resolveLibraryAssetId(selected.id)}</dd></div>
                  {selected.parentId && <div><dt>Parent ID</dt><dd>{selected.parentId}</dd></div>}
                  {selected.lineageId && <div><dt>Lineage</dt><dd>{selected.lineageId}</dd></div>}
                </dl>
                <div className="ark-inspector-secondary-actions">
                  <button type="button" onClick={() => toggleKeeper(selected.id)}><Bookmark size={15}/>{selected.keeper ? 'Remove Keeper' : 'Mark as Keeper'}</button>
                  <button type="button" className="danger" onClick={() => deletePreview(selected.id)}><Trash2 size={15}/> Remove preview</button>
                </div>
                <p className="ark-inspector-safety">Preview-only metadata. The production vault, filenames and backend IDs are not modified here.</p>
              </div>
            ) : (
              <div className="ark-inspector-placeholder"><Info size={27}/><strong>Choose an image</strong><span>Select a tile or press its information symbol to view its details here.</span></div>
            )}
          </aside>
        )}
      </div>

      {menu && menuAsset && (
        <AssetActionMenu
          asset={menuAsset} position={menu} onDismiss={dismissMenu}
          onOpen={openWorkspace} onInspect={inspect}
          onCompare={compareAsset} onAddReference={sendReference}
          onToggleKeeper={toggleKeeper} onDelete={deletePreview} onToast={onToast}
        />
      )}
    </div>
  );
}
