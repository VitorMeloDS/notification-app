import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationConsume } from './notification.consume';
import { RabbitMQConnection } from '../providers/rabbitmq/rabbitmq.connection';

const mockNotificationService = {
  sendToQueue: jest.fn(),
};

const mockNotificationConsume = {
  getStatus: jest.fn(),
  getAllStatus: jest.fn(),
  getAllNotifications: jest.fn(),
};

const mockRabbitMQConnection = {
  connectRabbitMQ: jest.fn(),
  closeConnection: jest.fn(),
};

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: NotificationConsume,
          useValue: mockNotificationConsume,
        },
        {
          provide: RabbitMQConnection,
          useValue: mockRabbitMQConnection,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar notificação com sucesso', async () => {
      const createNotificationDto = {
        mensagemId: 'test-123',
        conteudoMensagem: 'Test message',
      };

      const expectedResult = {
        mensagemId: 'test-123',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockNotificationService.sendToQueue.mockResolvedValue(expectedResult);

      const result = await controller.create(createNotificationDto);

      expect(result).toEqual({
        status: 'accepted',
        message: 'Notificação recebida e será processada assincronamente',
        mensagemId: 'test-123',
        timestamp: expectedResult.timestamp,
      });

      expect(mockNotificationService.sendToQueue).toHaveBeenCalledWith(
        createNotificationDto,
      );
    });
  });
});
