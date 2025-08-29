import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationConsume } from './notification.consume';
import { RabbitMQConnection } from '../providers/rabbitmq/rabbitmq.connection';
import { Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';

const mockNotificationConsume = {
  startEntradaConsumer: jest.fn(),
};

const mockChannel = {
  sendToQueue: jest.fn().mockImplementation(() => {}),
  assertQueue: jest.fn(),
  close: jest.fn(),
  consume: jest.fn(),
  ack: jest.fn(),
  nack: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

const mockRabbitMQConnectionWithLogs = {
  connectRabbitMQ: jest.fn().mockResolvedValue(mockChannel),
  closeConnection: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: RabbitMQConnection,
          useValue: mockRabbitMQConnectionWithLogs,
        },
        {
          provide: NotificationConsume,
          useValue: mockNotificationConsume,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('sendToQueue', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('deve enviar mensagem para a fila com sucesso', async () => {
      const createNotificationDto: CreateNotificationDto = {
        mensagemId: 'test-123',
        conteudoMensagem: 'Mensagem de teste',
      };

      const mockTimestamp = '2024-01-01T00:00:00.000Z';
      const realDate = Date;
      global.Date = class extends Date {
        constructor() {
          super(mockTimestamp);
        }
      } as any;

      const result = await service.sendToQueue(createNotificationDto);

      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'fila.notificacao.entrada.vitor',
        expect.any(Buffer),
        { persistent: true },
      );

      const bufferSent = mockChannel.sendToQueue.mock.calls[0][1];
      const messageSent = JSON.parse(bufferSent.toString());

      expect(messageSent).toEqual({
        mensagemId: 'test-123',
        conteudoMensagem: 'Mensagem de teste',
        timestamp: mockTimestamp,
      });

      expect(result).toEqual({
        mensagemId: 'test-123',
        timestamp: mockTimestamp,
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Mensagem enviada para fila de entrada:',
        'test-123',
      );

      global.Date = realDate;
    });

    it('deve validar que conteudoMensagem e mensagemId não pode ser vazio', async () => {
      const createNotificationDto: CreateNotificationDto = {
        mensagemId: ' ',
        conteudoMensagem: '',
      };

      await expect(service.sendToQueue(createNotificationDto)).rejects.toThrow(
        'mensagemId e conteudoMensagem são obrigatórios',
      );

      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('deve conectar com RabbitMQ e iniciar consumidor com sucesso', async () => {
      await service.onModuleInit();

      expect(
        mockRabbitMQConnectionWithLogs.connectRabbitMQ,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockNotificationConsume.startEntradaConsumer,
      ).toHaveBeenCalledTimes(1);
      expect(mockNotificationConsume.startEntradaConsumer).toHaveBeenCalledWith(
        mockChannel,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('deve fechar conexão com RabbitMQ com sucesso', async () => {
      await service.onModuleInit();

      await service.onModuleDestroy();

      expect(
        mockRabbitMQConnectionWithLogs.closeConnection,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
