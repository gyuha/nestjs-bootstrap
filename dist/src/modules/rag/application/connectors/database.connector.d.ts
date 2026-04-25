import type {
  IDocumentConnector,
  RawDocument,
} from "../../domain/services/idocument-connector.interface";
export declare class DatabaseConnector implements IDocumentConnector {
  supports(source: string): boolean;
  fetch(sourcePath: string): Promise<RawDocument[]>;
}
