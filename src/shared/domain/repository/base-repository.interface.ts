export interface BaseRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}
