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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from './constants/permissions';
import type { UsersService } from './users.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Permissions.ROLES_MANAGE)
  findAll() {
    return this.usersService.findAllRoles();
  }

  @Get(':id')
  @Roles(Permissions.ROLES_MANAGE)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findRoleById(id);
  }

  @Post()
  @Roles(Permissions.ROLES_MANAGE)
  create(@Body() dto: { name: string; description?: string }) {
    return this.usersService.createRole(dto);
  }

  @Patch(':id')
  @Roles(Permissions.ROLES_MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.usersService.updateRole(id, dto);
  }

  @Delete(':id')
  @Roles(Permissions.ROLES_MANAGE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deleteRole(id);
  }

  @Post(':id/permissions')
  @Roles(Permissions.ROLES_MANAGE)
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { permissions: string[] },
  ) {
    return this.usersService.setRolePermissions(id, dto.permissions);
  }
}
