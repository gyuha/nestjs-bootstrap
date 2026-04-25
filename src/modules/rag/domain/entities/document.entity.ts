import { Entity } from "../../../../shared/domain/entity";

export interface DocumentProps {
  id: string;
  source: string; // 'filesystem', 'database', 'notion', etc.
  sourcePath: string; // original path or URL
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class Document extends Entity<DocumentProps> {
  get content(): string {
    return this.props.content;
  }

  get metadata(): Record<string, any> {
    return this.props.metadata;
  }

  get source(): string {
    return this.props.source;
  }

  get sourcePath(): string {
    return this.props.sourcePath;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
