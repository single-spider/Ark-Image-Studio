import { useRef, useState } from 'react';
import { ReferencePicker } from './ReferencePicker';
import { motion } from 'motion/react';
import {
  ArrowUpRight, Bookmark, Check, ChevronDown, ChevronUp, CircleHelp,
  Clipboard, Copy, ImagePlus, LoaderCircle, Minus, Plus, RotateCcw,
  Settings, Settings2, Sparkles, WandSparkles, X,
} from 'lucide-react';
import { promptPresets } from '../data/mock';
import type { AspectRatio, ReferenceSlot, StudioAsset } from '../types/studio';

interface StudioControlsProps {
  references: ReferenceSlot[];
  assets: StudioAsset[];
  onReferencePick: (slotId: string, asset: StudioAsset) => void;
  prompt: string;
  negativePrompt: string;
  model: string;
  ratio: AspectRatio;
  resolution: string;
  seed: string;
  creativity: number;
  generating: boolean;
  onReferenceImport: (id: string, file: File) => void;
  onReferenceToggle: (id: string) => void;
  onReferenceClear: (id: string) => void;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onRatioChange: (value: AspectRatio) => void;
  onResolutionChange: (value: string) => void;
  onSeedChange: (value: string) => void;
  onCreativityChange: (value: number) => void;
  onGenerate: () => void;
  onToast: (message: string, detail?: string) => void;
}

const ratios: AspectRatio[] = ['1:1', '4:3', '3:2', '16:9', '9:16'];
const models = ['Seedream 4.5', 'Seedream 4.0', 'Seedream 5.0 (preview)', 'Flux.1 Dev'];

