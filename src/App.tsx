import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check, ChevronDown, CircleHelp, Command, ExternalLink, FolderOpen,
  Images, Layers3, Monitor, Moon, Palette, PanelRightClose, PanelRightOpen,
  Settings2, Sparkles, X,
} from 'lucide-react';
import { Gallery } from './components/Gallery';
import { FullLibrary } from './components/FullLibrary';
import { StudioControls } from './components/StudioControls';
import { Workspace } from './components/Workspace';
import { initialReferences, mockAssets } from './data/mock';
import { mockStudioApi } from './lib/api';
import { getLineage, getLineageWindow } from './lib/lineage';
import type {
  AspectRatio, ReferenceSlot, StudioAsset, StudioNotice, StudioTheme,
  WorkspaceTab, WorkspaceTool,
} from './types/studio';

const defaultPrompt = 'An ancient forest after rainfall, soft shafts of amber light breaking through the canopy, fine atmospheric mist, deep emerald foliage, cinematic composition, exquisite natural texture, subtle film grain, rich shadow detail';

export default function App() {
  const [assets, setAssets] = useState<StudioAsset[]>(mockAssets);
  const [activeId, setActiveId] = useState(mockAssets[0].id);
  const [compareId, setCompareId] = useState(mockAssets[1].id);
  const [references, setReferences] = useState<ReferenceSlot[]>(initialReferences);
  const [tab, setTab] = useState<WorkspaceTab>('main');
  const [tool, setTool] = useState<WorkspaceTool>('pan');
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState<StudioTheme>('nocturne');
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [negativePrompt, setNegativePrompt] = useState('Oversaturated, blurry, plastic textures, distorted geometry');
  const [model, setModel] = useState('Seedream 4.5');
  const [ratio, setRatio] = useState<AspectRatio>('4:3');
  const [resolution, setResolution] = useState('2K');
  const [seed, setSeed] = useState('');
  const [creativity, setCreativity] = useState(42);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<StudioNotice | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [miniLibraryOpen, setMiniLibraryOpen] = useState(() => {
    try { return window.localStorage.getItem('ark-mini-library-visible') !== 'false'; }
    catch { return true; }
  });
  const [fullLibraryOpen, setFullLibraryOpen] = useState(false);
  const [libraryInspectId, setLibraryInspectId] = useState<string | null>(null);
  const [branchOriginId, setBranchOriginId] = useState<string | null>(null);

  const activeAsset = assets.find((asset) => asset.id === activeId) ?? assets[0];
  const compareAsset = assets.find((asset) => asset.id === compareId) ?? assets[1] ?? activeAsset;
  const lineage = getLineage(assets, activeAsset);
  const visibleLineage = getLineageWindow(lineage, activeAsset.id);

  function toast(message: string, detail?: string) {
    setNotice({ id: Date.now(), message, detail, tone: 'success' });
  }

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3900);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    try { window.localStorage.setItem('ark-mini-library-visible', String(miniLibraryOpen)); }
    catch { /* Browser storage is optional. */ }
  }, [miniLibraryOpen]);

  function openFullLibrary(inspectId: string | null = null) {
    setLibraryInspectId(inspectId);
    setFullLibraryOpen(true);
  }

  function closeFullLibrary() {
    setFullLibraryOpen(false);
    setLibraryInspectId(null);
  }

  function toggleKeeper(id: string) {
    setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, keeper: !asset.keeper } : asset));
  }

  function selectAsset(id: string) {
    setActiveId(id);
    setTab('main');
    setBranchOriginId(null);
  }

  function compareWith(id: string) {
    const choice = id === activeId
      ? (lineage.find((asset) => asset.id !== activeId) ?? assets.find((asset) => asset.id !== activeId))
      : assets.find((asset) => asset.id === id);
    if (!choice) return toast('No comparison available', 'Add another image to compare.');
    setCompareId(choice.id);
    setTool('compare');
    setTab('main');
    toast('A/B comparison ready', `Comparing with ${choice.title}.`);
  }

  function branchFrom(id: string) {
    const asset = assets.find((item) => item.id === id);
    if (!asset) return;
    setActiveId(asset.id);
    setBranchOriginId(asset.id);
    setPrompt(asset.prompt);
    setTab('main');
    setTool('pan');
    toast('Branch ready', 'Edit the inherited prompt, then generate a mock child iteration.');
  }

  function importReference(id: string, file: File) {
    const src = URL.createObjectURL(file);
    setReferences((current) => current.map((ref) => ref.id === id ? { ...ref, src, enabled: true } : ref));
    toast('Reference imported', file.name);
  }

  function addAsReference(id: string) {
    const asset = assets.find((item) => item.id === id);
    if (!asset) return;
    const slot = references.find((ref) => !ref.enabled || !ref.src) ?? references[2];
    setReferences((current) => current.map((ref) => ref.id === slot.id ? { ...ref, src: asset.src, enabled: true } : ref));
    toast('Added to reference', asset.title);
  }

  function importGallery(file: File) {
    const src = URL.createObjectURL(file);
    const id = `demo-import-${Date.now()}`;
    const asset: StudioAsset = {
      id, src, thumb: src, title: file.name.replace(/\.[^.]+$/, ''),
      prompt: 'Locally imported preview image', seed: 0, model: 'Local import',
      createdAt: new Date().toISOString().slice(0, 10), collection: 'Imports',
      ratio: '4:3', keeper: false, lineageId: id,
    };
    setAssets((current) => [asset, ...current]);
    setActiveId(asset.id);
    setTab('main');
    setBranchOriginId(null);
    toast('Image imported', 'Stored in browser memory for this session.');
  }

  function deleteAsset(id: string) {
    if (assets.length <= 1) return toast('Keep one image', 'The preview workspace needs at least one image.');
    const removed = assets.find((asset) => asset.id === id);
    const remaining = assets.filter((asset) => asset.id !== id);
    const nextActive = remaining.find((asset) => asset.lineageId === removed?.lineageId) ?? remaining[0];
    setAssets(remaining.map((asset) => asset.parentId === id ? { ...asset, parentId: removed?.parentId } : asset));
    if (activeId === id) setActiveId(nextActive.id);
    if (compareId === id) setCompareId(nextActive.id);
    if (branchOriginId === id) setBranchOriginId(null);
    toast('Removed from preview', 'No files were deleted from disk.');
  }

  async function generate() {
    if (generating || !prompt.trim()) return;
    setGenerating(true);
    toast('Mock generation started', 'Simulating a result locally. No AI service is called.');
    try {
      const parent = assets.find((asset) => asset.id === (branchOriginId ?? activeId)) ?? activeAsset;
      const result = await mockStudioApi.generate({
        prompt, negativePrompt, model, ratio, resolution, seed, creativity,
        parentAssetId: parent.id,
        lineageId: parent.lineageId ?? parent.id,
      });
      setAssets((current) => [result, ...current]);
      setActiveId(result.id);
      setTab('main');
      setTool('pan');
      setBranchOriginId(null);
      toast('New preview iteration', 'Simulated image added to your session gallery.');
    } catch {
      toast('Preview generation failed', 'Try the simulation again.');
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const editing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (fullLibraryOpen) return;
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); void generate(); return; }
      if (event.key === 'Escape') { setHelpOpen(false); return; }
      if (editing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setMiniLibraryOpen((open) => !open);
        return;
      }
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        openFullLibrary();
        return;
      }
      if (/^[1-6]$/.test(event.key)) {
        const selected = visibleLineage[Number(event.key) - 1];
        if (selected) selectAsset(selected.id);
      }
      if (event.key === '?') setHelpOpen(true);
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  });

  return (
    <div className="ark-app" data-theme={theme} data-mini-library={miniLibraryOpen ? "open" : "closed"}>
      <div className="background-photo" />
      <div className="background-vignette" />
      <div className="background-grain" />
      <div className="app-content">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark"><span>A</span><span className="brand-mark-spark">✦</span></div>
            <div className="brand-type"><strong>ARK</strong><span>IMAGE STUDIO <i>V2</i></span></div>
          </div>
          <span className="topbar-divider" />
          <div className="project-crumb">
            <span className="crumb-kicker">CURRENT WORKSPACE</span>
            <div className="crumb-title"><FolderOpen size={14} /> Obsidian Session <span className="crumb-code">/ 004</span><ChevronDown size={13} /></div>
          </div>
          <span className="topbar-divider small" />
          <div className="ark-topbar-library-controls">
            <button type="button" className="ark-topbar-library-button" title="Open Full Library (G)" aria-label="Open Full Library" onClick={() => openFullLibrary()}>
              <Images size={16}/><span>Library</span>
            </button>
            <button type="button" className={`ark-topbar-library-button ${miniLibraryOpen ? 'active' : ''}`} title={miniLibraryOpen ? 'Collapse Mini Library (L)' : 'Show Mini Library (L)'} aria-label={miniLibraryOpen ? 'Collapse Mini Library' : 'Show Mini Library'} aria-pressed={miniLibraryOpen} onClick={() => setMiniLibraryOpen((open) => !open)}>
              {miniLibraryOpen ? <PanelRightClose size={17}/> : <PanelRightOpen size={17}/>}
              <span>Mini</span>
            </button>
          </div>
          <div className="topbar-spacer" />
          <span className="topbar-divider small" />
          <div className="theme-selector"><Palette size={15} /><select aria-label="Color theme" value={theme} onChange={(event) => setTheme(event.target.value as StudioTheme)}><option value="nocturne">Nocturne</option><option value="mineral">Mineral</option><option value="ember">Ember</option></select><ChevronDown size={12} /></div>
          <button type="button" className="topbar-icon" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts" onClick={() => setHelpOpen(true)}><CircleHelp size={18} /></button>
          <a className="topbar-icon" title="Open GitHub repository" aria-label="Open GitHub repository" href="https://github.com/single-spider/Ark-Image-Studio" target="_blank" rel="noreferrer"><ExternalLink size={17} /></a>
        </header>

        <main className={`studio-layout ${miniLibraryOpen ? '' : 'gallery-collapsed'}`}>
          <Workspace
            assets={assets} activeAsset={activeAsset} compareAsset={compareAsset}
            tab={tab} tool={tool} zoom={zoom} onTabChange={setTab} onToolChange={setTool}
            onZoomChange={setZoom} onSelectAsset={selectAsset}
            lineage={visibleLineage} lineageCount={lineage.length}
            onCompareAsset={compareWith} onBranchAsset={branchFrom}
            onSendToReference={addAsReference} onDeleteAsset={deleteAsset}
            onToggleKeeper={toggleKeeper} onToast={toast}
          />
          <StudioControls
            references={references} prompt={prompt} negativePrompt={negativePrompt}
            model={model} ratio={ratio} resolution={resolution} seed={seed}
            creativity={creativity} generating={generating}
            onReferenceImport={importReference}
            onReferenceToggle={(id) => setReferences((current) => current.map((ref) => ref.id === id ? { ...ref, enabled: !ref.enabled } : ref))}
            onReferenceClear={(id) => setReferences((current) => current.map((ref) => ref.id === id ? { ...ref, src: null, enabled: false } : ref))}
            onPromptChange={setPrompt} onNegativePromptChange={setNegativePrompt}
            onModelChange={setModel} onRatioChange={setRatio}
            onResolutionChange={setResolution} onSeedChange={setSeed}
            onCreativityChange={setCreativity} onGenerate={() => { void generate(); }} onToast={toast}
          />
          <Gallery
            assets={assets} activeId={activeId}
            onSelect={selectAsset}
            onInspect={(id) => openFullLibrary(id)}
            onOpenFullLibrary={() => openFullLibrary()}
            onCollapse={() => setMiniLibraryOpen(false)}
            onToggleKeeper={toggleKeeper}
            onCompare={compareWith}
            onAddReference={addAsReference} onDelete={deleteAsset}
            onImport={importGallery} onToast={toast}
          />
        </main>

        <footer className="statusbar">
          <div className="statusbar-left"><span className="statusbrand">ARK</span><span className="statusbar-rule" /> v2.0 PREVIEW <span className="statusbar-rule" /><span className="status-indicator"><span className="status-dot" /> MOCK API / NO AI CALLS</span></div>
          <div className="statusbar-center"><Moon size={12} /> Crafted for the darkroom</div>
          <div className="statusbar-right"><Layers3 size={13} /> {assets.length} images <span className="statusbar-rule" /><Command size={13} /> Ctrl + Enter to simulate <span className="statusbar-rule" /><Settings2 size={13} /> React 19</div>
        </footer>
      </div>

      {fullLibraryOpen && (
        <FullLibrary
          assets={assets}
          activeId={activeId}
          initialInspectId={libraryInspectId}
          onClose={closeFullLibrary}
          onSelect={selectAsset}
          onCompare={compareWith}
          onAddReference={addAsReference}
          onToggleKeeper={toggleKeeper}
          onDelete={deleteAsset}
          onImport={importGallery}
          onToast={toast}
        />
      )}

      <AnimatePresence>
        {notice && (
          <motion.div className="studio-toast" role="status" key={notice.id} initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .97 }} transition={{ duration: .22 }}>
            <div className="toast-icon"><Check size={17} /></div>
            <div><strong>{notice.message}</strong>{notice.detail && <span>{notice.detail}</span>}</div>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {helpOpen && (
          <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setHelpOpen(false)}>
            <motion.div className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: .98 }} onMouseDown={(event) => event.stopPropagation()}>
              <div className="help-modal-head"><div><span className="section-kicker">WORKSPACE REFERENCE</span><h2 id="help-title">Keyboard & controls</h2></div><button type="button" aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={18} /></button></div>
              <div className="help-shortcuts">
                <div><span>Simulate generation</span><kbd>Ctrl / ⌘ + Enter</kbd></div>
                <div><span>Select visible iteration</span><kbd>1 — 6</kbd></div>
                <div><span>Compare iteration with main</span><kbd>Shift + click</kbd></div>
                <div><span>Toggle Keeper</span><kbd>Double-click frame</kbd></div>
                <div><span>Lineage actions</span><kbd>Right-click / Shift + F10</kbd></div>
                <div><span>Toggle Mini Library</span><kbd>L</kbd></div>
                <div><span>Open Full Library</span><kbd>G</kbd></div>
                <div><span>Open this panel</span><kbd>?</kbd></div>
                <div><span>Close dialog</span><kbd>Esc</kbd></div>
              </div>
              <div className="help-note"><Sparkles size={17} /><span>All image generation is simulated in the browser. Local image imports are temporary, and backend integration is deliberately deferred until the real API contract is reviewed.</span></div>
              <div className="help-footer"><Monitor size={14} /> Built for desktop screens <span>•</span> <a href="https://github.com/single-spider/Ark-Image-Studio" target="_blank" rel="noreferrer">View source</a></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
