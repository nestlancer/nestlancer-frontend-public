import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { extractDocumentUrl } from '../utils/extract-document-url';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import type {
  AdminBulkOperationResult,
  AdminChangeRoleBody,
  AdminChangeStatusBody,
  AdminForcePasswordResetResult,
  AdminPaginatedUsers,
  AdminPasswordResetResult,
  AdminResetPasswordBody,
  AdminSessionsResponse,
  AdminUpdateUserBody,
  AdminUserDetail,
} from '../types/admin-users';
import type { CreateLineItemBlockDto } from '../generated/models/createLineItemBlockDto';
import type { CreateQuoteDto } from '../generated/models/createQuoteDto';
import type { CreateQuoteDtoSchedulePreset } from '../generated/models/createQuoteDtoSchedulePreset';
import type { PaymentScheduleInstallmentDto } from '../generated/models/paymentScheduleInstallmentDto';
import type { QuotePrefillDto } from '../generated/models/quotePrefillDto';
import type { UpdateLineItemBlockDto } from '../generated/models/updateLineItemBlockDto';
import type { UpdateQuoteAdminDto } from '../generated/models/updateQuoteAdminDto';

/** Query string values forwarded to the gateway (OpenAPI often omits schemas). */
export type AdminQueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Create-quote body from OpenAPI CreateQuoteDto.
 * `items` required by admin UI (unless caller uses prefillFromPackage).
 */
export type AdminCreateQuoteFromRequestBody = CreateQuoteDto & {
  items?: NonNullable<CreateQuoteDto['items']>;
};

/**
 * Patch body: OpenAPI UpdateQuoteAdminDto plus schedule fields supported by local Flow Plan
 * backend (not yet on live UpdateQuoteAdminDto schema until BE OpenAPI export catches up).
 */
export type AdminPatchQuoteBody = UpdateQuoteAdminDto & {
  schedulePreset?: CreateQuoteDtoSchedulePreset;
  paymentSchedule?: PaymentScheduleInstallmentDto[];
  requiresContract?: boolean;
};

/**
 * Return values are typed as unknown until OpenAPI response schemas are populated.
 * Paths are relative to the shared Axios baseURL (…/api/v1).
 */
