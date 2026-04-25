import { Entity } from "../../../../shared/domain/entity";

export interface ChunkMetadata {
  documentId: string;
  source: string;
  chunkIndex: number;
  totalChunks: number;
  createdAt: Date;
}

export interface DocumentChunkProps {
  id: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export class DocumentChunk extends Entity<DocumentChunkProps> {
  get content(): string {
    return this.props.content;
  }

  get embedding(): number[] {
    return this.props.embedding;
  }

  get metadata(): ChunkMetadata {
    return this.props.metadata;
  }
}
