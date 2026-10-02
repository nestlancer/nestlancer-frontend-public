<div align="center">

# Nestlancer frontend — target directory structure (completed monorepo)

</div>

---

```
nestlancer-frontend/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, typecheck, test, build
│   │   ├── deploy-preview.yml        # Deploy PR previews
│   │   └── deploy-production.yml     # Deploy main branch
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .husky/
│   ├── pre-commit                    # lint-staged + tsc
│   └── commit-msg                   # commitlint
│
├── .vscode/
│   ├── extensions.json               # Recommended extensions
│   └── settings.json                 # Workspace settings
│
├── swagger-docs/                     # OpenAPI specs for codegen (Orval); refresh from gateway `/docs-json` per service
│   ├── openapi.json                  # Optional merged or default bundle
│   ├── openapi-gateway.json
│   ├── openapi-admin.json
│   ├── openapi-auth.json
│   ├── openapi-blog.json
│   ├── openapi-contact.json
│   ├── openapi-health.json
│   ├── openapi-media.json
│   ├── openapi-messaging.json
│   ├── openapi-notifications.json
│   ├── openapi-payments.json
│   ├── openapi-portfolio.json
│   ├── openapi-progress.json
│   ├── openapi-projects.json
│   ├── openapi-quotes.json
│   ├── openapi-requests.json
│   ├── openapi-users.json
│   └── openapi-webhooks.json
│
├── orval.config.ts                   # Orval: generate typed Axios clients from `swagger-docs/openapi-gateway.json`
│
├── apps/
│   ├── web/                          # Main application (Nestlancer platform)
│   │   ├── public/
│   │   │   ├── fonts/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (auth)/           # Route group - unauthenticated
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── loading.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── loading.tsx
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── reset-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── verify-email/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx    # Auth layout (centered card)
│   │   │   │   │
│   │   │   │   ├── (dashboard)/      # Route group - authenticated
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── page.tsx  # RSC - fetch overview data
│   │   │   │   │   │   └── loading.tsx
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   │   └── not-found.tsx
│   │   │   │   │   │   └── new/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── requests/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── new/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── quotes/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── messages/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── loading.tsx
│   │   │   │   │   │   └── [conversationId]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── notifications/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── invoice/
│   │   │   │   │   │       └── [id]/
│   │   │   │   │   │           └── page.tsx
│   │   │   │   │   ├── portfolio/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── edit/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── account/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── security/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── notifications/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── layout.tsx    # Dashboard layout (sidebar + navbar)
│   │   │   │   │
│   │   │   │   ├── (public)/         # Route group - public pages
│   │   │   │   │   ├── blog/
│   │   │   │   │   │   ├── page.tsx  # ISR blog listing
│   │   │   │   │   │   └── [slug]/
│   │   │   │   │   │       └── page.tsx # ISR blog post
│   │   │   │   │   ├── freelancers/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [username]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── api/              # Next.js API Routes (BFF)
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── callback/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── refresh/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── upload/
│   │   │   │   │   │   └── route.ts  # Presigned URL generation
│   │   │   │   │   └── webhooks/
│   │   │   │   │       └── razorpay/
│   │   │   │   │           └── route.ts
│   │   │   │   │
│   │   │   │   ├── layout.tsx        # Root layout (providers)
│   │   │   │   ├── page.tsx          # Home / redirect
│   │   │   │   ├── not-found.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── globals.css
│   │   │   │
│   │   │   ├── features/             # Domain feature modules
│   │   │   │   ├── auth/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   │   ├── TwoFactorPrompt.tsx
│   │   │   │   │   │   ├── PasswordResetForm.tsx
│   │   │   │   │   │   └── SocialLogin.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   │   ├── useLogin.ts
│   │   │   │   │   │   ├── useRegister.ts
│   │   │   │   │   │   └── use2FA.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── authApi.ts
│   │   │   │   │   │   └── types.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── authStore.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── utils/
│   │   │   │   │   │   └── tokenStorage.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── projects/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ProjectCard.tsx
│   │   │   │   │   │   ├── ProjectList.tsx
│   │   │   │   │   │   ├── ProjectForm.tsx
│   │   │   │   │   │   ├── ProjectDetail.tsx
│   │   │   │   │   │   ├── ProjectStatus.tsx
│   │   │   │   │   │   └── MilestoneList.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useProjects.ts
│   │   │   │   │   │   ├── useProject.ts
│   │   │   │   │   │   ├── useCreateProject.ts
│   │   │   │   │   │   └── useUpdateProject.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── projectsApi.ts
│   │   │   │   │   │   └── types.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── projectStore.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── requests/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── RequestCard.tsx
│   │   │   │   │   │   ├── RequestList.tsx
│   │   │   │   │   │   ├── RequestForm.tsx
│   │   │   │   │   │   └── RequestDetail.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useRequests.ts
│   │   │   │   │   │   └── useCreateRequest.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── requestsApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── quotes/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── QuoteCard.tsx
│   │   │   │   │   │   ├── QuoteForm.tsx
│   │   │   │   │   │   └── QuoteComparison.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useQuotes.ts
│   │   │   │   │   │   └── useSubmitQuote.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── quotesApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ConversationList.tsx
│   │   │   │   │   │   ├── MessageThread.tsx
│   │   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   │   ├── MessageInput.tsx
│   │   │   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   │   │   └── ReadReceipts.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useMessages.ts
│   │   │   │   │   │   ├── useSendMessage.ts
│   │   │   │   │   │   ├── useTypingIndicator.ts
│   │   │   │   │   │   └── useMessageSocket.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── messagingApi.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── messagingStore.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── NotificationBell.tsx
│   │   │   │   │   │   ├── NotificationList.tsx
│   │   │   │   │   │   └── NotificationItem.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useNotifications.ts
│   │   │   │   │   │   └── useNotificationSocket.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── notificationsApi.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── notificationStore.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── payments/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── PaymentButton.tsx
│   │   │   │   │   │   ├── PaymentHistory.tsx
│   │   │   │   │   │   ├── InvoiceCard.tsx
│   │   │   │   │   │   └── RazorpayCheckout.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── usePayments.ts
│   │   │   │   │   │   └── useRazorpay.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── paymentsApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── media/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── FileUpload.tsx
│   │   │   │   │   │   ├── ImagePreview.tsx
│   │   │   │   │   │   ├── UploadProgress.tsx
│   │   │   │   │   │   └── MediaGallery.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useFileUpload.ts
│   │   │   │   │   │   └── useMediaLibrary.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── mediaApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── portfolio/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── PortfolioGrid.tsx
│   │   │   │   │   │   ├── PortfolioCard.tsx
│   │   │   │   │   │   └── PortfolioForm.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── usePortfolio.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── portfolioApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── profile/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ProfileHeader.tsx
│   │   │   │   │   │   ├── ProfileForm.tsx
│   │   │   │   │   │   └── SkillsEditor.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useProfile.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── usersApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── admin/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── UserManagement.tsx
│   │   │   │   │   │   ├── AdminStats.tsx
│   │   │   │   │   │   └── SystemHealth.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useAdmin.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── adminApi.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── blog/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── api/
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── contact/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── api/
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   └── progress/
│   │   │   │       ├── components/
│   │   │   │       ├── hooks/
│   │   │   │       ├── api/
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   │
│   │   │   ├── components/           # App-level shared components
│   │   │   │   ├── layout/
│   │   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   │   ├── Navbar.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   ├── providers/
│   │   │   │   │   ├── AppProviders.tsx  # Compose all providers
│   │   │   │   │   ├── QueryProvider.tsx
│   │   │   │   │   └── ThemeProvider.tsx
│   │   │   │   └── common/
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       ├── PageHeader.tsx
│   │   │   │       └── EmptyState.tsx
│   │   │   │
│   │   │   ├── lib/                  # App-level utilities
│   │   │   │   ├── queryClient.ts    # TanStack Query client config
│   │   │   │   ├── queryKeys.ts      # Typed query key factory
│   │   │   │   ├── axios.ts          # Axios instance (wraps api-client)
│   │   │   │   └── sentry.ts         # Sentry config
│   │   │   │
│   │   │   ├── hooks/                # App-level shared hooks
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── useMediaQuery.ts
│   │   │   │
│   │   │   ├── middleware.ts          # Next.js edge middleware (auth guard)
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   └── types/
│   │   │       └── global.d.ts
│   │   │
│   │   ├── tests/
│   │   │   ├── e2e/                  # Playwright E2E tests
│   │   │   │   ├── auth.spec.ts
│   │   │   │   ├── projects.spec.ts
│   │   │   │   └── payments.spec.ts
│   │   │   ├── mocks/                # MSW handlers
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── auth.handlers.ts
│   │   │   │   │   └── projects.handlers.ts
│   │   │   │   ├── browser.ts
│   │   │   │   └── server.ts
│   │   │   └── setup.ts
│   │   │
│   │   ├── .env.example
│   │   ├── .env.local                # (gitignored)
│   │   ├── next.config.js
│   │   ├── next-env.d.ts
│   │   ├── package.json
│   │   ├── playwright.config.ts
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── admin/                        # Admin dashboard application
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── users/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── system/
│   │   │   │   │   │   └── page.tsx  # Health + workers status
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── features/
│   │   │   └── components/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   │
│   └── landing/                      # Marketing / public site
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx          # SSG landing page
│       │   │   ├── about/
│       │   │   │   └── page.tsx
│       │   │   ├── pricing/
│       │   │   │   └── page.tsx
│       │   │   ├── contact/
│       │   │   │   └── page.tsx
│       │   │   ├── blog/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   └── components/
│       │       ├── Hero.tsx
│       │       ├── Features.tsx
│       │       ├── Pricing.tsx
│       │       └── Testimonials.tsx
│       ├── package.json
│       ├── next.config.js
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                           # Shared component library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── primitives/
│   │   │   │   │   ├── button/
│   │   │   │   │   │   ├── Button.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── input/
│   │   │   │   │   │   ├── Input.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── select/
│   │   │   │   │   │   ├── Select.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── textarea/
│   │   │   │   │   │   └── Textarea.tsx
│   │   │   │   │   ├── checkbox/
│   │   │   │   │   │   └── Checkbox.tsx
│   │   │   │   │   ├── radio/
│   │   │   │   │   │   └── Radio.tsx
│   │   │   │   │   ├── switch/
│   │   │   │   │   │   └── Switch.tsx
│   │   │   │   │   ├── avatar/
│   │   │   │   │   │   └── Avatar.tsx
│   │   │   │   │   └── badge/
│   │   │   │   │       └── Badge.tsx
│   │   │   │   ├── forms/
│   │   │   │   │   ├── form-field/
│   │   │   │   │   │   └── FormField.tsx
│   │   │   │   │   ├── form-group/
│   │   │   │   │   │   └── FormGroup.tsx
│   │   │   │   │   └── file-upload/
│   │   │   │   │       └── FileUpload.tsx
│   │   │   │   ├── feedback/
│   │   │   │   │   ├── alert/
│   │   │   │   │   │   └── Alert.tsx
│   │   │   │   │   ├── toast/
│   │   │   │   │   │   └── Toast.tsx
│   │   │   │   │   ├── modal/
│   │   │   │   │   │   └── Modal.tsx
│   │   │   │   │   ├── spinner/
│   │   │   │   │   │   └── Spinner.tsx
│   │   │   │   │   └── skeleton/
│   │   │   │   │       └── Skeleton.tsx
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── navbar/
│   │   │   │   │   │   └── Navbar.tsx
│   │   │   │   │   ├── sidebar/
│   │   │   │   │   │   └── Sidebar.tsx
│   │   │   │   │   ├── breadcrumb/
│   │   │   │   │   │   └── Breadcrumb.tsx
│   │   │   │   │   └── tabs/
│   │   │   │   │       └── Tabs.tsx
│   │   │   │   ├── data-display/
│   │   │   │   │   ├── table/
│   │   │   │   │   │   └── DataTable.tsx
│   │   │   │   │   ├── card/
│   │   │   │   │   │   └── Card.tsx
│   │   │   │   │   └── empty-state/
│   │   │   │   │       └── EmptyState.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── container/
│   │   │   │       │   └── Container.tsx
│   │   │   │       └── stack/
│   │   │   │           └── Stack.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDisclosure.ts
│   │   │   │   └── useClickOutside.ts
│   │   │   ├── utils/
│   │   │   │   └── cn.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/                   # HTTP client package
│   │   ├── src/
│   │   │   ├── client.ts             # Axios instance factory
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── retry.interceptor.ts
│   │   │   ├── services/
│   │   │   │   ├── base.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── projects.service.ts
│   │   │   │   ├── requests.service.ts
│   │   │   │   ├── quotes.service.ts
│   │   │   │   ├── messaging.service.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── payments.service.ts
│   │   │   │   ├── media.service.ts
│   │   │   │   ├── portfolio.service.ts
│   │   │   │   ├── blog.service.ts
│   │   │   │   ├── contact.service.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   └── progress.service.ts
│   │   │   ├── generated/            # Orval output — regenerate; do not hand-edit
│   │   │   │   └── ...               # Axios factories (all tags); react-query/ (blog pilot hooks)
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── websocket/                    # Socket.io client package
│   │   ├── src/
│   │   │   ├── WebSocketProvider.tsx
│   │   │   ├── client.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   ├── usePresence.ts
│   │   │   │   └── useSocketRoom.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                         # Auth logic package
│   │   ├── src/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── middleware.ts         # Edge-compatible token verification
│   │   │   ├── tokenManager.ts
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── common.ts         # ApiResponse, PaginatedResponse
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── requests.ts
│   │   │   │   ├── quotes.ts
│   │   │   │   ├── messaging.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── payments.ts
│   │   │   │   └── media.ts
│   │   │   ├── events/
│   │   │   │   └── socket-events.ts  # WebSocket event types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utils/                        # Shared utilities
│   │   ├── src/
│   │   │   ├── format.ts             # Currency, date, file size formatters
│   │   │   ├── string.ts             # Slugify, truncate, capitalize
│   │   │   ├── number.ts             # Clamp, round, percentage
│   │   │   ├── array.ts              # Group, unique, sortBy
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                       # Shared configuration
│   │   ├── src/
│   │   │   ├── env.ts                # Typed env validation (Zod)
│   │   │   ├── features.ts           # Feature flags
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── constants/                    # App-wide constants
│   │   ├── src/
│   │   │   ├── routes.ts             # Typed route constants
│   │   │   ├── query-keys.ts         # TanStack Query key constants
│   │   │   ├── events.ts             # Socket event name constants
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── validators/                   # Zod validation schemas
│   │   ├── src/
│   │   │   ├── auth.schema.ts
│   │   │   ├── project.schema.ts
│   │   │   ├── request.schema.ts
│   │   │   ├── payment.schema.ts
│   │   │   ├── profile.schema.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── hooks/                        # Shared React hooks
│       ├── src/
│       │   ├── useDebounce.ts
│       │   ├── useThrottle.ts
│       │   ├── useIntersectionObserver.ts
│       │   ├── useLocalStorage.ts
│       │   ├── useMediaQuery.ts
│       │   ├── usePrevious.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── diagrams/
│   │       ├── wireframes/           # UX wireframes (public / user / admin); see appendix below
│   │       │   ├── README.md
│   │       │   ├── public/
│   │       │   ├── user/
│   │       │   └── admin/
│   │       └── wireframe-pages.llm/
│   │           └── pages.md
│   ├── components/
│   │   └── STORYBOOK.md
│   └── guides/
│       ├── CONTRIBUTING.md
│       ├── SETUP.md
│       ├── DEPLOYMENT.md
│       └── web-page-assumption-list.md
│
├── scripts/
│   ├── generate-frontend.sh          # Full project generator
│   ├── create-feature.sh             # Scaffold new feature
│   ├── create-component.sh           # Scaffold new component
│   └── openapi/
│       ├── pull-specs.sh             # Fetch latest OpenAPI into `swagger-docs/`
│       └── README.md
│
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── .prettierignore
├── commitlint.config.js
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── turbo.json
├── dir-structure.md                # This target layout (completed monorepo)
└── README.md
```

