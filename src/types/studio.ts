export type StudioTheme = 'nocturne' | 'mineral' | 'ember';
export type WorkspaceTab = 'main' | 'reference' | 'extra';
export type WorkspaceTool = 'pan' | 'inspect' | 'compare' | 'mask';
export type GalleryFilter = 'all' | 'keepers' | 'recent';
export type AspectRatio = '1:1' | '4:3' | '3:2' | '16:9' | '9:16';

export interface StudioAsset {
  id: string;
  src: string;
  thumb: string;
  title: string;
  prompt: string;
  seed: number;
  model: string;
  createdAt: string;
  collection: string;
  ratio: AspectRatio;
  keeper: boolean;
}

export interface ReferenceSlot {
  id: string;
  title: string;
  role: string;
  src: string | null;
  enabled: boolean;
}

export interface GenerationRequest {
  prompt: string;
  negativePrompt: string;
  model: string;
  ratio: AspectRatio;
  resolution: string;
  seed: string;
  creativity: number;
}

export interface StudioNotice {
  id: number;
  message: string;
  detail?: string;
  tone?: 'success' | 'info' | 'warning';
}