export function StudioControls({
  assets, references, onReferencePick, prompt, negativePrompt, model, ratio, resolution, seed, creativity,
  generating, onReferenceImport, onReferenceToggle, onReferenceClear,
  onPromptChange, onNegativePromptChange, onModelChange, onRatioChange,
  onResolutionChange, onSeedChange, onCreativityChange, onGenerate, onToast,
}: StudioControlsProps) {
  const settingsRef = useRef<HTMLDialogElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promptFocus, setPromptFocus] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(true);
  const [picker, setPicker] = useState<{ id: string; anchor: HTMLButtonElement } | null>(null);
  const pickerSlot = references.find((ref) => ref.id === picker?.id);

  function openSettings() {
    settingsRef.current?.showModal();
    setSettingsOpen(true);
  }

  function closeSettings() {
    settingsRef.current?.close();
  }

  function ratioField(surface: 'quick' | 'settings') {
    return (
      <div className={`field-group ratio-field ratio-field--${surface}`}>
        <div className="field-label">Aspect ratio <span className="field-hint">Canvas format</span></div>
        <div className="ratio-switcher" role="group" aria-label={surface === 'quick' ? 'Quick aspect ratio' : 'Generation aspect ratio'}>
          {ratios.map((value) => (
            <button type="button" key={value} aria-pressed={ratio === value} className={`ratio-option ${ratio === value ? 'active' : ''}`} onClick={() => onRatioChange(value)}>
              {ratio === value && <motion.span layoutId={`ratio-active-${surface}`} className="ratio-highlight" transition={{ type: 'spring', stiffness: 370, damping: 34 }} />}
              <span>{value}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      onToast('Prompt copied', 'Ready to paste into another workflow.');
    } catch {
      onToast('Copy unavailable', 'Clipboard permission is required in this browser.');
    }
  }

  function saveDraft() {
    try {
      localStorage.setItem('ark-studio-draft', JSON.stringify({ prompt, negativePrompt, model, ratio, resolution, seed, creativity }));
      onToast('Draft saved locally', 'Stored in this browser only.');
    } catch {
      onToast('Local save unavailable', 'Your browser did not allow local storage.');
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem('ark-studio-draft');
      if (!raw) return onToast('No saved draft', 'Save a prompt draft first.');
      const draft = JSON.parse(raw) as Record<string, unknown>;
      if (typeof draft.prompt === 'string') onPromptChange(draft.prompt);
      if (typeof draft.negativePrompt === 'string') onNegativePromptChange(draft.negativePrompt);
      if (typeof draft.model === 'string') onModelChange(draft.model);
      if (typeof draft.ratio === 'string' && ratios.includes(draft.ratio as AspectRatio)) onRatioChange(draft.ratio as AspectRatio);
      if (typeof draft.resolution === 'string') onResolutionChange(draft.resolution);
      if (typeof draft.seed === 'string') onSeedChange(draft.seed);
      if (typeof draft.creativity === 'number') onCreativityChange(draft.creativity);
      onToast('Draft restored', 'Loaded from local browser storage.');
    } catch {
      onToast('Draft unavailable', 'Could not read the locally saved draft.');
    }
  }

  return (
    <aside className="controls-panel" aria-label="Generation controls">
      <div className="panel-heading controls-heading">
        <div className="heading-left"><span className="eyebrow">02 / Studio controls</span></div>
        <button type="button" className="icon-button soft" title="About preview mode" aria-label="About preview mode" onClick={() => onToast('Interactive preview', 'Generation is simulated. Real backend routes are not connected yet.')}><CircleHelp size={16} /></button>
      </div>

      <section className={`control-section reference-section ${referenceOpen ? '' : 'references-collapsed'}`}>
        <div className="section-topline">
          <div><span className="section-kicker">INPUT MATERIAL</span><h3>References <span className="count-muted">/ 03</span></h3></div>
          <button type="button" className="text-icon-button" onClick={() => { setPicker(null); setReferenceOpen((open) => !open); }} aria-expanded={referenceOpen}>{referenceOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
        </div>
        {referenceOpen && (
          <>
            <div className="reference-grid">
              {references.map((reference, index) => (
                <div className={`reference-card ${!reference.enabled ? 'disabled' : ''}`} key={reference.id}>
                  {reference.src ? <img src={reference.src} alt={reference.title} /> : <div className="reference-empty"><ImagePlus size={21} /></div>}
                  <span className="reference-index">0{index + 1}</span>
                  <div className="reference-overlay">
                    <span className="reference-title">{reference.title}</span>
                    <span className="reference-role">{reference.role}</span>
                  </div>
                  <div className="reference-actions">
                    <button type="button" title={reference.enabled ? 'Mute reference' : 'Enable reference'} aria-label={reference.enabled ? 'Mute reference' : 'Enable reference'} className={`ref-toggle ${reference.enabled ? 'on' : ''}`} onClick={() => onReferenceToggle(reference.id)}>{reference.enabled ? <Check size={12} /> : <Minus size={12} />}</button>
                    <button type="button" className="ref-import" title="Choose reference from library" aria-label={`Choose ${reference.title} reference`} aria-haspopup="dialog" aria-expanded={picker?.id === reference.id} onClick={(event) => { const anchor = event.currentTarget; setPicker((current) => current?.id === reference.id ? null : { id: reference.id, anchor }); }}><Plus size={13}/></button>
                    {reference.src && <button type="button" title="Clear reference" aria-label="Clear reference" className="ref-clear" onClick={() => onReferenceClear(reference.id)}><X size={12} /></button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="reference-foot"><span className="soft-pip" /> Choose from library <span>•</span> Local files supported</div>
          </>
        )}
      </section>

      <section className="control-section utility-section">
        <div className="section-topline compact"><div><span className="section-kicker">QUICK ACTIONS</span><h3>Utility shelf</h3></div><Settings2 size={15} className="muted-icon" /></div>
        <div className="utility-shelf">
          <button type="button" title="Save prompt draft locally" onClick={saveDraft}><Bookmark size={17} /><span>Save draft</span></button>
          <button type="button" title="Restore saved prompt draft" onClick={restoreDraft}><RotateCcw size={17} /><span>Restore</span></button>
          <button type="button" title="Copy current prompt" onClick={() => { void copyPrompt(); }}><Copy size={17} /><span>Copy</span></button>
          <button type="button" title="Generate a random seed" onClick={() => { onSeedChange(String(Math.floor(Math.random() * 900000) + 100000)); onToast('Seed randomized'); }}><WandSparkles size={17} /><span>New seed</span></button>
        </div>
      </section>



      <section className="control-section prompt-section">
        <div className="section-topline compact"><div><span className="section-kicker">CREATIVE DIRECTION</span><h3>Prompt studio</h3></div><div className="prompt-heading-actions"><button type="button" title="Copy prompt" aria-label="Copy prompt" className="text-icon-button" onClick={() => { void copyPrompt(); }}><Clipboard size={16} /></button><button ref={settingsButtonRef} type="button" title="Generation setup" aria-label="Open generation setup" aria-haspopup="dialog" aria-expanded={settingsOpen} className="text-icon-button generation-gear" onClick={openSettings}><Settings size={18}/></button></div></div>
        <div className={`prompt-composer ${promptFocus ? 'focused' : ''}`}>
          <div className="prompt-composer-top"><Sparkles size={14} /><span>DESCRIBE YOUR VISION</span><span className="prompt-char-count">{prompt.length} chars</span></div>
          <textarea
            aria-label="Generation prompt" placeholder="Describe the atmosphere, composition, lighting and feeling..."
            value={prompt} onChange={(event) => onPromptChange(event.target.value)}
            onFocus={() => setPromptFocus(true)} onBlur={() => setPromptFocus(false)}
            spellCheck={false}
          />
          <div className="prompt-composer-bottom"><span><span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to generate</span><span className="prompt-mode">TEXT TO IMAGE</span></div>
        </div>
        <div className="prompt-chips" aria-label="Prompt additions">
          {promptPresets.map((preset) => (
            <button type="button" key={preset} onClick={() => onPromptChange(`${prompt.trim()}${prompt.trim() ? ', ' : ''}${preset.toLowerCase()}`)}><Plus size={12} />{preset}</button>
          ))}
        </div>
        {ratioField('quick')}
        <div className="prompt-output-summary"><span>{model}</span><span>{resolution} · {seed.trim() ? 'Fixed seed' : 'Random seed'}</span></div>
        <button type="button" className="generate-button" disabled={generating || !prompt.trim()} onClick={onGenerate}>
          <span className="generate-button-shine" />
          {generating ? <LoaderCircle className="spin" size={19} /> : <Sparkles size={19} />}
          <span>{generating ? 'Simulating generation…' : 'Generate image'}</span>
          {!generating && <ArrowUpRight size={18} className="generate-arrow" />}
        </button>
        <div className="generate-caption"><span className="preview-indicator" /> Browser preview: generated results are simulated <span>•</span> No API charges</div>
      </section>
      {picker && pickerSlot && <ReferencePicker key={picker.id} anchor={picker.anchor} slot={pickerSlot} assets={assets}
        onClose={() => setPicker(null)}
        onPick={(asset) => { onReferencePick(picker.id, asset); setPicker(null); }}
        onImport={(file) => { onReferenceImport(picker.id, file); setPicker(null); }}/>}
      <dialog ref={settingsRef} className="generation-settings-dialog" aria-labelledby="generation-settings-title"
        onClose={() => { setSettingsOpen(false); settingsButtonRef.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeSettings(); }}>
        <div className="generation-settings-card">
          <header className="generation-settings-header">
            <div><span className="section-kicker">ENGINE & OUTPUT</span><h2 id="generation-settings-title">Generation setup</h2></div>
            <button type="button" className="text-icon-button" aria-label="Close generation setup" title="Close settings (Esc)" onClick={closeSettings}><X size={20}/></button>
          </header>
          <div className="generation-settings-fields">
        <div className="field-group">
          <label className="field-label" htmlFor="model-select">Model <span className="field-hint">Image engine</span></label>
          <div className="select-wrap">
            <select id="model-select" value={model} onChange={(event) => onModelChange(event.target.value)}>{models.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <ChevronDown size={15} />
          </div>
        </div>
        {ratioField('settings')}
        <div className="dual-fields">
          <div className="field-group">
            <label className="field-label" htmlFor="resolution-select">Resolution</label>
            <div className="select-wrap"><select id="resolution-select" value={resolution} onChange={(event) => onResolutionChange(event.target.value)}><option>1K</option><option>2K</option><option>4K</option></select><ChevronDown size={14} /></div>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="seed-input">Seed</label>
            <input id="seed-input" className="field-input" type="text" inputMode="numeric" placeholder="Random" value={seed} onChange={(event) => onSeedChange(event.target.value)} />
          </div>
        </div>
        </div>
          <div className="generation-advanced-heading">Advanced controls <span>Preview parameters</span></div>
          <div className="advanced-panel">
            <label className="field-label" htmlFor="negative-prompt">Negative prompt</label>
            <textarea id="negative-prompt" value={negativePrompt} onChange={(event) => onNegativePromptChange(event.target.value)} placeholder="Artifacts, unwanted details, blur..." rows={2} />
            <div className="creativity-row"><label htmlFor="creativity-range">Creative variation</label><span>{creativity}%</span></div>
            <input id="creativity-range" type="range" min="0" max="100" value={creativity} onChange={(event) => onCreativityChange(Number(event.target.value))} />
          </div>

          <footer className="generation-settings-footer"><span>Changes apply immediately.</span><button type="button" onClick={closeSettings}>Done <Check size={15}/></button></footer>
        </div>
      </dialog>
    </aside>
  );
}
