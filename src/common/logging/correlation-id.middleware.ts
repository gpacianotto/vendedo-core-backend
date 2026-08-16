import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CorrelationIdService } from './correlation-id.service';

const HEADER_NAME = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly correlationIdService: CorrelationIdService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header(HEADER_NAME);
    const correlationId =
      incoming && incoming.trim().length > 0 ? incoming : randomUUID();

    res.setHeader(HEADER_NAME, correlationId);

    this.correlationIdService.run(correlationId, () => next());
  }
}
