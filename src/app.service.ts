import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { Connection, ConnectionStates } from 'mongoose';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  postgres: 'up' | 'down';
  mongo: 'up' | 'down';
}

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  async getHealth(): Promise<HealthStatus> {
    const postgres = await this.checkPostgres();
    const mongo = this.checkMongo();

    return {
      status: postgres === 'up' && mongo === 'up' ? 'ok' : 'degraded',
      postgres,
      mongo,
    };
  }

  private async checkPostgres(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }

  private checkMongo(): 'up' | 'down' {
    return this.mongoConnection.readyState === ConnectionStates.connected
      ? 'up'
      : 'down';
  }
}
