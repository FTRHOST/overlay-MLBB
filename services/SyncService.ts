import { AppState } from '../types';

// Dynamically determine WebSocket URL based on current host
const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;

  // In Development (Vite on 3001), backend is usually on 3003
  if (import.meta.env.DEV) {
    return `${protocol}//${host}:3003`;
  }

  // In Production (Same Origin), use the current port (if any)
  // This handles both IP:3003 and Public Domains (Implicit Port 80/443)
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${host}${port}`;
};

const WEBSOCKET_URL = getWebSocketUrl();

class SyncService {
  private ws: WebSocket | null = null;
  private onUpdateCallback: ((state: AppState) => void) | null = null;
  private isConnected = false;
  private httpBaseUrl: string;

  constructor() {
    // Determine HTTP base URL dynamically as well
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    // Use the configured WS URL's port/host or fallback to derivation
    // For simplicity in this specific setup where backend is known to be on 3003:
    this.httpBaseUrl = `${protocol}//${host}:3003`; 
    
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
