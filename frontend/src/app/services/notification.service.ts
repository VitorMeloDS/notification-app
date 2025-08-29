import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../interfaces/notification.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private socket: Socket = io(environment.apiUrl, {
    transports: ['websocket', 'polling'],
  });
  private statusSubject = new BehaviorSubject<Notification | null>(null);
  private pollingSubscription: Subscription | null = null;

  constructor() {
    this.connectWebSocket();
    this.startPollingFallback();
  }

  private connectWebSocket() {
    try {
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      // Escuta atualizações de status
      this.socket.on('new_notification', (data: any) => {
        if (data.type === 'status_update') {
          this.statusSubject.next(data);
        }
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  // Polling como fallback (a cada 3 segundos)
  private startPollingFallback() {
    this.pollingSubscription = interval(3000).subscribe(() => {
      if (!this.socket?.connected) {
        console.log('Using polling fallback');
      }
    });
  }

  sendNotification(mensagemId: string, conteudoMensagem: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/notificar`, {
      mensagemId,
      conteudoMensagem,
    });
  }

  generateMessageId(): string {
    return uuidv4();
  }

  getStatus(mensagemId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/status/${mensagemId}`);
  }

  // Carregar notificações existentes
  getAllNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/notifications`);
  }

  // Carregar status (mantido para compatibilidade)
  getAllStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/status`);
  }

  // Observable para receber atualizações de status
  getStatusUpdates(): Observable<Notification | null> {
    return this.statusSubject.asObservable();
  }

  // Método para forçar atualização via polling
  forceStatusUpdate(mensagemId: string) {
    this.getStatus(mensagemId).subscribe({
      next: (status) => {
        this.statusSubject.next(status);
      },
      error: (error) => {
        console.error('Error fetching status:', error);
      },
    });
  }

  isWebSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
