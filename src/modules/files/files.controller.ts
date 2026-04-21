import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { UsersService } from '../users/users.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
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
  findAll(
    @CurrentUser('userId') userId: string,
    @Query('category') category?: string,
  ) {
    return this.filesService.findByUser(userId, category);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.filesService.findById(id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.filesService.deleteFile(id, userId);
    return { deleted: true };
  }
}
