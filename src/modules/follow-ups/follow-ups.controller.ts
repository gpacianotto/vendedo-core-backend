import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { ListFollowUpsQueryDto } from './dto/list-follow-ups-query.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import {
  FollowUpsService,
  FollowUpSummary,
  PaginatedFollowUps,
} from './follow-ups.service';

@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get()
  list(@Query() query: ListFollowUpsQueryDto): Promise<PaginatedFollowUps> {
    return this.followUpsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateFollowUpDto): Promise<FollowUpSummary> {
    return this.followUpsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFollowUpDto,
  ): Promise<FollowUpSummary> {
    return this.followUpsService.update(id, dto);
  }
}
