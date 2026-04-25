import { Entity } from '../../../../shared/domain/entity';
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
export declare class DocumentChunk extends Entity<DocumentChunkProps> {
    get content(): string;
    get embedding(): number[];
    get metadata(): ChunkMetadata;
}
