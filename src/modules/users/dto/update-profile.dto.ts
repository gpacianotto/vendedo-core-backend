import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  // Exigida apenas quando `newPassword` é enviada — validada contra o hash atual no service.
  @ValidateIf((dto: UpdateProfileDto) => dto.newPassword !== undefined)
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;

  // 72 = limite de bytes de entrada do bcrypt (mesmo limite do RegisterDto).
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword?: string;
}
