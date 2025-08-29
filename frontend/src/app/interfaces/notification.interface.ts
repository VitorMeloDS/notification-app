export interface Notification {
  mensagemId: string;
  conteudoMensagem: string;
  status: 'AGUARDANDO_PROCESSAMENTO' | 'PROCESSADO_SUCESSO' | 'FALHA_PROCESSAMENTO';
  timestamp: string;
  error?: string;
  type?: 'status_update';
}
