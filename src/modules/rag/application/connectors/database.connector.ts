import { Injectable } from '@nestjs/common';
import type { IDocumentConnector, RawDocument } from '../../domain/services/idocument-connector.interface';

@Injectable()
export class DatabaseConnector implements IDocumentConnector {
  supports(source: string): boolean {
    return source === 'database';
  }

  async fetch(sourcePath: string): Promise<RawDocument[]> {
    // TODO: Implementation for fetching documents from database
    // sourcePath could be a table name or query identifier
    console.log(`Fetching documents from database: ${sourcePath}`);

    return [];
  }
}
