export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export interface StorageData {
  screenshots: Screenshot[];
  defaultSaveFolder?: string;
} 