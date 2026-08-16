import { IsUUID } from 'class-validator';

export class UnlinkUserDto {
  @IsUUID()
  userId: string;
}
