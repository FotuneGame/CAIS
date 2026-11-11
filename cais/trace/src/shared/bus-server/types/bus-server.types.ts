import { Type } from '@nestjs/common';
import { JWTPayload } from 'jose';

export type Run<D> = (body: D, user: JWTPayload) => unknown;

export type Route = { dto: Type<object>; run: Run<object> };
