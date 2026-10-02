/** Admin user management API shapes (sanitized; no secrets). */

export type AdminUserRole = 'USER' | 'ADMIN';

export type AdminUserStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DELETED'
  | 'PENDING_DELETION';

export type AdminUserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminUserRole | string;
  status: AdminUserStatus | string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  avatar: string | null;
  phone: string | null;
  marketingConsent: boolean;
  lastLoginAt: string | null;
  deletedAt: string | null;
  updatedAt: string;
  mustChangePassword: boolean;
  preferences?: Record<string, unknown> | null;
};

export type AdminSessionItem = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  deviceInfo: unknown;
  expiresAt: string;
  lastActiveAt: string;
  createdAt: string;
};

export type AdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminPaginatedUsers = {
  data: AdminUserListItem[];
  pagination: AdminPagination;
};

export type AdminSessionsResponse = {
  data: AdminSessionItem[];
};

export type AdminPasswordResetResult = {
  passwordReset: boolean;
  message: string;
};

export type AdminForcePasswordResetResult = {
  userId: string;
  passwordResetRequired: boolean;
};

export type AdminBulkOperationResult = {
  success: number;
  failed: number;
  errors: { userId: string; error: string }[];
};

export type AdminChangeRoleBody = { role: AdminUserRole };

export type AdminChangeStatusBody = { status: AdminUserStatus };

export type AdminUpdateUserBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: AdminUserStatus;
};

export type AdminResetPasswordBody = { newPassword: string };
