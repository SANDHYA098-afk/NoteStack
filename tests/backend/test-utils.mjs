// Test: shared/utils.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { respond, log, getUserId, parseBody, getQueryParam } from '../../shared/utils.mjs';

describe('shared/utils.mjs', () => {

  describe('respond()', () => {
    it('should return correct status code', () => {
      const result = respond(200, { message: 'ok' });
      assert.strictEqual(result.statusCode, 200);
    });

    it('should stringify body', () => {
      const result = respond(200, { message: 'hello' });
      const body = JSON.parse(result.body);
      assert.strictEqual(body.message, 'hello');
    });

    it('should include CORS headers', () => {
      const result = respond(200, {});
      assert.strictEqual(result.headers['Access-Control-Allow-Origin'], '*');
      assert.strictEqual(result.headers['Content-Type'], 'application/json');
    });

    it('should handle error status codes', () => {
      const result = respond(500, { error: 'fail' });
      assert.strictEqual(result.statusCode, 500);
      assert.strictEqual(JSON.parse(result.body).error, 'fail');
    });

    it('should handle 401 unauthorized', () => {
      const result = respond(401, { error: 'Unauthorized' });
      assert.strictEqual(result.statusCode, 401);
    });
  });

  describe('getUserId()', () => {
    it('should extract userId from Cognito claims', () => {
      const event = {
        requestContext: {
          authorizer: {
            claims: { sub: 'user-abc-123' }
          }
        }
      };
      assert.strictEqual(getUserId(event), 'user-abc-123');
    });

    it('should return undefined for missing claims', () => {
      assert.strictEqual(getUserId({}), undefined);
    });

    it('should return undefined for null event', () => {
      assert.strictEqual(getUserId({ requestContext: {} }), undefined);
    });
  });

  describe('parseBody()', () => {
    it('should parse valid JSON body', () => {
      const event = { body: '{"title":"Test","content":"Hello"}' };
      const body = parseBody(event);
      assert.strictEqual(body.title, 'Test');
      assert.strictEqual(body.content, 'Hello');
    });

    it('should return empty object for null body', () => {
      const body = parseBody({ body: null });
      assert.deepStrictEqual(body, {});
    });

    it('should return empty object for invalid JSON', () => {
      const body = parseBody({ body: 'not json' });
      assert.deepStrictEqual(body, {});
    });

    it('should return empty object for empty string', () => {
      const body = parseBody({ body: '' });
      assert.deepStrictEqual(body, {});
    });
  });

  describe('getQueryParam()', () => {
    it('should return query parameter value', () => {
      const event = { queryStringParameters: { category: 'lecture', q: 'aws' } };
      assert.strictEqual(getQueryParam(event, 'category'), 'lecture');
      assert.strictEqual(getQueryParam(event, 'q'), 'aws');
    });

    it('should return null for missing parameter', () => {
      const event = { queryStringParameters: { category: 'lecture' } };
      assert.strictEqual(getQueryParam(event, 'q'), null);
    });

    it('should return null when queryStringParameters is null', () => {
      assert.strictEqual(getQueryParam({}, 'q'), null);
    });
  });

  describe('log()', () => {
    it('should not throw', () => {
      assert.doesNotThrow(() => log('INFO', 'test message', { key: 'value' }));
    });

    it('should handle missing data param', () => {
      assert.doesNotThrow(() => log('ERROR', 'error message'));
    });
  });

});
