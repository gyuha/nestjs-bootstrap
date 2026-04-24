import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { ImageService } from '../../shared/infrastructure/image/image.service';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';
import { files } from './schemas/file.schema';

@Injectable()
export class FilesService {
  private static readonly GALLERY_LIMIT = 10;
  private static readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    category: 'avatar' | 'gallery',
  ) {
    this.validateFile(file);

    if (category === 'gallery') {
      const existing = await this.db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.category, 'gallery')));

      if (existing.length >= FilesService.GALLERY_LIMIT) {
        throw new ConflictException('Gallery limit reached (max 10)');
      }
    }

    if (category === 'avatar') {
      await this.deleteExistingAvatar(userId);
    }

    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    const fileUuid = randomUUID();
    const baseKey = `${category}/${userId}/${fileUuid}`;

    // Upload original
    const originalKey = `${baseKey}-original.${ext}`;
    const url = await this.storageService.upload(
      originalKey,
      file.buffer,
      file.mimetype,
    );

    // Resize and upload medium (512x512)
    const mediumBuffer = await this.imageService.resize(file.buffer, {
      width: 512,
      height: 512,
    });
    const mediumKey = `${baseKey}-medium.${ext}`;
    const mediumUrl = await this.storageService.upload(
      mediumKey,
      mediumBuffer,
      'image/png',
    );

    // Resize and upload thumbnail (128x128)
    const thumbBuffer = await this.imageService.resize(file.buffer, {
      width: 128,
      height: 128,
    });
    const thumbKey = `${baseKey}-thumbnail.${ext}`;
    const thumbnailUrl = await this.storageService.upload(
      thumbKey,
      thumbBuffer,
      'image/png',
    );

    const [record] = await this.db
      .insert(files)
      .values({
        userId,
        category,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        thumbnailUrl,
        mediumUrl,
      })
      .returning();

    return record;
  }

  async findByUser(userId: string, category?: string) {
    if (category) {
      return this.db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.category, category)));
    }
    return this.db.select().from(files).where(eq(files.userId, userId));
  }

  async findById(id: string) {
    const [record] = await this.db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);
    return record ?? null;
  }

  async findByIdForUser(id: string, userId: string) {
    const record = await this.findById(id);
    if (!record) throw new NotFoundException('File not found');
    if (record.userId !== userId) throw new ForbiddenException('Not your file');
    return record;
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const record = await this.findByIdForUser(id, userId);

    // Extract storage keys from URLs and delete
    const urls = [record.url, record.thumbnailUrl, record.mediumUrl].filter(
      Boolean,
    );
    for (const url of urls) {
      const key = this.extractKeyFromUrl(url);
      if (key) await this.storageService.delete(key);
    }

    await this.db.delete(files).where(eq(files.id, id));
  }

  private async deleteExistingAvatar(userId: string): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.category, 'avatar')))
      .limit(1);

    if (existing) {
      await this.deleteFile(existing.id, userId);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!FilesService.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ConflictException(
        `File extension .${ext} not allowed. Use: jpg, jpeg, png, webp`,
      );
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    const parts = url.split('/uploads/');
    return parts[1] ?? null;
  }
}
