import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UsersApplicationService } from '../application/users-application.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserQueryDto } from '../application/dto/users.dto';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { ResponseEnvelopeInterceptor } from '../../../shared/presentation/interceptors/response-envelope.interceptor';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiNotFoundResponse({ description: 'User not found' })
@ApiConflictResponse({ description: 'Email already exists' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@UseInterceptors(ResponseEnvelopeInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersApplicationService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user (ADMIN only)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto);
    return user as UserResponseDto;
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users (ADMIN only)' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return user as UserResponseDto;
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user (ADMIN only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto);
    return user as UserResponseDto;
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user (ADMIN only)' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
