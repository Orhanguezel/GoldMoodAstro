import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthUserId, handleRouteError, sendNotFound } from '../_shared';
import { sendMail } from '../mail/service';
import {
  createConsultantApplicationSchema,
  listConsultantApplicationsSchema,
  rejectConsultantApplicationSchema,
} from './validation';
import {
  approveApplication,
  createApplication,
  getApplication,
  listApplications,
  rejectApplication,
} from './repository';

function getOptionalUserId(req: FastifyRequest): string | null {
  const user = (req as FastifyRequest & { user?: { sub?: string; id?: string } }).user;
  return user?.sub ?? user?.id ?? null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendApplicationMail(
  req: FastifyRequest,
  to: string,
  subject: string,
  html: string,
) {
  try {
    await sendMail({ to, subject, html });
  } catch (err) {
    req.log.warn({ err, to }, 'consultant_application_email_failed');
  }
}

export async function createConsultantApplication(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createConsultantApplicationSchema.parse(req.body ?? {});
    const row = await createApplication({ ...body, user_id: getOptionalUserId(req) });
    return reply.code(201).send({ data: row });
  } catch (err) {
    return handleRouteError(reply, req, err, 'create_consultant_application');
  }
}

export async function listConsultantApplications(req: FastifyRequest, reply: FastifyReply) {
  try {
    const params = listConsultantApplicationsSchema.parse(req.query ?? {});
    const rows = await listApplications(params);
    return reply.send({ data: rows });
  } catch (err) {
    return handleRouteError(reply, req, err, 'list_consultant_applications');
  }
}

export async function getConsultantApplication(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await getApplication(id);
    if (!row) return sendNotFound(reply);
    return reply.send({ data: row });
  } catch (err) {
    return handleRouteError(reply, req, err, 'get_consultant_application');
  }
}

export async function approveConsultantApplication(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const reviewerId = getAuthUserId(req) || null;
    const row = await approveApplication(id, reviewerId);
    if (!row) return sendNotFound(reply);

    void sendApplicationMail(
      req,
      row.email,
      'Danışman başvurunuz onaylandı',
      `<p>Merhaba ${escapeHtml(row.full_name)},</p><p>GoldMoodAstro danışman başvurunuz onaylandı. Danışman panelinden profilinizi tamamlayabilirsiniz.</p>`,
    );

    return reply.send({ data: row });
  } catch (err) {
    return handleRouteError(reply, req, err, 'approve_consultant_application');
  }
}

export async function rejectConsultantApplication(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = rejectConsultantApplicationSchema.parse(req.body ?? {});
    const reviewerId = getAuthUserId(req) || null;
    const row = await rejectApplication(id, reviewerId, body);
    if (!row) return sendNotFound(reply);

    void sendApplicationMail(
      req,
      row.email,
      'Danışman başvurunuz değerlendirildi',
      `<p>Merhaba ${escapeHtml(row.full_name)},</p><p>GoldMoodAstro danışman başvurunuz şu nedenle onaylanamadı:</p><p>${escapeHtml(body.rejection_reason)}</p>`,
    );

    return reply.send({ data: row });
  } catch (err) {
    return handleRouteError(reply, req, err, 'reject_consultant_application');
  }
}
