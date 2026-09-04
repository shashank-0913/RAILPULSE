type MessageHandler = (data: any) => void;

class TrainWebSocketService {
  private socket: WebSocket | null = null;
  private currentTrain: string | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: any = null;
  private isConnected: boolean = false;

  connect(trainNumber: string) {
    if (this.currentTrain === trainNumber && this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.disconnect();
    this.currentTrain = trainNumber;

    const backendUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    let wsBase = '';
    if (backendUrl) {
      const wsProto = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
      wsBase = backendUrl.replace(/^https?:/, wsProto);
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsBase = `${protocol}//${host}`;
    }
    const wsUrl = `${wsBase}/ws/trains/${trainNumber}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log(`[WebSocket] Connected to live stream for Train ${trainNumber}`);
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(payload));
        } catch (e) {
          console.error('[WebSocket] Message parsing error:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log(`[WebSocket] Disconnected for Train ${trainNumber}. Auto-reconnecting in 5s...`);
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocket] Connection error:', err);
        this.socket?.close();
      };
    } catch (err) {
      console.warn('[WebSocket] Setup failed. Local simulated tick active.', err);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentTrain) {
        this.connect(this.currentTrain);
      }
    }, 5000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  get status(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new TrainWebSocketService();
