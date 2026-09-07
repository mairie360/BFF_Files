import { Router } from 'express';
import { z } from 'zod';
import { registry } from '../openapi-registry';
import { authorization, forward, json, routeError } from '../clients/upstream';

const router = Router();
router.use((req, res, next) => {
  try { authorization(req); next(); } catch (error) { routeError(res, error); }
});
const id = (value: unknown) => encodeURIComponent(String(value));

export const FileSchema = registry.register('LibraryFile', z.object({
  id: z.string(), name: z.string(), type: z.enum(['pdf', 'document', 'spreadsheet', 'image', 'archive']),
  sizeBytes: z.number().nonnegative(), sizeLabel: z.string(), owner: z.string(), category: z.string(),
  modifiedAt: z.string(), isNew: z.boolean().optional(),
  allowedActions: z.array(z.enum(['open', 'download', 'share', 'delete'])).default([]),
}));
export const FilesBootstrapSchema = registry.register('FilesBootstrap', z.object({
  files: z.array(FileSchema), categories: z.array(z.string()), currentUserName: z.string(),
  canUpload: z.boolean(),
}));
registry.registerPath({ method: 'get', path: '/files/bootstrap', responses: {
  200: { description: 'Bibliothèque de l’utilisateur connecté', content: { 'application/json': { schema: FilesBootstrapSchema } } },
  401: { description: 'Session invalide' }, 502: { description: 'Données indisponibles ou incompatibles' },
} });
router.get('/bootstrap', async (req, res) => {
  try {
    const [listing, categories, session] = await Promise.all([
      json<{ files: unknown[]; canUpload: boolean }>(req, 'FILES_API', '/api/v1/files/'),
      json<{ categories: string[] }>(req, 'FILES_API', '/api/v1/file-categories/'),
      json<{ first_name: string; last_name: string }>(req, 'CORE_API', '/api/v1/user/me/'),
    ]);
    return res.json(FilesBootstrapSchema.parse({ ...listing, categories: categories.categories, currentUserName: `${session.first_name} ${session.last_name}`.trim() }));
  } catch (error) { return routeError(res, error); }
});

registry.registerPath({ method: 'get', path: '/files', responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.get('/', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/` + (req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '')));

registry.registerPath({ method: 'post', path: '/files', request: { body: { required: true, content: { 'multipart/form-data': { schema: z.object({ file: z.string().openapi({ format: 'binary' }), category: z.string().optional() }) } } } }, responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.post('/', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/`));

registry.registerPath({ method: 'get', path: '/files/{fileId}', request: { params: z.object({ fileId: z.string() }) }, responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.get('/:fileId', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/${id(req.params.fileId)}/` + (req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '')));

registry.registerPath({ method: 'get', path: '/files/{fileId}/download', request: { params: z.object({ fileId: z.string() }) }, responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.get('/:fileId/download', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/${id(req.params.fileId)}/content` + (req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '')));

registry.registerPath({ method: 'delete', path: '/files/{fileId}', request: { params: z.object({ fileId: z.string() }) }, responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.delete('/:fileId', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/${id(req.params.fileId)}/`));

registry.registerPath({ method: 'post', path: '/files/{fileId}/shares', request: { params: z.object({ fileId: z.string() }), body: { required: true, content: { 'application/json': { schema: z.record(z.string(), z.unknown()) } } } }, responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.post('/:fileId/shares', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/${id(req.params.fileId)}/shares/`));

registry.registerPath({ method: 'delete', path: '/files/{fileId}/shares/{shareId}', request: { params: z.object({ fileId: z.string(), shareId: z.string() }) }, responses: { 200: { description: 'Réponse de l’API propriétaire' }, 201: { description: 'Création confirmée' }, 204: { description: 'Opération confirmée' }, 401: { description: 'Session invalide' }, 502: { description: 'Service indisponible' } } });
router.delete('/:fileId/shares/:shareId', (req, res) => forward(req, res, 'FILES_API', `/api/v1/files/${id(req.params.fileId)}/shares/${id(req.params.shareId)}`));

export default router;
