import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/auth/roles.decorator';
import { ListTeamQueryDto } from './dto/list-team-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import {
  PaginatedTeam,
  ProfileSummary,
  TeamMemberSummary,
  UsersService,
} from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto): Promise<ProfileSummary> {
    return this.usersService.updateProfile(dto);
  }

  @Get('tenant/users')
  @Roles('OWNER')
  listTeam(@Query() query: ListTeamQueryDto): Promise<PaginatedTeam> {
    return this.usersService.listTeam(query);
  }

  @Patch('tenant/users/:id')
  @Roles('OWNER')
  updateTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberSummary> {
    return this.usersService.updateTeamMember(id, dto);
  }
}
