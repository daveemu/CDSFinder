import type { FastifyPluginAsync } from 'fastify';
import { search } from '../services/search/index.js';
import type { SearchQuery } from '@cdsfinder/shared';

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get('/search', async (request, reply) => {
    const q = request.query as Record<string, string | string[] | undefined>;

    const parseBoolean = (v: string | string[] | undefined): boolean | undefined => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    };

    const parseArray = (v: string | string[] | undefined): string | string[] | undefined => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string' && v.includes(',')) return v.split(',');
      return v;
    };

    const page = Math.max(1, parseInt(String(q['page'] ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(q['pageSize'] ?? '25'), 10) || 25));

    const query: SearchQuery = {
      q: typeof q['q'] === 'string' ? q['q'] : undefined,
      mode: 'fulltext',
      filters: {
        extractionEnabled: parseBoolean(q['extractionEnabled']),
        deltaEnabled: parseBoolean(q['deltaEnabled']),
        odataPublished: parseBoolean(q['odataPublished']),
        vdmViewType: parseArray(q['vdmViewType']) as SearchQuery['filters']['vdmViewType'],
        dataCategory: parseArray(q['dataCategory']) as SearchQuery['filters']['dataCategory'],
        sapModule: parseArray(q['sapModule']) as SearchQuery['filters']['sapModule'],
        releaseVersion: typeof q['releaseVersion'] === 'string' ? q['releaseVersion'] : undefined,
      },
      page,
      pageSize,
    };

    const result = await search(query);
    return result;
  });
};
