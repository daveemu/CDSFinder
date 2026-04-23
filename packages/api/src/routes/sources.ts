import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { dataSources } from '../db/schema/index.js';
import { SapODataClient } from '../services/ingestion/sap-odata.js';
import { encrypt, decrypt } from '../services/crypto.js';
import type { DataSourceInsert } from '@cdsfinder/shared';

export const sourcesRoutes: FastifyPluginAsync = async (app) => {
  // List all sources (credentials omitted)
  app.get('/sources', async () => {
    const rows = await db.select({
      id: dataSources.id,
      name: dataSources.name,
      sourceType: dataSources.sourceType,
      baseUrl: dataSources.baseUrl,
      systemId: dataSources.systemId,
      client: dataSources.client,
      authType: dataSources.authType,
      isActive: dataSources.isActive,
      lastConnected: dataSources.lastConnected,
      createdAt: dataSources.createdAt,
      updatedAt: dataSources.updatedAt,
    }).from(dataSources).orderBy(dataSources.name);

    return { data: rows };
  });

  // Create a new source
  app.post<{ Body: DataSourceInsert }>('/sources', async (request, reply) => {
    const { name, sourceType, baseUrl, systemId, client, authType, username, password } = request.body;

    if (!name || !sourceType || !authType) {
      return reply.status(400).send({ error: 'Bad Request', message: 'name, sourceType, and authType are required' });
    }

    const credentials = username || password ? { username, password } : null;
    const credentialsEncrypted = credentials ? encrypt(JSON.stringify(credentials)) : null;

    const [row] = await db.insert(dataSources).values({
      name,
      sourceType: sourceType as 'S4_ODATA',
      baseUrl,
      systemId,
      client,
      authType: authType as 'BASIC',
      credentialsEncrypted,
    }).returning();

    if (!row) return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create source' });

    const { credentialsEncrypted: _omit, ...safe } = row;
    return reply.status(201).send({ data: safe });
  });

  // Update a source
  app.put<{ Params: { id: string }; Body: Partial<DataSourceInsert> }>('/sources/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, baseUrl, systemId, client, authType, username, password, sourceType } = request.body;

    const existing = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
    if (!existing[0]) return reply.status(404).send({ error: 'Not Found', message: 'Source not found' });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData['name'] = name;
    if (baseUrl !== undefined) updateData['baseUrl'] = baseUrl;
    if (systemId !== undefined) updateData['systemId'] = systemId;
    if (client !== undefined) updateData['client'] = client;
    if (authType !== undefined) updateData['authType'] = authType;
    if (sourceType !== undefined) updateData['sourceType'] = sourceType;

    if (username !== undefined || password !== undefined) {
      const existingCreds = existing[0]?.credentialsEncrypted
        ? (JSON.parse(decrypt(existing[0].credentialsEncrypted)) as Record<string, string>)
        : {};
      const newCreds = {
        ...existingCreds,
        ...(username !== undefined && { username }),
        ...(password !== undefined && { password }),
      };
      updateData['credentialsEncrypted'] = encrypt(JSON.stringify(newCreds));
    }

    const [updated] = await db.update(dataSources).set(updateData as never).where(eq(dataSources.id, id)).returning();
    const { credentialsEncrypted: _omit, ...safe } = updated!;
    return { data: safe };
  });

  // Delete a source
  app.delete<{ Params: { id: string } }>('/sources/:id', async (request, reply) => {
    const { id } = request.params;
    await db.delete(dataSources).where(eq(dataSources.id, id));
    return reply.status(204).send();
  });

  // Test connection
  app.post<{ Params: { id: string } }>('/sources/:id/test', async (request, reply) => {
    const { id } = request.params;

    const [source] = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
    if (!source) return reply.status(404).send({ error: 'Not Found', message: 'Source not found' });

    const credentials = source.credentialsEncrypted
      ? (JSON.parse(decrypt(source.credentialsEncrypted)) as { username?: string; password?: string })
      : {};

    const client = new SapODataClient({
      baseUrl: source.baseUrl ?? '',
      systemId: source.systemId ?? '',
      client: source.client ?? '000',
      authType: source.authType as 'BASIC',
      username: credentials.username,
      password: credentials.password,
      maxPageSize: 1,
      timeoutMs: 15_000,
    });

    const result = await client.testConnection();

    if (result.success) {
      await db.update(dataSources).set({ lastConnected: new Date() }).where(eq(dataSources.id, id));
    }

    return { data: result };
  });
};
