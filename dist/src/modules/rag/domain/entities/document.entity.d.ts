import { Entity } from "../../../../shared/domain/entity";
export interface DocumentProps {
  id: string;
  source: string;
  sourcePath: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
export declare class Document extends Entity<DocumentProps> {
  get content(): string;
  get metadata(): Record<string, any>;
  get source(): string;
  get sourcePath(): string;
  get createdAt(): Date;
}
