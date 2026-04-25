export interface SearchResult {
  documentId: string;
  content: string;
  score?: number;
}

export interface IRAGService {
  search(query: string, topK?: number): Promise<SearchResult[]>;
  getSources(query: string): Promise<SearchResult[]>;
}