const mock = require('mock-require');
const { expect } = require('chai');

const API_WHITELIST = '../../../../helpers/apiWhiteList';
let isAllowed;

const USER_ID = '74a72947-8b92-4498-921b-44086c1b21ee';
const OTHER_USER_ID = '5d757783-a86a-40cd-a814-1b6a16d37cb6';

// Runs the whitelist middleware and resolves with 'next' or the HTTP status it responded with
const check = ({ path, method = 'GET', body = {}, session = {} }) => new Promise((resolve) => {
  const req = { path, originalUrl: path, url: path, method, body, session, headers: {}, query: {}, params: {}, get: () => '' };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    send() { return this; },
    end() { resolve(this.statusCode); },
  };
  isAllowed()(req, res, () => resolve('next'));
});

const loggedIn = { userId: USER_ID, roles: ['PUBLIC'] };
const searchBody = (id) => ({ filters: { recipient: { id: { eq: id } } } });

describe('API whitelist: RC certificate endpoints', function () {
  let cachedBefore;

  // Run with the whitelist on, whatever the local environment sets; undone afterwards so other specs are unaffected
  before(function () {
    cachedBefore = new Set(Object.keys(require.cache));
    mock('../../../../helpers/environmentVariablesHelper.js', {
      PORTAL_API_WHITELIST_CHECK: 'true',
      KONG_DEVICE_REGISTER_ANONYMOUS_TOKEN: 'true',
    });
    isAllowed = mock.reRequire(API_WHITELIST).isAllowed;
  });

  after(function () {
    mock.stopAll();
    Object.keys(require.cache).forEach((key) => {
      if (!cachedBefore.has(key) || key === require.resolve(API_WHITELIST)) delete require.cache[key];
    });
  });

  describe('/learner/rc/certificate/v1/search', function () {
    const path = '/learner/rc/certificate/v1/search';

    it('should allow a logged-in user to search their own certificates', async function () {
      expect(await check({ path, method: 'POST', body: searchBody(USER_ID), session: loggedIn })).to.eql('next');
    });

    it("should reject a logged-in user searching another user's certificates", async function () {
      expect(await check({ path, method: 'POST', body: searchBody(OTHER_USER_ID), session: loggedIn })).to.eql(403);
    });

    it('should reject a logged-in user searching without a recipient filter', async function () {
      expect(await check({ path, method: 'POST', body: { filters: {} }, session: loggedIn })).to.eql(403);
    });

    it('should reject a logged-out visitor, even without a recipient filter', async function () {
      expect(await check({ path, method: 'POST', body: { filters: {} } })).to.eql(403);
      expect(await check({ path, method: 'POST', body: searchBody(USER_ID) })).to.eql(403);
    });
  });

  describe('/learner/rc/certificate/v1/download/:id', function () {
    const path = '/learner/rc/certificate/v1/download/9763d1a9-0d49-411a-b7e7-a9147fd39b6e';

    it('should allow a logged-in user', async function () {
      expect(await check({ path, session: loggedIn })).to.eql('next');
    });

    it('should reject a logged-out visitor', async function () {
      expect(await check({ path })).to.eql(403);
    });
  });

  describe('/learner/rc/certificate/v1/key/:id', function () {
    it('should stay public (it only serves the public signing key)', async function () {
      expect(await check({ path: '/learner/rc/certificate/v1/key/some-key-id' })).to.eql('next');
    });
  });
});
