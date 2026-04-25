import { Injectable } from '@nestjs/common';
import type { IDocumentConnector, RawDocument } from '../../domain/services/idocument-connector.interface';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.pdf', '.docx'];

@Injectable()
export class FileSystemConnector implements IDocumentConnector {
  supports(source: string): boolean {
    return source === 'filesystem';
  }

  async fetch(sourcePath: string): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];
    const stat = await fs.promises.stat(sourcePath);

    if (stat.isDirectory()) {
      await this.fetchDirectory(sourcePath, documents);
    } else if (stat.isFile()) {
      const doc = await this.readFile(sourcePath);
      if (doc) documents.push(doc);
    }

    return documents;
  }

  private async fetchDirectory(dirPath: string, documents: RawDocument[]): Promise<void> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.fetchDirectory(fullPath, documents);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          const doc = await this.readFile(fullPath);
          if (doc) documents.push(doc);
        }
      }
    }
  }

  private async readFile(filePath: string): Promise<RawDocument | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();

      return {
        id: crypto.randomUUID(),
        source: 'filesystem',
        sourcePath: filePath,
        content: content,
        metadata: {
          extension: ext,
          fileName: path.basename(filePath),
          fileSize: (await fs.promises.stat(filePath)).size,
        },
      };
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }
}
