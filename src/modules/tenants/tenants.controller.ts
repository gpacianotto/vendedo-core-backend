import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../common/auth/roles.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UnlinkUserDto } from './dto/unlink-user.dto';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';
import {
  CreateTenantResult,
  TenantsService,
  TenantSummary,
} from './tenants.service';

@Controller('tenant')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto): Promise<CreateTenantResult> {
    return this.tenantsService.create(dto);
  }

  @Get()
  getCurrent(): Promise<TenantSummary> {
    return this.tenantsService.getCurrent();
  }

  @Patch()
  @Roles('OWNER')
  updateConfig(@Body() dto: UpdateTenantConfigDto): Promise<TenantSummary> {
    return this.tenantsService.updateConfig(dto);
  }

  @Post('users/unlink')
  @Roles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkUser(@Body() dto: UnlinkUserDto): Promise<void> {
    return this.tenantsService.unlinkUser(dto.userId);
  }
}
