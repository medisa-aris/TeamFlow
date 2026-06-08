import { IsUUID } from 'class-validator';

export class CreateDelegationDto {
  @IsUUID()
  requestorUserId: string;

  @IsUUID()
  delegateUserId: string;
}
