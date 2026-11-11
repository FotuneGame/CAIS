import type { Fact } from '../../facts/types/facts.types';

export type SearchResult = {
  hits: { hits: { _id: string; _score: number; _source: Fact }[] };
};

export type Bucket = {
  key: string;
  doc_count: number;
  injection: { doc_count: number };
  reviewed: { doc_count: number };
};

export type Updated = { updated: number };

export type ListResult = { aggregations: { titles: { buckets: Bucket[] } } };
