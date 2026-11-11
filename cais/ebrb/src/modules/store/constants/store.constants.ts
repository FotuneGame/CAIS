export const INDEX_MAPPING = {
  mappings: {
    properties: {
      title: { type: 'keyword', fields: { search: { type: 'text' } } },
      text: { type: 'text' },
      injection: { type: 'boolean' },
      reviewed: { type: 'boolean' },
    },
  },
};

export const REVIEW_SCRIPT = {
  source: 'ctx._source.reviewed = true',
  lang: 'painless',
};

const flag = (field: string) => ({ filter: { term: { [field]: true } } });

export const LIST_AGGREGATION = {
  titles: {
    terms: { field: 'title', size: 1000 },
    aggs: { injection: flag('injection'), reviewed: flag('reviewed') },
  },
};
