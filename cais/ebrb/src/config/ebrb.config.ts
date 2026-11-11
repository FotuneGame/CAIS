import { registerAs } from '@nestjs/config';

export interface EbrbConfig {
  confidence: number;
  ignorance: number;
  conflict: number;
}

export default registerAs('ebrb', (): EbrbConfig => ({
  confidence: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.65'),
  ignorance: parseFloat(process.env.IGNORANCE_THRESHOLD || '0.3'),
  conflict: parseFloat(process.env.CONFLICT_THRESHOLD || '0.3'),
}));