---

## Appendix A — Wireframe markdown files (complete)

Paths are relative to the repository root.

- `docs/architecture/diagrams/wireframes/README.md`
- `docs/architecture/diagrams/wireframes/admin/admin-dashboard/dashboard-overview.md`
- `docs/architecture/diagrams/wireframes/admin/admin-dashboard/revenue-analytics-sub-page.md`
- `docs/architecture/diagrams/wireframes/admin/admin-dashboard/user-metrics-sub-page.md`
- `docs/architecture/diagrams/wireframes/admin/audit-logs.md`
- `docs/architecture/diagrams/wireframes/admin/blog-management/blog-analytics.md`
- `docs/architecture/diagrams/wireframes/admin/blog-management/categories-tags-authors-admin.md`
- `docs/architecture/diagrams/wireframes/admin/blog-management/comments-moderation.md`
- `docs/architecture/diagrams/wireframes/admin/blog-management/post-editor.md`
- `docs/architecture/diagrams/wireframes/admin/blog-management/posts-list.md`
- `docs/architecture/diagrams/wireframes/admin/contact-inquiries.md`
- `docs/architecture/diagrams/wireframes/admin/impersonation.md`
- `docs/architecture/diagrams/wireframes/admin/media-admin.md`
- `docs/architecture/diagrams/wireframes/admin/messages-admin.md`
- `docs/architecture/diagrams/wireframes/admin/notifications-admin/templates.md`
- `docs/architecture/diagrams/wireframes/admin/notifications-admin.md`
- `docs/architecture/diagrams/wireframes/admin/payments-admin.md`
- `docs/architecture/diagrams/wireframes/admin/portfolio-admin.md`
- `docs/architecture/diagrams/wireframes/admin/progress-and-milestones-admin.md`
- `docs/architecture/diagrams/wireframes/admin/projects-admin.md`
- `docs/architecture/diagrams/wireframes/admin/quotes-admin.md`
- `docs/architecture/diagrams/wireframes/admin/requests-admin.md`
- `docs/architecture/diagrams/wireframes/admin/system-configuration/email-templates.md`
- `docs/architecture/diagrams/wireframes/admin/system-configuration.md`
- `docs/architecture/diagrams/wireframes/admin/system-health-and-debug.md`
- `docs/architecture/diagrams/wireframes/admin/user-management/bulk-operations-modal.md`
- `docs/architecture/diagrams/wireframes/admin/user-management/user-detail.md`
- `docs/architecture/diagrams/wireframes/admin/user-management/users-list.md`
- `docs/architecture/diagrams/wireframes/admin/webhooks-management.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/2fa-verification.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/check-email-availability.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/email-verification.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/forgot-password.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/login.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/register.md`
- `docs/architecture/diagrams/wireframes/public/authentication-pages/reset-password.md`
- `docs/architecture/diagrams/wireframes/public/blog/categories-tags-authors.md`
- `docs/architecture/diagrams/wireframes/public/blog/post-detail.md`
- `docs/architecture/diagrams/wireframes/public/blog/post-listing.md`
- `docs/architecture/diagrams/wireframes/public/contact.md`
- `docs/architecture/diagrams/wireframes/public/homepage.md`
- `docs/architecture/diagrams/wireframes/public/legal-static-pages.md`
- `docs/architecture/diagrams/wireframes/public/portfolio/portfolio-detail.md`
- `docs/architecture/diagrams/wireframes/public/portfolio/portfolio-listing.md`
- `docs/architecture/diagrams/wireframes/user/account-settings/activity-log-tab.md`
- `docs/architecture/diagrams/wireframes/user/account-settings/preferences-tab.md`
- `docs/architecture/diagrams/wireframes/user/account-settings/profile-tab.md`
- `docs/architecture/diagrams/wireframes/user/account-settings/security-tab.md`
- `docs/architecture/diagrams/wireframes/user/blog/my-bookmarks.md`
- `docs/architecture/diagrams/wireframes/user/media-library.md`
- `docs/architecture/diagrams/wireframes/user/messaging/conversation-list.md`
- `docs/architecture/diagrams/wireframes/user/messaging/conversation-view.md`
- `docs/architecture/diagrams/wireframes/user/notifications/notification-list.md`
- `docs/architecture/diagrams/wireframes/user/payments/initiate-confirm-payment.md`
- `docs/architecture/diagrams/wireframes/user/payments/payment-detail.md`
- `docs/architecture/diagrams/wireframes/user/payments/payment-history.md`
- `docs/architecture/diagrams/wireframes/user/payments/payment-methods.md`
- `docs/architecture/diagrams/wireframes/user/project-requests/create-new-request.md`
- `docs/architecture/diagrams/wireframes/user/project-requests/my-requests-list.md`
- `docs/architecture/diagrams/wireframes/user/project-requests/request-detail.md`
- `docs/architecture/diagrams/wireframes/user/projects/my-projects-list.md`
- `docs/architecture/diagrams/wireframes/user/projects/project-detail/deliverables-tab.md`
- `docs/architecture/diagrams/wireframes/user/projects/project-detail/feedback-tab.md`
- `docs/architecture/diagrams/wireframes/user/projects/project-detail/messages-tab.md`
- `docs/architecture/diagrams/wireframes/user/projects/project-detail/milestones-tab.md`
- `docs/architecture/diagrams/wireframes/user/projects/project-detail/payments-tab.md`
- `docs/architecture/diagrams/wireframes/user/projects/project-detail/progress-tab.md`
- `docs/architecture/diagrams/wireframes/user/quotes/my-quotes-list.md`
- `docs/architecture/diagrams/wireframes/user/quotes/quote-detail.md`
- `docs/architecture/diagrams/wireframes/user/user-dashboard-home.md`

---

## Appendix B — Conventions

- Each feature under `apps/*/src/features/<domain>/` uses: `components/`, `hooks/`, `api/`, optional `store/`, `types/`, `utils/`, and `index.ts`.
- Hand-written REST helpers stay in `packages/api-client/src/services/`; generated hook wrappers stay in `packages/api-client/src/generated/`.
- Next.js BFF routes under `apps/web/src/app/api/` handle cookie session refresh and other server-only concerns.
