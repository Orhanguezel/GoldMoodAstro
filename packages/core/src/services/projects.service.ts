import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Project, ProjectImage, ProjectListParams } from '../types/project.type';

export function getProjects(
  baseUrl: string,
  params?: ProjectListParams,
): Promise<Project[]> {
  return apiFetch<Project[]>(baseUrl, API_ENDPOINTS.PUBLIC.PROJECTS.LIST, params as Record<string, unknown>);
}

export function getProjectBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
): Promise<Project> {
  return apiFetch<Project>(baseUrl, API_ENDPOINTS.PUBLIC.PROJECTS.BY_SLUG(slug), { language: locale });
}

export function getProjectById(
  baseUrl: string,
  id: string,
  locale: string,
): Promise<Project> {
  return apiFetch<Project>(baseUrl, API_ENDPOINTS.PUBLIC.PROJECTS.BY_ID(id), { language: locale });
}

export function getProjectImages(
  baseUrl: string,
  projectId: string,
  locale: string,
): Promise<ProjectImage[]> {
  return apiFetch<ProjectImage[]>(baseUrl, API_ENDPOINTS.PUBLIC.PROJECTS.IMAGES(projectId), { language: locale });
}
