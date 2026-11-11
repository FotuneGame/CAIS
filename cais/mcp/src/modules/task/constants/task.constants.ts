import { z } from 'zod';

export const AGENT = z.string().max(50).default('coder');
