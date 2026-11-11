import request from 'supertest';
import { createApp, rpc } from './app';

describe('OAuth', () => {
  let ctx: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    ctx = await createApp(false);
  });

  afterAll(() => ctx.app.close());

  it('без токена — 401 и ссылка на метаданные', async () => {
    const res = await ctx.post(rpc('tools/list')).expect(401);
    expect(res.headers['www-authenticate']).toContain(
      'oauth-protected-resource',
    );
  });

  it('метаданные ресурса доступны без токена', () =>
    request(ctx.app.getHttpServer())
      .get('/.well-known/oauth-protected-resource')
      .expect(200));
});
