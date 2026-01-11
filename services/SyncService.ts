import { AppState } from '../types';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3003';

class SyncService {
  private ws: WebSocket | null = null;
  private onUpdateCallback: ((state: AppState) => void) | null = null;
  private isConnected = false;
  private httpBaseUrl: string;

  constructor() {
    this.httpBaseUrl = WEBSOCKET_URL.replace(/^ws/, 'http');
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(WEBSOCKET_URL);

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    };

    this.ws.onmessage = (event) => {
      try {
        const state = JSON.parse(event.data);
        if (this.onUpdateCallback) {
          this.onUpdateCallback(state);
        }
      } catch (e) {
        console.error('Failed to parse message from server:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server. Reconnecting...');
      this.isConnected = false;
      setTimeout(() => this.connect(), 3000); // Coba konek lagi setelah 3 detik
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      this.ws?.close();
    };
  }

  // Kirim state ke server
  saveState(state: AppState) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(state));
    } else {
      console.warn('WebSocket is not connected. State not saved.');
    }
  }

  // Dengar perubahan dari server
  onUpdate(callback: (state: AppState) => void) {
    this.onUpdateCallback = callback;
  }
  
  // Method untuk mereset state di server
  async resetState() {
    try {
      const response = await fetch(`${this.httpBaseUrl}/reset`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reset state on server.');
      }
      console.log('Server state reset initiated.');
    } catch (error) {
      console.error('Error resetting state:', error);
    }
  }

  // Helper untuk mengecek status koneksi jika diperlukan
  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const syncService = new SyncService();
