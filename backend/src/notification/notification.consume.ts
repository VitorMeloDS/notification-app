import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationStatusDto } from './dto/notification-status.dto';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationConsume {
  private readonly entradaQueue = 'fila.notificacao.entrada.vitor';
  private readonly statusQueue = 'fila.notificacao.status.vitor';
  private readonly statusMap = new Map<string, string>();
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly gateway: NotificationGateway) {}

  startEntradaConsumer(channel: any) {
    this.logger.log('Iniciando consumidor da fila de entrada...');

    channel.consume(
      this.entradaQueue,
      async (msg: any) => {
        if (msg !== null) {
          try {
            const notificacao = JSON.parse(msg.content.toString());
            this.logger.log(
              `Mensagem recebida da fila de entrada: ${notificacao.mensagemId}`,
            );

            // Processa a mensagem
            const status = await this.processNotification(notificacao);

            // Publica o status na fila de status
            await this.publishStatus(channel, {
              mensagemId: notificacao.mensagemId,
              status: status,
              timestamp: new Date().toISOString(),
            });

            // Confirma o processamento
            channel.ack(msg);
            this.logger.log(
              `Mensagem ${notificacao.mensagemId} processada com status: ${status}`,
            );
          } catch (error) {
            this.logger.error('Erro ao processar mensagem:', error);
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false },
    );
  }

  private async processNotification(
    notificacao: any,
  ): Promise<'PROCESSADO_SUCESSO' | 'FALHA_PROCESSAMENTO'> {
    this.logger.log(`Processando mensagem: ${notificacao.mensagemId}`);

    // Simula processamento assíncrono (1-2 segundos)
    const tempoProcessamento = 1000 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, tempoProcessamento));

    // Gera número aleatório de 1 a 10
    const numeroAleatorio = Math.floor(Math.random() * 10) + 1;

    // 20% de chance de falha (números 1 e 2)
    if (numeroAleatorio <= 2) {
      this.logger.warn(
        `Falha no processamento da mensagem: ${notificacao.mensagemId} (número aleatório: ${numeroAleatorio})`,
      );
      return 'FALHA_PROCESSAMENTO';
    } else {
      this.logger.log(
        `Mensagem processada com sucesso: ${notificacao.mensagemId} (número aleatório: ${numeroAleatorio})`,
      );
      return 'PROCESSADO_SUCESSO';
    }
  }

  private async publishStatus(channel: any, statusDto: NotificationStatusDto) {
    try {
      // Armazena status em memória
      this.statusMap.set(statusDto.mensagemId, statusDto.status);

      const bufferMensagem = Buffer.from(JSON.stringify(statusDto));

      channel.sendToQueue(this.statusQueue, bufferMensagem, {
        persistent: true,
      });

      this.logger.log(
        `Status publicado na fila ${this.statusQueue}: ${statusDto.mensagemId} - ${statusDto.status}`,
      );

      // Envia também para o frontend via WebSocket
      this.gateway.sendToFrontend({
        type: 'status_update',
        ...statusDto,
      });
    } catch (error) {
      this.logger.error('Erro ao publicar status:', error);
    }
  }

  // Método para consultar status de uma mensagem
  getStatus(mensagemId: string): string | undefined {
    return this.statusMap.get(mensagemId);
  }

  // Método para listar todos os status
  getAllStatus(): { [key: string]: string } {
    const resultado: { [key: string]: string } = {};
    this.statusMap.forEach((valor, chave) => {
      resultado[chave] = valor;
    });
    return resultado;
  }

  // Novo método para obter notificações completas
  getAllNotifications(): any[] {
    return Array.from(this.statusMap.values());
  }
}
