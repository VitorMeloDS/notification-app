import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationConsume } from './notification.consume';

@Controller('api')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationConsume: NotificationConsume,
  ) {}

  @Post('notificar')
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    try {
      const result = await this.notificationService.sendToQueue(
        createNotificationDto,
      );

      return {
        status: 'accepted',
        message: 'Notificação recebida e será processada assincronamente',
        mensagemId: result.mensagemId,
        timestamp: result.timestamp,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('status/:mensagemId')
  async getStatus(@Param('mensagemId') mensagemId: string) {
    const status = this.notificationConsume.getStatus(mensagemId);

    if (!status) {
      throw new NotFoundException(
        `Status não encontrado para mensagemId: ${mensagemId}`,
      );
    }

    return {
      mensagemId,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async getAllStatus() {
    const allStatus = this.notificationConsume.getAllStatus();

    return {
      total: Object.keys(allStatus).length,
      status: allStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('notifications')
  async getAllNotifications() {
    const notifications = this.notificationConsume.getAllNotifications();

    return {
      total: notifications.length,
      notifications: notifications,
      timestamp: new Date().toISOString(),
    };
  }
}
