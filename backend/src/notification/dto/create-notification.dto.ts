import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  mensagemId: string;

  @IsString()
  @IsNotEmpty()
  conteudoMensagem: string;
}
