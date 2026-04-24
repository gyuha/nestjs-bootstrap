import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { FilesService } from './files.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('files')
@ApiBearerAuth('access-token')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload a file' })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('category') category: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`MIME type ${file.mimetype} not allowed`);
    }
    if (category !== 'avatar' && category !== 'gallery') {
      throw new BadRequestException('Category must be "avatar" or "gallery"');
    }

    const result = await this.filesService.uploadFile(file, userId, category);

    if (category === 'avatar') {
      await this.usersService.setAvatarUrl(userId, result.url);
    }

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List user files' })
  findAll(
    @CurrentUser('userId') userId: string,
    @Query('category') category?: string,
  ) {
    return this.filesService.findByUser(userId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by id' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.filesService.findByIdForUser(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.filesService.deleteFile(id, userId);
    return { deleted: true };
  }
}