export class AdminService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async getDashboardOverview(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/overview`, { params });
    return data;
  }

  async getRevenueAnalytics(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/revenue`, { params });
    return data;
  }

  async getUserMetrics(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/users`, { params });
    return data;
  }

  async getProjectMetrics(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/projects`, { params });
    return data;
  }

  async getPerformanceMetrics(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/performance`);
    return data;
  }

  async getRecentActivity(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/activity`);
    return data;
  }

  async getSystemAlerts(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/dashboard/alerts`);
    return data;
  }

  async listUsers(params?: AdminQueryParams): Promise<AdminPaginatedUsers> {
    const { data } = await this.client.get<AdminPaginatedUsers>(`/admin/users`, { params });
    return data;
  }

  async searchUsers(params?: AdminQueryParams): Promise<AdminPaginatedUsers> {
    const { data } = await this.client.get<AdminPaginatedUsers>(`/admin/users/search`, { params });
    return data;
  }

  async getUser(userId: string): Promise<AdminUserDetail> {
    const { data } = await this.client.get<AdminUserDetail>(
      `/admin/users/${encodeURIComponent(String(userId))}`
    );
    return data;
  }

  async updateUser(userId: string, body: AdminUpdateUserBody = {}): Promise<AdminUserDetail> {
    const { data } = await this.client.patch<AdminUserDetail>(
      `/admin/users/${encodeURIComponent(String(userId))}`,
      body
    );
    return data;
  }

  async deleteUser(userId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/users/${encodeURIComponent(String(userId))}`
    );
    return data;
  }

  async changeUserRole(userId: string, body: AdminChangeRoleBody): Promise<AdminUserDetail> {
    const { data } = await this.client.patch<AdminUserDetail>(
      `/admin/users/${encodeURIComponent(String(userId))}/role`,
      body
    );
    return data;
  }

  async changeUserStatus(userId: string, body: AdminChangeStatusBody): Promise<AdminUserDetail> {
    const { data } = await this.client.patch<AdminUserDetail>(
      `/admin/users/${encodeURIComponent(String(userId))}/status`,
      body
    );
    return data;
  }

  async forcePasswordReset(
    userId: string,
    body: Record<string, never> = {}
  ): Promise<AdminForcePasswordResetResult> {
    const { data } = await this.client.post<AdminForcePasswordResetResult>(
      `/admin/users/${encodeURIComponent(String(userId))}/force-password-reset`,
      body
    );
    return data;
  }

  async adminResetPassword(
    userId: string,
    body: AdminResetPasswordBody
  ): Promise<AdminPasswordResetResult> {
    const { data } = await this.client.post<AdminPasswordResetResult>(
      `/admin/users/${encodeURIComponent(String(userId))}/reset-password`,
      body
    );
    return data;
  }

  async getUserSessions(userId: string): Promise<AdminSessionsResponse> {
    const { data } = await this.client.get<AdminSessionsResponse>(
      `/admin/users/${encodeURIComponent(String(userId))}/sessions`
    );
    return data;
  }

  async terminateAnySession(sessionId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/users/sessions/${encodeURIComponent(String(sessionId))}`
    );
    return data;
  }

  async terminateAllUserSessions(userId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/users/${encodeURIComponent(String(userId))}/terminate-all-sessions`,
      body
    );
    return data;
  }

  async getUserActivity(
    userId: string,
    params?: { page?: number; limit?: number }
  ): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/users/${encodeURIComponent(String(userId))}/activity`,
      { params }
    );
    return data;
  }

  async restoreUser(userId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/users/${encodeURIComponent(String(userId))}/restore`,
      body
    );
    return data;
  }

  async bulkUserOperations(body: {
    action: 'suspend' | 'activate' | 'delete' | 'resetPassword';
    userIds: string[];
    reason: string;
  }): Promise<AdminBulkOperationResult> {
    const { data } = await this.client.post<AdminBulkOperationResult>(`/admin/users/bulk`, body);
    return data;
  }

  async getUsersLogs(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/users/logs`, { params });
    return data;
  }

  async getUsersSecurityStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/users/security-stats`);
    return data;
  }

  async getAuditLogs(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/logs`, { params });
    return data;
  }

  async getSecurityStats(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/logs/security-stats`, { params });
    return data;
  }

  async getSystemConfig(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/system/config`);
    return data;
  }

  async updateSystemConfig(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(`/admin/system/config`, body);
    return data;
  }

  async getSystemFeatures(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/system/features`);
    return data;
  }

  async patchSystemFeature(flag: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/system/features/${encodeURIComponent(String(flag))}`,
      body
    );
    return data;
  }

  async getSystemJobs(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/system/jobs`, { params });
    return data;
  }

  async retrySystemJob(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/system/jobs/${encodeURIComponent(String(id))}/retry`,
      body
    );
    return data;
  }

  async cancelSystemJob(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/system/jobs/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async getEmailTemplates(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/system/email-templates`, { params });
    return data;
  }

  async getEmailTemplate(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/system/email-templates/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async updateEmailTemplate(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/system/email-templates/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async previewEmailTemplate(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/system/email-templates/${encodeURIComponent(String(id))}/preview`
    );
    return data;
  }

  async sendTestEmail(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/system/email-templates/${encodeURIComponent(String(id))}/test`,
      body
    );
    return data;
  }

  async exportUserData(userId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/users/${encodeURIComponent(String(userId))}/export`,
      body
    );
    return data;
  }

  async startImpersonation(userId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/users/${encodeURIComponent(String(userId))}/impersonate`,
      body
    );
    return data;
  }

  async endImpersonation(sessionId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/users/impersonate/end/${encodeURIComponent(String(sessionId))}`,
      body
    );
    return data;
  }

  async endImpersonationAlias(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/impersonate/end`, body);
    return data;
  }

  async getImpersonationSessions(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/impersonate/sessions`, { params });
    return data;
  }

  async listAdminPayments(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments`, { params });
    return data;
  }

  async getAdminPaymentStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/stats`);
    return data;
  }

  async getAdminPaymentDetail(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async getAdminPaymentTimeline(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}/timeline`
    );
    return data;
  }

  async getAdminPaymentTransactions(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}/transactions`
    );
    return data;
  }

  async processPaymentRefund(
    id: string,
    body: { amount?: number; reason: string }
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}/refund`,
      body
    );
    return data;
  }

  async listPaymentMilestones(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/milestones`, { params });
    return data;
  }

  async getPaymentMilestone(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/milestones/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async updateMilestone(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/payments/milestones/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  /**
   * @deprecated Use `completeMilestone` (progress) for delivery handoff. Kept for legacy API callers.
   */
  async markMilestoneComplete(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/milestones/${encodeURIComponent(String(id))}/mark-complete`,
      body
    );
    return data;
  }

  async requestMilestonePayment(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/milestones/${encodeURIComponent(String(id))}/request-payment`,
      body
    );
    return data;
  }

  async createProjectMilestones(projectId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/milestones`,
      body
    );
    return data;
  }

  async listPaymentDisputes(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/disputes`, { params });
    return data;
  }

  async getDisputeDetails(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/disputes/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async verifyPayment(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}/verify`,
      body
    );
    return data;
  }

  async approveTransfer(id: string, body: { verificationNotes?: string } = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}/approve-transfer`,
      body
    );
    return data;
  }

  async rejectTransfer(
    id: string,
    body: { reason: string; allowRetry?: boolean }
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/${encodeURIComponent(String(id))}/reject-transfer`,
      body
    );
    return data;
  }

  async listPlatformPaymentAccounts(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/accounts`);
    return data;
  }

  async createPlatformPaymentAccount(body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/payments/accounts`, body);
    return data;
  }

  async updatePlatformPaymentAccount(id: string, body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/payments/accounts/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async deletePlatformPaymentAccount(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/payments/accounts/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async listCompanyLegalProfiles(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/company-legal`);
    return data;
  }

  async createCompanyLegalProfile(body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/payments/company-legal`, body);
    return data;
  }

  async updateCompanyLegalProfile(id: string, body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/payments/company-legal/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async deleteCompanyLegalProfile(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/payments/company-legal/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async respondDispute(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/payments/disputes/${encodeURIComponent(String(id))}/respond`,
      body
    );
    return data;
  }

  async getReconciliation(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/reconciliation`, { params });
    return data;
  }

  async broadcastSystemMessage(projectId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/messages/projects/${encodeURIComponent(String(projectId))}/system`,
      body
    );
    return data;
  }

  async getFlaggedMessages(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/messages/flagged`, { params });
    return data;
  }

  async flagMessage(id: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/messages/${encodeURIComponent(String(id))}/flag`
    );
    return data;
  }

  async dismissFlaggedMessage(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/messages/flagged/${encodeURIComponent(String(id))}/dismiss`,
      body
    );
    return data;
  }

  async deleteFlaggedMessage(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/messages/flagged/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async escalateFlaggedMessage(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/messages/flagged/${encodeURIComponent(String(id))}/escalate`,
      body
    );
    return data;
  }

  async restoreFlaggedMessage(id: string, body: { content?: string } = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/messages/flagged/${encodeURIComponent(String(id))}/restore`,
      body
    );
    return data;
  }

  async getModerationHistory(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/messages/moderation-history`, {
      params,
    });
    return data;
  }

  async listAdminNotifications(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/notifications`, { params });
    return data;
  }

  async getAdminNotificationStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/notifications/stats`);
    return data;
  }

  async getDeliveryReport(params?: { notificationId?: string }): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/notifications/delivery-report`, {
      params,
    });
    return data;
  }

  async sendAdminNotification(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/notifications/send`, body);
    return data;
  }

  async broadcastNotification(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/notifications/broadcast`, body);
    return data;
  }

  async sendSegmentNotification(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/notifications/segment`, body);
    return data;
  }

  async getNotificationTemplates(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/notifications/templates`, {
      params,
    });
    return data;
  }

  async createNotificationTemplate(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/notifications/templates`, body);
    return data;
  }

  async updateNotificationTemplate(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/notifications/templates/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async deleteNotificationTemplate(id: string): Promise<void> {
    await this.client.delete(`/admin/notifications/templates/${encodeURIComponent(String(id))}`);
  }

  async listAdminPortfolio(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/portfolio`, { params });
    return data;
  }

  async getAdminPortfolio(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async createAdminPortfolio(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/portfolio`, body);
    return data;
  }

  async patchAdminPortfolio(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async deleteAdminPortfolio(id: string): Promise<void> {
    await this.client.delete(`/admin/portfolio/${encodeURIComponent(String(id))}`);
  }

  async publishAdminPortfolio(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(id))}/publish`,
      body
    );
    return data;
  }

  async unpublishAdminPortfolio(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(id))}/unpublish`,
      body
    );
    return data;
  }

  async listAdminPortfolioMedia(portfolioItemId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(portfolioItemId))}/media`
    );
    return peelSuccessEnvelope(data);
  }

  async uploadAdminPortfolioMedia(
    portfolioItemId: string,
    file: File,
    options?: { title?: string; setAsThumbnail?: boolean; setAsFeaturedVideo?: boolean }
  ): Promise<unknown> {
    const form = new FormData();
    form.append('file', file);
    const params = new URLSearchParams();
    if (options?.title) params.set('title', options.title);
    if (options?.setAsThumbnail) params.set('setAsThumbnail', 'true');
    if (options?.setAsFeaturedVideo) params.set('setAsFeaturedVideo', 'true');
    const { data } = await this.client.post<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(portfolioItemId))}/media/upload`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        params: Object.fromEntries(params.entries()),
      }
    );
    return data;
  }

  async deleteAdminPortfolioMedia(portfolioItemId: string, mediaId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(portfolioItemId))}/media/${encodeURIComponent(String(mediaId))}`
    );
    return data;
  }

  async setAdminPortfolioThumbnail(portfolioItemId: string, mediaId: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(portfolioItemId))}/media/${encodeURIComponent(String(mediaId))}/thumbnail`
    );
    return data;
  }

  async setAdminPortfolioFeaturedVideo(portfolioItemId: string, mediaId: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/portfolio/${encodeURIComponent(String(portfolioItemId))}/media/${encodeURIComponent(String(mediaId))}/featured-video`
    );
    return data;
  }

  async getBlogPostsAnalytics(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/blog/analytics`, { params });
    return data;
  }

  async listPendingBlogComments(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/comments/pending`, { params });
    return data;
  }

  async getAdminBlogPost(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async listAdminBlogPosts(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/posts`, { params });
    return peelSuccessEnvelope(data);
  }

  async createAdminBlogPost(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/posts`, body);
    return data;
  }

  async publishBlogPost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/publish`,
      body
    );
    return data;
  }

  async featureBlogPost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/feature`,
      body
    );
    return data;
  }

  async unfeatureBlogPost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/unfeature`,
      body
    );
    return data;
  }

  async unpublishBlogPost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/unpublish`,
      body
    );
    return data;
  }

  async pinBlogPost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/pin`,
      body
    );
    return data;
  }

  async listAdminBlogComments(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/comments`, { params });
    return data;
  }

  async approveBlogComment(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/comments/${encodeURIComponent(String(id))}/approve`,
      body
    );
    return data;
  }

  async deleteBlogComment(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/comments/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async deleteAdminBlogPost(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async updateAdminBlogPost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async createAdminBlogPostFull(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/posts`, body);
    return data;
  }

  async archivePost(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/archive`,
      body
    );
    return data;
  }

  async getPostRevisions(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/revisions`
    );
    return data;
  }

  async restorePostRevision(id: string, revisionId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/posts/${encodeURIComponent(String(id))}/revisions/${encodeURIComponent(String(revisionId))}/restore`,
      body
    );
    return data;
  }

  async getReportedComments(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/comments/reported`, { params });
    return data;
  }

  async rejectComment(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/comments/${encodeURIComponent(String(id))}/reject`,
      body
    );
    return data;
  }

  async markCommentSpam(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/comments/${encodeURIComponent(String(id))}/spam`,
      body
    );
    return data;
  }

  async pinComment(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/comments/${encodeURIComponent(String(id))}/pin`,
      body
    );
    return data;
  }

  async unpinComment(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/comments/${encodeURIComponent(String(id))}/unpin`,
      body
    );
    return data;
  }

  async createTag(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/blog/tags`, body);
    return data;
  }

  async mergeTags(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/blog/tags/merge`, body);
    return data;
  }

  async getAuthors(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/blog/authors`);
    return data;
  }

  async listAdminProjects(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/projects`, { params });
    return data;
  }

  async getAdminProject(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async updateAdminProject(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/projects/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async updateProjectStatus(
    projectId: string,
    body: { status: string; reason: string; notifyClient?: boolean }
  ): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/status`,
      body
    );
    return data;
  }

  async getAdminProjectStatusHistory(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/status-history`
    );
    return data;
  }

  async markProjectComplete(projectId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/progress/projects/${encodeURIComponent(String(projectId))}/complete`,
      body
    );
    return data;
  }

  async archiveProject(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(id))}/archive`,
      body
    );
    return data;
  }

  async getProjectStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/projects/stats`);
    return data;
  }

  async duplicateProject(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(id))}/duplicate`,
      body
    );
    return data;
  }

  async getProjectPortfolioLink(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/portfolio-link`
    );
    return data;
  }

  async getProjectPortfolioPreview(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/portfolio-preview`
    );
    return data;
  }

  async createPortfolioDraftFromProject(projectId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/create-portfolio-draft`,
      body
    );
    return data;
  }

  async promoteMediaToPortfolio(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/media/promote-to-portfolio`, body);
    return data;
  }

  async getProjectDuplicatePreview(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/duplicate-preview`
    );
    return data;
  }

  async createProjectFromTemplate(body: unknown): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/projects/from-template`, body);
    return data;
  }

  async unarchiveProject(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(id))}/unarchive`,
      body
    );
    return data;
  }

  async exportProject(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(id))}/export`,
      body
    );
    return data;
  }

  async downloadProjectExport(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/export/download`
    );
    return data;
  }

  async getAdminQuotePdf(quoteId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/quotes/${encodeURIComponent(String(quoteId))}/pdf`
    );
    return data;
  }

  async getAdminQuoteContract(quoteId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/quotes/${encodeURIComponent(String(quoteId))}/contract`
    );
    return data;
  }

  async getAdminPaymentReceipt(paymentId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/${encodeURIComponent(String(paymentId))}/receipt`
    );
    return data;
  }

  async getAdminPaymentInvoice(paymentId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/${encodeURIComponent(String(paymentId))}/invoice`
    );
    return data;
  }

  async listAnalyticsReports(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/reports`, { params });
    return data;
  }

  async downloadAnalyticsReport(reportId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/reports/${encodeURIComponent(String(reportId))}/download`
    );
    return data;
  }

  async exportAuditLogs(body: { format: 'CSV' | 'JSON' }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/audit/export`, body);
    return data;
  }

  async exportBlogPosts(body: { filters?: Record<string, unknown> } = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/posts/export`, body);
    return data;
  }

  // --- Progress: Milestones (admin) ---

  async listProjectDeliverables(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/deliverables`
    );
    return data;
  }

  async createProjectMilestone(projectId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/milestones`,
      body
    );
    return data;
  }

  async updateProgressMilestone(milestoneId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/milestones/${encodeURIComponent(String(milestoneId))}`,
      body
    );
    return data;
  }

  async completeMilestone(milestoneId: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/milestones/${encodeURIComponent(String(milestoneId))}/complete`,
      {}
    );
    return data;
  }

  async updateDeliverable(deliverableId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/deliverables/${encodeURIComponent(String(deliverableId))}`,
      body
    );
    return data;
  }

  async deleteDeliverable(deliverableId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/deliverables/${encodeURIComponent(String(deliverableId))}`
    );
    return data;
  }

  async uploadProjectDeliverable(projectId: string, body: unknown): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/deliverables`,
      body
    );
    return data;
  }

  async listAdminProgressEntries(projectId: string, params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/progress/projects/${encodeURIComponent(String(projectId))}`,
      { params }
    );
    return data;
  }

  async createAdminProgressEntry(projectId: string, body: unknown): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/progress/projects/${encodeURIComponent(String(projectId))}`,
      body
    );
    return data;
  }

  async getAdminProgressTimeline(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/progress/projects/${encodeURIComponent(String(projectId))}/timeline`
    );
    return data;
  }

  async listAdminRequests(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/requests`, { params });
    return data;
  }

  async getAdminRequestStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/requests/stats`);
    return data;
  }

  async getAdminRequest(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}`
    );
    return peelSuccessEnvelope(data);
  }

  async updateAdminRequestStatus(
    id: string,
    body: { status: string; notes?: string }
  ): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}/status`,
      body
    );
    return data;
  }

  async createQuoteFromRequest(
    requestId: string,
    body: AdminCreateQuoteFromRequestBody
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/requests/${encodeURIComponent(String(requestId))}/quotes`,
      body
    );
    return data;
  }

  /**
   * Suggest line items from a past quote without creating a new quote.
   * OpenAPI QuotePrefillDto requires `sourceQuoteId`.
   */
  async suggestQuotePrefill(requestId: string, body: QuotePrefillDto): Promise<unknown> {
    if (!body?.sourceQuoteId?.trim()) {
      throw new Error('sourceQuoteId is required for quote prefill');
    }
    const { data } = await this.client.post<unknown>(
      `/admin/requests/${encodeURIComponent(String(requestId))}/quotes/prefill`,
      { sourceQuoteId: body.sourceQuoteId.trim() } satisfies QuotePrefillDto
    );
    return data;
  }

  async getCapacityDashboard(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/requests/capacity/dashboard`);
    return data;
  }

  async updateCapacitySettings(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(`/admin/requests/settings/capacity`, body);
    return data;
  }

  async addAdminRequestNote(id: string, body: { content: string }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}/notes`,
      body
    );
    return data;
  }

  async listAdminRequestNotes(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}/notes`
    );
    return data;
  }

  async patchAdminRequest(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async assignAdminRequest(id: string, body: { assigneeId: string }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}/assign`,
      body
    );
    return data;
  }

  async deleteAdminRequest(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/requests/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async listAdminQuotes(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/quotes`, { params });
    return data;
  }

  async getAdminQuoteStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/quotes/stats`);
    return data;
  }

  async getAdminQuote(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}`
    );
    return peelSuccessEnvelope(data);
  }

  async createAdminQuote(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/quotes`, body);
    return data;
  }

  async sendAdminQuote(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}/send`,
      body
    );
    return data;
  }

  async patchAdminQuote(id: string, body: AdminPatchQuoteBody): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}`,
      body
    );
    return peelSuccessEnvelope(data);
  }

  async deleteAdminQuote(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  /**
   * @deprecated Templates API returns 410. Use line-item library methods instead.
   */
  async getAdminQuoteTemplates(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/quotes/templates`, { params });
    return data;
  }

  /**
   * @deprecated Templates API returns 410. Use `createLineItemBlock` instead.
   */
  async createAdminQuoteTemplate(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/quotes/templates`, body);
    return data;
  }

  async listLineItemLibrary(params?: { includeInactive?: boolean }): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/quotes/line-item-library`, {
      params: params?.includeInactive ? { includeInactive: 'true' } : undefined,
    });
    return data;
  }

  async createLineItemBlock(body: CreateLineItemBlockDto): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/quotes/line-item-library`, body);
    return data;
  }

  async updateLineItemBlock(id: string, body: UpdateLineItemBlockDto): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/quotes/line-item-library/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async deactivateLineItemBlock(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/quotes/line-item-library/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async listPaymentSchedulePresets(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/quotes/payment-schedule-presets`);
    return data;
  }

  async extendQuoteValidity(id: string, body: { extendDays?: number } = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}/extend`,
      body
    );
    return data;
  }

  async resendQuote(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}/resend`,
      body
    );
    return data;
  }

  async duplicateAdminQuote(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}/duplicate`,
      body
    );
    return data;
  }

  async getAdminQuoteHistory(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/quotes/${encodeURIComponent(String(id))}/history`
    );
    return data;
  }

  async createManualPayment(body: {
    projectId: string;
    clientId?: string;
    milestoneId: string;
    amountPaise?: number;
    amount?: number;
    notes?: string;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/payments/manual`, body);
    return data;
  }

  async getRevenueReport(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/payments/revenue/report`, { params });
    return data;
  }

  async exportRevenue(params?: AdminQueryParams): Promise<Blob> {
    const { data } = await this.client.get<Blob>(`/admin/payments/revenue/export`, {
      params,
      responseType: 'blob',
    });
    return data;
  }

  async listTimeEntries(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/time-entries`, { params });
    return data;
  }

  async createTimeEntry(body: {
    projectId: string;
    milestoneId?: string;
    hours: number;
    description?: string;
    workedAt?: string;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/time-entries`, body);
    return data;
  }

  async listBlogCategories(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/blog/categories`);
    return data;
  }

  async createBlogCategory(body: {
    name: string;
    slug?: string;
    description?: string;
    order?: number;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/blog/categories`, body);
    return data;
  }

  async listBlogTags(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/blog/tags`);
    return data;
  }

  async createBlogTag(body: { name: string }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/blog/tags`, body);
    return data;
  }

  async listBlogAuthors(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/blog/authors`);
    return data;
  }

  async clearSystemCache(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/system/cache/clear`, body);
    return data;
  }

  async clearSystemCacheKey(key: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/system/cache/clear/${encodeURIComponent(key)}`,
      body
    );
    return data;
  }

  async downloadSystemLogs(): Promise<{
    downloadUrl?: string;
    filename: string;
    contentBase64?: string;
    mimeType?: string;
  }> {
    const { data } = await this.client.get<unknown>(`/admin/system/logs/download`);
    const peeled = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const downloadUrl = extractDocumentUrl(data) ?? undefined;
    const contentBase64 =
      typeof peeled?.contentBase64 === 'string' ? peeled.contentBase64 : undefined;
    const mimeType = typeof peeled?.mimeType === 'string' ? peeled.mimeType : 'text/csv';
    const filename =
      (typeof peeled?.filename === 'string' && peeled.filename) ||
      `nestlancer-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    if (!contentBase64 && !downloadUrl) {
      throw new Error('Log export did not return downloadable content');
    }
    return { downloadUrl, filename, contentBase64, mimeType };
  }

  async sendSystemAnnouncement(body: {
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'CRITICAL';
    dismissable?: boolean;
    scheduledFor?: string;
    expiresAt?: string;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/system/announcements`, body);
    return data;
  }

  async toggleMaintenanceMode(body: {
    enabled: boolean;
    message?: string;
    estimatedEnd?: string;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/system/maintenance`, body);
    return data;
  }

  async webhooksHealth(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/webhooks/health`);
    return data;
  }

  async webhooksEvents(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/webhooks/events`);
    return data;
  }

  async listWebhooks(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/webhooks`, { params });
    return data;
  }

  async createWebhook(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/webhooks`, body);
    return data;
  }

  async getWebhook(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async patchWebhook(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}`,
      body
    );
    return data;
  }

  async deleteWebhook(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async testWebhook(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}/test`,
      body
    );
    return data;
  }

  async webhookDeliveries(id: string, params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}/deliveries`,
      { params }
    );
    return data;
  }

  async enableWebhook(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}/enable`,
      body
    );
    return data;
  }

  async disableWebhook(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/webhooks/${encodeURIComponent(String(id))}/disable`,
      body
    );
    return data;
  }

  async listContactMessages(params?: AdminQueryParams): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/contact`, { params });
    return data;
  }

  async getContactMessage(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/contact/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async deleteContactMessage(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/contact/${encodeURIComponent(String(id))}`
    );
    return data;
  }

  async updateContactStatus(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/contact/${encodeURIComponent(String(id))}/status`,
      body
    );
    return data;
  }

  async respondToContact(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/contact/${encodeURIComponent(String(id))}/respond`,
      body
    );
    return data;
  }

  async markContactSpam(id: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/contact/${encodeURIComponent(String(id))}/spam`,
      body
    );
    return data;
  }

  async updateAdminProgressEntry(entryId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/progress/${encodeURIComponent(String(entryId))}`,
      body
    );
    return data;
  }

  async deleteAdminProgressEntry(entryId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/progress/${encodeURIComponent(String(entryId))}`
    );
    return data;
  }

  async getProjectProgressAnalytics(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/progress/projects/${encodeURIComponent(String(projectId))}/analytics`
    );
    return data;
  }

  async addProjectTeamMember(projectId: string, body: { memberId: string }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/team`,
      body
    );
    return data;
  }

  async removeProjectTeamMember(projectId: string, memberId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/team/${encodeURIComponent(String(memberId))}`
    );
    return data;
  }

  async getProjectAnalytics(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/projects/${encodeURIComponent(String(projectId))}/analytics`
    );
    return data;
  }

  async reorderAdminPortfolio(body: { items: { id: string; order: number }[] }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/portfolio/reorder`, body);
    return data;
  }

  async listPortfolioCategories(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/portfolio/categories`);
    return data;
  }

  async createPortfolioCategory(body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/admin/portfolio/categories`, body);
    return data;
  }

  async updatePortfolioCategory(categoryId: string, body: unknown = {}): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/portfolio/categories/${encodeURIComponent(String(categoryId))}`,
      body
    );
    return data;
  }

  async deletePortfolioCategory(categoryId: string, reassignToId?: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/portfolio/categories/${encodeURIComponent(String(categoryId))}`,
      { params: reassignToId ? { reassignToId } : undefined }
    );
    return data;
  }

  async getPortfolioAnalytics(itemId?: string): Promise<unknown> {
    const path = itemId
      ? `/admin/portfolio/analytics/${encodeURIComponent(String(itemId))}`
      : `/admin/portfolio/analytics`;
    const { data } = await this.client.get<unknown>(path);
    return data;
  }

  async getHealthDebug(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/health/debug`);
    return data;
  }

  async health(): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/health`);
    return data;
  }
}
