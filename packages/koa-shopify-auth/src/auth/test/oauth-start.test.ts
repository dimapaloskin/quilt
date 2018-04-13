import querystring from 'querystring';
import {createMockContext} from '@shopify/jest-koa-mocks';

import createOAuthStart, {SHOP_PARAM_MISSING} from '../create-oauth-start';
import redirectionPage from '../redirection-page';

const query = querystring.stringify.bind(querystring);

const baseUrl = 'myapp.com/auth';
const shop = 'shop1.myshopify.io';
const redirectionURL = `https://${shop}/admin/oauth/authorize`;

const baseConfig = {
  apiKey: 'myapikey',
  secret: 'mysecret',
  scopes: ['write_orders, write_products'],
};

const queryData = {
  scope: 'write_orders, write_products',
  // eslint-disable-next-line camelcase
  client_id: baseConfig.apiKey,
  // eslint-disable-next-line camelcase
  redirect_uri: `https://${baseUrl}/callback`,
};

describe('OAuthStart', () => {
  it('throws a 400 when no shop query parameter is given', () => {
    const oAuthStart = createOAuthStart(baseConfig);
    const ctx = createMockContext({
      url: `https://${baseUrl}`,
    });

    expect(() => oAuthStart(ctx)).toThrowError(SHOP_PARAM_MISSING);

    try {
      oAuthStart(ctx);
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('sets body to a redirect page for the given shop', () => {
    const oAuthStart = createOAuthStart(baseConfig);
    const ctx = createMockContext({
      url: `https://${baseUrl}?${query({shop})}`,
    });

    oAuthStart(ctx);

    expect(ctx.body).toBe(
      redirectionPage(`${redirectionURL}?${query(queryData)}`),
    );
  });

  it('redirect page includes per-user grant for accessMode: online', () => {
    const oAuthStart = createOAuthStart({
      ...baseConfig,
      accessMode: 'online',
    });

    const ctx = createMockContext({
      url: 'https://myapp.com/auth?shop=shop1.myshopify.io',
    });

    oAuthStart(ctx);

    // eslint-disable-next-line camelcase
    const grantQuery = query({...queryData, 'grant_options[]': 'per-user'});
    expect(ctx.body).toBe(redirectionPage(`${redirectionURL}?${grantQuery}`));
  });
});