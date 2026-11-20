import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import {
  Bookmark, Check, ChevronDown, ChevronRight, Columns2, Columns3, Copy,
  FolderClosed, FolderOpen, FolderTree, GitCompareArrows, Grid2X2,
  ImagePlus, Images, MoreHorizontal, Search, SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import type { GalleryFilter, StudioAsset } from '../types/studio';

interface GalleryProps {
  assets: StudioAsset[];
  activeId: string;
  onSelect: (id: string) => void;
  onToggleKeeper: (id: string) => void;
  onCompare: (id: string) => void;
  onAddReference: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onToast: (message: string, detail?: string) => void;
}

interface MenuPosition { x: number; y: number; id: string }

export function Gallery({
  assets, activeId, onSelect, onToggleKeeper, onCompare, onAddReference,
  onDelete, onImport, onToast,
}: GalleryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [columns, setColumns] = useState<2 | 3>(2);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [collection, setCollection] = useState('All collections');
  const [menu, setMenu] = useState<MenuPosition | null>(null);

  const collections = useMemo(() => [...new Set(assets.map((asset) => asset.collection))], [assets]);
  const visible = useMemo(() => assets.filter((asset, index) => {
    if (filter === 'keepers' && !asset.keeper) return false;
    if (filter === 'recent' && index > 7) return false;
    if (collection !== 'All collections' && asset.collection !== collection) return false;
    const text = `${asset.title} ${asset.prompt} ${asset.model} ${asset.seed} ${asset.collection}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  }), [assets, collection, filter, search]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', close);
    };
  }, [menu]);

  function openMenu(event: ReactMouseEvent<HTMLElement>, id: string) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({
      id,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 214)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 256)),
    });
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = '';
  }

  async function copyPrompt(asset: StudioAsset) {
    try {
      await navigator.clipboard.writeText(asset.prompt);
      onToast('Asset prompt copied', asset.title);
    } catch {
      onToast('Copy unavailable', 'Clipboard permission is required.');
    }
  }

  const selected = assets.find((asset) => asset.id === menu?.id);

  return (
    <aside className="gallery-panel" aria-label="Mini Gallery Explorer">
      <div className="panel-heading gallery-heading">
        <div className="heading-left"><span className="eyebrow">03 / Library</span></div>
        <span className="gallery-online"><span className="status-dot" /> LOCAL PREVIEW</span>
      </div>
      <div className="gallery-title-row">
        <div><span className="section-kicker">YOUR VISUAL ARCHIVE</span><h2>Mini Gallery <em>Explorer</em></h2></div>
        <label className="gallery-import-button" title="Import local image to preview" aria-label="Import local image"><ImagePlus size={17} /><input type="file" accept="image/*" onChange={handleImport} /></label>
      </div>

      <div className="gallery-search">
        <Search size={16} />
        <input type="search" aria-label="Search images" placeholder="Search images, seeds, moods…" value={search} onChange={(event) => setSearch(event.target.value)} />
        {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button> : <span className="search-key">/</span>}
      </div>

      <div className="gallery-filters">
        {([['all', 'All'], ['keepers', 'Keepers'], ['recent', 'Recent']] as Array<[GalleryFilter, string]>).map(([id, label]) => (
          <button type="button" key={id} className={filter === id ? 'active' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
        ))}
        <span className="filter-spacer" />
        <button type="button" className={foldersOpen ? 'active-icon' : ''} title="Toggle collections" aria-label="Toggle collections" onClick={() => setFoldersOpen((value) => !value)}><FolderTree size={16} /></button>
        <button type="button" title={columns === 2 ? 'Switch to three columns' : 'Switch to two columns'} aria-label="Change gallery columns" onClick={() => setColumns((value) => value === 2 ? 3 : 2)}>{columns === 2 ? <Columns2 size={16} /> : <Columns3 size={16} />}</button>
      </div>

      {foldersOpen && (
        <div className="gallery-folders" aria-label="Collections">
          <button type="button" className={collection === 'All collections' ? 'active' : ''} onClick={() => setCollection('All collections')}><FolderOpen size={14} /> All collections <span>{assets.length}</span></button>
          {collections.map((name) => (
            <button type="button" key={name} className={collection === name ? 'active' : ''} onClick={() => setCollection(name)}><FolderClosed size={14} /> {name} <span>{assets.filter((asset) => asset.collection === name).length}</span></button>
          ))}
        </div>
      )}

      <div className="gallery-results-head"><span><Grid2X2 size={13} /> {visible.length} ASSETS</span><span>RIGHT-CLICK FOR ACTIONS <ChevronDown size={12} /></span></div>
      <div className="gallery-scroll">
        {visible.length > 0 ? (
          <div className={`gallery-masonry columns-${columns}`}>
            {visible.map((asset, index) => (
              <button
                type="button"
                className={`gallery-card ${activeId === asset.id ? 'selected' : ''}`}
                key={asset.id}
                onClick={() => onSelect(asset.id)}
                onContextMenu={(event) => openMenu(event, asset.id)}
                aria-label={`Open ${asset.title}`}
              >
                <div className="gallery-card-image" style={{ aspectRatio: index % 5 === 1 ? '0.87' : index % 5 === 3 ? '1.35' : '1.05' }}>
                  <img src={asset.thumb} alt="" loading="lazy" />
                  <div className="gallery-card-top">{asset.keeper && <Bookmark size={14} fill="currentColor" />}<span>{String(index + 1).padStart(2, '0')}</span></div>
                  {activeId === asset.id && <span className="gallery-selected-check"><Check size={13} /></span>}
                  <span className="gallery-card-more" onClick={(event) => openMenu(event, asset.id)} role="button" tabIndex={-1} aria-label={`Actions for ${asset.title}`}><MoreHorizontal size={16} /></span>
                </div>
                <div className="gallery-card-caption"><span>{asset.title}</span><small>{asset.model}</small></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="gallery-empty"><Images size={25} /><strong>No matching images</strong><span>Try another search or collection.</span><button type="button" onClick={() => { setSearch(''); setFilter('all'); setCollection('All collections'); }}>Clear filters</button></div>
        )}
      </div>
      <div className="gallery-footer">
        <span><SlidersHorizontal size={13} /> PREVIEW LIBRARY</span>
        <span>{assets.length} total <ChevronRight size={13} /></span>
      </div>

      {menu && selected && (
        <div className="asset-context-menu" style={{ left: menu.x, top: menu.y }} role="menu" aria-label={`Actions for ${selected.title}`} onClick={(event) => event.stopPropagation()}>
          <div className="context-menu-heading">{selected.title}</div>
          <button type="button" role="menuitem" onClick={() => { onSelect(selected.id); setMenu(null); }}><Images size={15} /> Open in workspace</button>
          <button type="button" role="menuitem" onClick={() => { onCompare(selected.id); setMenu(null); }}><GitCompareArrows size={15} /> Compare with current</button>
          <button type="button" role="menuitem" onClick={() => { onAddReference(selected.id); setMenu(null); }}><ImagePlus size={15} /> Send to reference</button>
          <button type="button" role="menuitem" onClick={() => { onToggleKeeper(selected.id); setMenu(null); }}><Bookmark size={15} /> {selected.keeper ? 'Remove Keeper' : 'Mark as Keeper'}</button>
          <button type="button" role="menuitem" onClick={() => { void copyPrompt(selected); setMenu(null); }}><Copy size={15} /> Copy prompt</button>
          <div className="context-divider" />
          <button type="button" role="menuitem" className="danger" onClick={() => { onDelete(selected.id); setMenu(null); }}><Trash2 size={15} /> Remove from preview</button>
        </div>
      )}
    </aside>
  );
}
