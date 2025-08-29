import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../interfaces/notification.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
  conteudoMensagem: string = '';
  notifications: Notification[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  isWebSocketConnected: boolean = false;
  private statusSubscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Verifica conexão WebSocket
    this.isWebSocketConnected = this.notificationService.isWebSocketConnected();

    // Inscreve para atualizações de status
    this.statusSubscription = this.notificationService
      .getStatusUpdates()
      .subscribe((statusUpdate: Notification | null) => {
        if (statusUpdate) {
          this.updateNotificationStatus(statusUpdate);
        }
      });

    // Carrega notificações existentes ao inicializar
    this.loadExistingNotifications();
  }

  ngOnDestroy() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  sendNotification() {
    if (!this.conteudoMensagem.trim()) {
      this.errorMessage = 'Por favor, digite uma mensagem';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    // Gera ID único
    const mensagemId = this.notificationService.generateMessageId();

    // Adiciona à lista imediatamente com status aguardando
    const novaNotificacao: Notification = {
      mensagemId,
      conteudoMensagem: this.conteudoMensagem,
      status: 'AGUARDANDO_PROCESSAMENTO',
      timestamp: new Date().toISOString(),
    };

    this.notifications.unshift(novaNotificacao);
    this.conteudoMensagem = '';

    // Envia para o backend
    this.notificationService
      .sendNotification(mensagemId, novaNotificacao.conteudoMensagem)
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Atualiza o timestamp com a resposta do backend
          const index = this.notifications.findIndex((n) => n.mensagemId === mensagemId);
          if (index !== -1) {
            this.notifications[index].timestamp = response.timestamp;
          }
        },
        error: (error) => {
          console.error('Erro ao enviar notificação:', error);
          this.isLoading = false;
          this.errorMessage = 'Erro ao enviar notificação. Tente novamente.';

          // Marca como erro
          const index = this.notifications.findIndex((n) => n.mensagemId === mensagemId);
          if (index !== -1) {
            this.notifications[index].status = 'FALHA_PROCESSAMENTO';
            this.notifications[index].error = error.message;
          }
        },
      });
  }

  private updateNotificationStatus(statusUpdate: Notification) {
    const index = this.notifications.findIndex((n) => n.mensagemId === statusUpdate.mensagemId);

    if (index !== -1) {
      this.notifications[index] = {
        ...this.notifications[index],
        status: statusUpdate.status,
        timestamp: statusUpdate.timestamp,
      };

      // Força a atualização da view
      this.notifications = [...this.notifications];
    } else {
      // Adiciona nova notificação se não existir
      this.notifications.unshift({
        mensagemId: statusUpdate.mensagemId,
        conteudoMensagem: 'Mensagem processada',
        status: statusUpdate.status,
        timestamp: statusUpdate.timestamp,
      });
    }
  }

  loadExistingNotifications() {
    this.notificationService.getAllStatus().subscribe({
      next: (response) => {
        console.log(response);
        // Converte o objeto de status para array de notificações
        if (response.status && typeof response.status === 'object') {
          Object.entries(response.status).forEach(([mensagemId, status]) => {
            const exist = this.notifications.find((el) => el.mensagemId === mensagemId);
            if (!exist?.mensagemId) {
              this.notifications.push({
                mensagemId,
                conteudoMensagem: 'Mensagem processada',
                status: status as any,
                timestamp: new Date().toISOString(),
              });
            }
          });
        }
      },
      error: (error) => {
        console.error('Erro ao carregar notificações:', error);
      },
    });
  }

  // Método para forçar atualização manual (polling)
  forceUpdateStatus(mensagemId: string) {
    this.notificationService.forceStatusUpdate(mensagemId);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'AGUARDANDO_PROCESSAMENTO':
        return '⏳';
      case 'PROCESSADO_SUCESSO':
        return '✅';
      case 'FALHA_PROCESSAMENTO':
        return '❌';
      default:
        return '❓';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AGUARDANDO_PROCESSAMENTO':
        return 'status-waiting';
      case 'PROCESSADO_SUCESSO':
        return 'status-success';
      case 'FALHA_PROCESSAMENTO':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('pt-BR');
  }

  trackByMensagemId(index: number, notification: Notification): string {
    return notification.mensagemId;
  }
}
