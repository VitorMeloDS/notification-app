export class NotificationStatusDto {
  mensagemId: string;
  status: 'PROCESSADO_SUCESSO' | 'FALHA_PROCESSAMENTO';
  timestamp: string;
}
