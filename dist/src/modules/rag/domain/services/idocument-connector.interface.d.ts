export interface RawDocument {
    id: string;
    source: string;
    sourcePath: string;
    content: string;
    metadata: Record<string, any>;
}
export interface IDocumentConnector {
    fetch(sourcePath: string): Promise<RawDocument[]>;
    supports(source: string): boolean;
}
