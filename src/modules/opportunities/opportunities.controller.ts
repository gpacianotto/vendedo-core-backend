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
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import {
  OpportunitiesService,
  OpportunitySummary,
  PaginatedOpportunities,
} from './opportunities.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  list(
    @Query() query: ListOpportunitiesQueryDto,
  ): Promise<PaginatedOpportunities> {
    return this.opportunitiesService.list(query);
  }

  @Post()
  create(@Body() dto: CreateOpportunityDto): Promise<OpportunitySummary> {
    return this.opportunitiesService.create(dto);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<OpportunitySummary> {
    return this.opportunitiesService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
  ): Promise<OpportunitySummary> {
    return this.opportunitiesService.update(id, dto);
  }
}
