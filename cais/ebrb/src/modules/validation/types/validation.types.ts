import type { Extracted } from '../../infer/types/infer.types';

export type Raw = Record<string, { value?: unknown; confidence?: unknown }>;

export type Validated = { extracted: Extracted; problems: string[] };
