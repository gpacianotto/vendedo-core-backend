import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName: string;
}
