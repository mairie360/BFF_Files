import request from 'supertest';
import { readFileSync } from 'node:fs';
import app from '../src/app';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { fetchMock.mockReset(); });
afterAll(() => { fetchMock.mockRestore(); });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('runtime and exported routes/data have the same OpenAPI document', async () => {
  const expected = JSON.parse(readFileSync('contracts/openapi.json', 'utf8'));
  for (const path of ['/openapi.json', '/swagger.json']) {
    const result = await request(app).get(path);
    expect(result.status).toBe(200);
    expect(result.body).toEqual(expected);
  }
});

test('bootstrap rejects a missing session before contacting upstream services', async () => {
  const result = await request(app).get('/files/bootstrap');
  expect(result.status).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();
});

beforeEach(() => { process.env.FILES_API_URL = 'http://files.example'; process.env.CORE_API_URL = 'http://core.example'; });
test('bootstrap preserves identifiers, data and granted actions', async () => {
  const file = { id: 'file-42', name: 'Budget.pdf', type: 'pdf', sizeBytes: 42, sizeLabel: '42 B', owner: 'Alice Martin', category: 'Finances', modifiedAt: '2026-09-01', allowedActions: ['download'] };
  fetchMock.mockResolvedValueOnce(response({ files: [file], canUpload: false }))
    .mockResolvedValueOnce(response({ categories: ['Finances'] }))
    .mockResolvedValueOnce(response({ first_name: 'Alice', last_name: 'Martin' }));
  const result = await request(app).get('/files/bootstrap').set('Authorization', 'Bearer test-session');
  expect(result.status).toBe(200);
  expect(result.body).toEqual({ files: [file], categories: ['Finances'], currentUserName: 'Alice Martin', canUpload: false });
  for (const [, init] of fetchMock.mock.calls) expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-session');
});
test('list forwards filters and keeps an upstream denial', async () => {
  fetchMock.mockResolvedValueOnce(response({ message: 'Denied' }, 403));
  const result = await request(app).get('/files?q=budget&type=pdf').set('Authorization', 'Bearer test-session');
  expect(String(fetchMock.mock.calls[0][0])).toBe('http://files.example/api/v1/files/?q=budget&type=pdf');
  expect(result.status).toBe(403);
  expect(result.body).toEqual({ message: 'Denied' });
});
test('upload forwards multipart bytes and download preserves binary content', async () => {
  fetchMock.mockResolvedValueOnce(response({ id: 'file-42' }, 201));
  const upload = await request(app).post('/files').set('Authorization', 'Bearer test-session').field('category', 'Finances').attach('file', Buffer.from([0, 255, 128, 13]), 'budget.bin');
  expect(upload.status).toBe(201);
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
  expect(fetchMock.mock.calls[0][1]?.body).toBeInstanceOf(ArrayBuffer);
  const binary = Uint8Array.from([0, 255, 128, 13]);
  fetchMock.mockResolvedValueOnce(new Response(binary, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="budget.bin"' } }));
  const downloaded = await request(app).get('/files/file-42/download').set('Authorization', 'Bearer test-session');
  expect(downloaded.body).toEqual(Buffer.from(binary));
  expect(downloaded.headers['content-disposition']).toContain('budget.bin');
});
test('delete keeps 204 and an empty body', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  const result = await request(app).delete('/files/file-42').set('Authorization', 'Bearer test-session');
  expect(result.status).toBe(204); expect(result.text).toBe('');
});
test('incompatible upstream data is not replaced with demonstration files', async () => {
  fetchMock.mockResolvedValue(response({}));
  const result = await request(app).get('/files/bootstrap').set('Authorization', 'Bearer test-session');
  expect(result.status).toBe(502); expect(result.body.files).toBeUndefined();
});
