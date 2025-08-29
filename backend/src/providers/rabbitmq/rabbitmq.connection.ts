import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class RabbitMQConnection {
  private connection: any;
  private channel: any;
  private readonly entradaQueue = 'fila.notificacao.entrada.vitor';
  private readonly statusQueue = 'fila.notificacao.status.vitor';
  private readonly logger = new Logger(NotificationService.name);

  async connectRabbitMQ() {
    try {
      this.logger.log('Conectando ao RabbitMQ...');
      this.connection = await amqp.connect('amqp://rabbitmq:5672');
      this.channel = await this.connection.createChannel();

      // Cria ambas as filas
      await this.channel.assertQueue(this.entradaQueue, { durable: true });
      await this.channel.assertQueue(this.statusQueue, { durable: true });

      this.logger.log('Conexão com RabbitMQ estabelecida com sucesso!');
      this.logger.log(`Ouvindo a fila: ${this.entradaQueue}`);

      return this.channel;
    } catch (error) {
      this.logger.error('Erro ao conectar com RabbitMQ:', error.message);
      setTimeout(() => this.connectRabbitMQ(), 5000);
    }
  }

  async closeConnection() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('Conexão com RabbitMQ fechada');
    } catch (error) {
      this.logger.error('Erro ao fechar conexão:', error);
    }
  }
}
