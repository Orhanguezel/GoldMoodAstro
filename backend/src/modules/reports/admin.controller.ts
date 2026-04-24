// ===================================================================
// FILE: src/modules/reports/admin.controller.ts
// ===================================================================

import type { RouteHandler } from 'fastify';
import {
  getKpiDataByFilters,
  getUsersPerformanceDataByFilters,
  getLocationsDataByFilters,
  type ReportParams,
} from './repository';

export const getKpiReportAdmin: RouteHandler = async (req, reply) => {
  const q = req.query as ReportParams;
  try {
    const data = await getKpiDataByFilters(q);
    return reply.send(data);
  } catch (err) {
    req.log.error(err, 'getKpiReportAdmin_failed');
    return reply.code(500).send({ error: { message: 'getKpiReportAdmin_failed' } });
  }
};

export const getUsersPerformanceReportAdmin: RouteHandler = async (req, reply) => {
  const q = req.query as ReportParams;
  try {
    const data = await getUsersPerformanceDataByFilters(q);
    return reply.send(data);
  } catch (err) {
    req.log.error(err, 'getUsersPerformanceReportAdmin_failed');
    return reply.code(500).send({ error: { message: 'getUsersPerformanceReportAdmin_failed' } });
  }
};

export const getLocationsReportAdmin: RouteHandler = async (req, reply) => {
  const q = req.query as ReportParams;
  try {
    const data = await getLocationsDataByFilters(q);
    return reply.send(data);
  } catch (err) {
    req.log.error(err, 'getLocationsReportAdmin_failed');
    return reply.code(500).send({ error: { message: 'getLocationsReportAdmin_failed' } });
  }
};
