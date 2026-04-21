export class UploadResponseDto {
  id!: string;
  category!: string;
  originalName!: string;
  mimeType!: string;
  size!: number;
  url!: string;
  thumbnailUrl!: string | null;
  mediumUrl!: string | null;
  createdAt!: Date;
}
