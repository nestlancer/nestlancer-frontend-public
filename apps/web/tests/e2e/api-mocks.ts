export const userProfile = {
  status: 'success',
  data: {
    id: 'user-1',
    email: 'web-e2e@example.com',
    firstName: 'Web',
    lastName: 'User',
    phone: '+919876543210',
    role: 'USER',
  },
};

export const statsPayload = {
  status: 'success',
  data: {
    total: 2,
    underReview: 1,
    quoted: 1,
  },
};

export function paginatedRequests(
  items: Array<Record<string, unknown>>,
  total: number,
  page = 1,
  limit = 12
) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    status: 'success',
    data: {
      data: items,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
      },
    },
  };
}

export function makeRequestItem(id: string, title: string, status = 'quoted') {
  return {
    id,
    title,
    status,
    category: 'Web',
    createdAt: new Date().toISOString(),
  };
}

/** Fulfill common authenticated web API routes; return true if handled. */
export async function fulfillCommonWebRoutes(
  route: import('@playwright/test').Route,
  handlers: {
    onRequests?: (url: URL) => Promise<void> | void;
    onProjects?: () => Promise<void> | void;
  } = {}
): Promise<boolean> {
  const url = new URL(route.request().url());

  if (url.pathname.includes('/system/status')) {
    await route.fulfill({
      status: 200,
      json: {
        status: 'success',
        data: { maintenance: { enabled: false, message: null, estimatedEnd: null } },
      },
    });
    return true;
  }
  if (url.pathname.includes('/users/profile')) {
    await route.fulfill({ status: 200, json: userProfile });
    return true;
  }
  if (url.pathname.includes('/notifications/unread')) {
    await route.fulfill({ status: 200, json: { status: 'success', data: { count: 0 } } });
    return true;
  }
  if (url.pathname.endsWith('/requests/stats')) {
    await route.fulfill({ status: 200, json: statsPayload });
    return true;
  }
  if (url.pathname.endsWith('/requests') && handlers.onRequests) {
    await handlers.onRequests(url);
    return true;
  }
  if (url.pathname.includes('/projects') && handlers.onProjects) {
    await handlers.onProjects();
    return true;
  }
  return false;
}
