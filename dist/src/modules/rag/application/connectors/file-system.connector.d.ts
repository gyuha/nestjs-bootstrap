import type {
  IDocumentConnector,
  RawDocument,
} from "../../domain/services/idocument-connector.interface";
export declare class FileSystemConnector implements IDocumentConnector {
  supports(source: string): boolean;
  fetch(sourcePath: string): Promise<RawDocument[]>;
  private fetchDirectory;
  private readFile;
}
