import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RabbitMQConnection } from '..//providers/rabbitmq/rabbitmq.connection';
import { NotificationConsume } from './notification.consume';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private channel: any;
  private readonly entradaQueue = 'fila.notificacao.entrada.vitor';
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationConsume: NotificationConsume,
    private readonly rabbitmqConnection: RabbitMQConnection,
  ) {}

  async onModuleInit() {
    this.channel = await this.rabbitmqConnection.connectRabbitMQ();
    this.notificationConsume.startEntradaConsumer(this.channel);
  }

  async onModuleDestroy() {
    await this.rabbitmqConnection.closeConnection();
  }

  async sendToQueue(createNotificationDto: CreateNotificationDto) {
    if (
      !createNotificationDto.mensagemId ||
      !createNotificationDto.conteudoMensagem
    ) {
      throw new Error('mensagemId e conteudoMensagem são obrigatórios');
    }

    if (createNotificationDto.conteudoMensagem.trim() === '') {
      throw new Error('conteudoMensagem não pode ser vazio');
    }

    if (!this.channel) {
      throw new Error('RabbitMQ não está conectado');
    }

    try {
      const mensagem = {
        mensagemId: createNotificationDto.mensagemId,
        conteudoMensagem: createNotificationDto.conteudoMensagem,
        timestamp: new Date().toISOString(),
      };

      const bufferMensagem = Buffer.from(JSON.stringify(mensagem));

      this.channel.sendToQueue(this.entradaQueue, bufferMensagem, {
        persistent: true,
      });

      this.logger.log(
        'Mensagem enviada para fila de entrada:',
        mensagem.mensagemId,
      );

      return {
        mensagemId: mensagem.mensagemId,
        timestamp: mensagem.timestamp,
      };
    } catch (error) {
      this.logger.error('Erro ao enviar para RabbitMQ:', error);
      throw new Error('Falha ao enviar notificação para a fila');
    }
  }
}
