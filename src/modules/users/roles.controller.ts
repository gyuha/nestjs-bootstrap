import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from './constants/permissions';
import { UsersService } from './users.service';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Permissions.ROLES_MANAGE)
  @ApiOperation({ summary: 'List all roles' })
  findAll() {
    return this.usersService.findAllRoles();
  }

  @Get(':id')
  @Roles(Permissions.ROLES_MANAGE)
  @ApiOperation({ summary: 'Get role by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findRoleById(id);
  }

  @Post()
  @Roles(Permissions.ROLES_MANAGE)
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: { name: string; description?: string }) {
    return this.usersService.createRole(dto);
  }

  @Patch(':id')
  @Roles(Permissions.ROLES_MANAGE)
  @ApiOperation({ summary: 'Update role' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.usersService.updateRole(id, dto);
  }

  @Delete(':id')
  @Roles(Permissions.ROLES_MANAGE)
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deleteRole(id);
  }

  @Post(':id/permissions')
  @Roles(Permissions.ROLES_MANAGE)
  @ApiOperation({ summary: 'Set role permissions' })
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { permissions: string[] },
  ) {
    return this.usersService.setRolePermissions(id, dto.permissions);
  }
}
