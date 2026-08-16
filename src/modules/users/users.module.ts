import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

/**
 * Módulo mínimo (bootstrap): só registra a entidade `User` para o módulo de
 * auth. Perfil/equipe/gestão pelo OWNER chegam em 04-users.md.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
