import type { RouteHandler } from 'fastify';
import {
  createBirthChart,
  deleteBirthChart,
  getBirthChart,
  getBirthChartSynastry,
  getBirthChartTransit,
  listBirthCharts,
  previewBirthChart,
} from './repository';
import { createBirthChartSchema, synastrySchema } from './validation';

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

function statusFromError(error: unknown) {
  return Number((error as { statusCode?: number })?.statusCode ?? 500);
}

export const listBirthChartsHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  return { data: await listBirthCharts(userId) };
};

export const createBirthChartHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  try {
    const body = createBirthChartSchema.parse(req.body ?? {});
    return reply.code(201).send({ data: await createBirthChart(userId, body) });
  } catch (error) {
    return reply.code(statusFromError(error)).send({
      error: { message: error instanceof Error ? error.message : 'birth_chart_create_failed' },
    });
  }
};

export const previewBirthChartHandler: RouteHandler = async (req, reply) => {
  try {
    const body = createBirthChartSchema.parse(req.body ?? {});
    return reply.code(200).send({ data: await previewBirthChart(body) });
  } catch (error) {
    return reply.code(statusFromError(error)).send({
      error: { message: error instanceof Error ? error.message : 'birth_chart_preview_failed' },
    });
  }
};

export const getBirthChartHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const id = String((req.params as { id?: string }).id ?? '');
  const row = await getBirthChart(userId, id);
  if (!row) return reply.code(404).send({ error: { message: 'birth_chart_not_found' } });
  return { data: row };
};

export const deleteBirthChartHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const id = String((req.params as { id?: string }).id ?? '');
  return { data: await deleteBirthChart(userId, id) };
};

export const birthChartTransitHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const id = String((req.params as { id?: string }).id ?? '');
  const transit = await getBirthChartTransit(userId, id);
  if (!transit) return reply.code(404).send({ error: { message: 'birth_chart_not_found' } });
  return { data: transit };
};

export const birthChartSynastryHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const body = synastrySchema.parse(req.body ?? {});
  const synastry = await getBirthChartSynastry(userId, body.chart_a_id, body.chart_b_id);
  if (!synastry) return reply.code(404).send({ error: { message: 'birth_chart_not_found' } });
  return { data: synastry };
};
