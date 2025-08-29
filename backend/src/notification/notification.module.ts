import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationConsume } from './notification.consume';
import { RabbitMQModule } from '../providers/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationConsume],
})
export class NotificationModule {}
