import type { AxiosInstance } from 'axios';

import type { CreateApiClientOptions } from './client';
import { getConfiguredHttpClient } from './http-singleton';
import { AdminService } from './services/admin.service';
import { AuthService } from './services/auth.service';
import { DocumentsService } from './services/documents.service';
import { InvoicesService } from './services/invoices.service';
import { BlogService } from './services/blog.service';
import { ContactService } from './services/contact.service';
import { MediaService } from './services/media.service';
import { MediaAdminService } from './services/media-admin.service';
import { MessagingService } from './services/messaging.service';
import { NotificationsService } from './services/notifications.service';
import { PaymentsService } from './services/payments.service';
import { PortfolioService } from './services/portfolio.service';
import { ProgressService } from './services/progress.service';
import { ProjectsService } from './services/projects.service';
import { PushService } from './services/push.service';
import { QuotesService } from './services/quotes.service';
import { RequestsService } from './services/requests.service';
import { UsersService } from './services/users.service';

export type { AdminQueryParams } from './services/admin.service';
export type {
  AdminCreateQuoteFromRequestBody,
  AdminPatchQuoteBody,
} from './services/admin.service';
export type { BlogEngagementResult, BlogLikeResult, BlogViewResult } from './services/blog.service';
export type {
  Auth2FAChallenge,
  AuthLoginResult,
  AuthLoginTokens,
  AuthUserSummary,
  ForgotPasswordPayload,
  LoginPayload,
  LogoutAllResult,
  RegisterPayload,
  RegisterResult,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from './services/auth.service';
export { isLoginTokens } from './services/auth.service';
export { createApiClient, type CreateApiClientOptions } from './client';
export type { UserDashboardSummary } from './services/users.service';
export { unwrapGatewayBody } from './utils/unwrap-gateway-body';
export { peelSuccessEnvelope, asArray, asPaginated } from './utils/peel-success-envelope';
export {
  normalizeNotificationItem,
  normalizeNotificationList,
} from './utils/normalize-notification';
export {
  adjustUnreadCountCache,
  applyAllNotificationsMarkedRead,
  applyNotificationMarkedRead,
  applyNotificationRealtimeEvent,
  applyUnreadCountRealtimeEvent,
  invalidateNotificationQueries,
  prependNotificationToListCaches,
  resolveNotificationUnreadCount,
  setUnreadCountCache,
} from './utils/notification-query-cache';
export { resolveMessageUnreadCount } from './utils/messaging-query-cache';
export { parseFileMessageContent, type FileMessagePayload } from './utils/parse-file-message';
export { previewMessageContent } from './utils/preview-message-content';
export { parsePaymentIntentResult, type ParsedPaymentIntent } from './utils/parse-payment-intent';
export { inferMediaFileType, type MediaFileType } from './utils/infer-media-file-type';
export { uploadMediaFile, type UploadMediaFileResult } from './utils/upload-media-file';
export { formatStorageUploadError } from './utils/storage-upload-error';
export {
  uploadMediaFileChunked,
  CHUNKED_UPLOAD_THRESHOLD_BYTES,
} from './utils/upload-media-chunked';
export {
  ACCEPTED_MEDIA_FILE_ACCEPT,
  ACCEPTED_MEDIA_MIME_TYPES,
} from './constants/accepted-media-types';
export {
  ACCEPTED_REQUEST_ATTACHMENT_ACCEPT,
  ACCEPTED_REQUEST_ATTACHMENT_MIME_TYPES,
} from './constants/accepted-request-attachments';
export { resolvePublicShare, PublicShareError } from './utils/resolve-public-share';
export {
  extractDocumentApiFailure,
  extractDocumentUrl,
  extractDocumentVersions,
  extractDocumentVerify,
  type DocumentVersionRow,
  type DocumentVerifyResult,
} from './utils/extract-document-url';
export type { QuotePdfDownload } from './services/quotes.service';
export type { InvoiceSummary } from './services/invoices.service';
export type {
  AdminMediaBrowseFolder,
  AdminMediaBrowseResponse,
  AdminMediaListParams,
  AdminMediaMetadataPatch,
} from './services/media-admin.service';
export * from './errors';
export {
  fetchMaintenanceStatus,
  getMaintenanceStatus,
  isMaintenanceError,
  notifyMaintenanceFromError,
  setMaintenanceStatus,
  subscribeMaintenance,
  type MaintenanceInfo,
} from './maintenance';
export * from './generated';
export * from './generated/react-query';
export { listBlogPosts, searchBlogPosts, type ListBlogPostsParams } from './blog/blog-api';
export type { GatewayUnwrapped } from './gateway-unwrapped';
export * from './types';

export interface NestlancerApi {
  client: AxiosInstance;
  auth: AuthService;
  users: UsersService;
  projects: ProjectsService;
  requests: RequestsService;
  quotes: QuotesService;
  messaging: MessagingService;
  notifications: NotificationsService;
  payments: PaymentsService;
  media: MediaService;
  mediaAdmin: MediaAdminService;
  portfolio: PortfolioService;
  blog: BlogService;
  contact: ContactService;
  admin: AdminService;
  progress: ProgressService;
  push: PushService;
  documents: DocumentsService;
  invoices: InvoicesService;
}

export function createNestlancerApi(options: CreateApiClientOptions = {}): NestlancerApi {
  const client = getConfiguredHttpClient(options);

  return {
    client,
    auth: new AuthService(client),
    users: new UsersService(client),
    projects: new ProjectsService(client),
    requests: new RequestsService(client),
    quotes: new QuotesService(client),
    messaging: new MessagingService(client),
    notifications: new NotificationsService(client),
    payments: new PaymentsService(client),
    media: new MediaService(client),
    mediaAdmin: new MediaAdminService(client),
    portfolio: new PortfolioService(client),
    blog: new BlogService(client),
    contact: new ContactService(client),
    admin: new AdminService(client),
    progress: new ProgressService(client),
    push: new PushService(client),
    documents: new DocumentsService(client),
    invoices: new InvoicesService(client),
  };
}
