
import { AppState } from '../types';

const STORAGE_KEY = 'esports_overlay_pro_data';
const CHANNEL_NAME = 'esports_overlay_sync';

class SyncService {
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
  }

  // Simpan ke LocalStorage dan broadcast ke tab lain
  saveState(state: AppState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    this.channel.postMessage(state);
  }

  // Ambil data yang tersimpan
  loadState(): AppState | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Gagal memuat data:", e);
      return null;
    }
  }

  // Dengar perubahan dari tab lain
  onUpdate(callback: (state: AppState) => void) {
    this.channel.onmessage = (event) => {
      if (event.data) {
        callback(event.data);
      }
    };
  }

  // Reset data ke awal
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const syncService = new SyncService();
