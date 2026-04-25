export type PageRequest = {
  page: number;
  limit: number;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
