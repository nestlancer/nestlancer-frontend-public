# Build production frontend images with durable BuildKit cache + resumable checkpoints.
#
# Usage:
#   docker buildx bake -f docker/prod-monorepo.bake.hcl --load all-runtime
#   docker buildx bake -f docker/prod-monorepo.bake.hcl --load frontend-web
#   Prefer ./scripts/docker/build-all-prod-images.sh (phased by default)

variable "REGISTRY" {
  default = "ghcr.io/nestlancer"
}

variable "TAG" {
  default = "latest"
}

variable "CACHE_DIR" {
  default = ".cache/docker-buildkit"
}

variable "CONTEXT" {
  default = "."
}

variable "DOCKERFILE" {
  default = "docker/prod-monorepo.Dockerfile"
}

variable "WEB_NEXT_PUBLIC_API_URL" {
  default = "https://app.nestlancer.com"
}

variable "WEB_NEXT_PUBLIC_APP_URL" {
  default = "https://app.nestlancer.com"
}

variable "ADMIN_NEXT_PUBLIC_API_URL" {
  default = "https://admin.nestlancer.com"
}

variable "ADMIN_NEXT_PUBLIC_APP_URL" {
  default = "https://app.nestlancer.com"
}

variable "ADMIN_NEXT_PUBLIC_ADMIN_APP_URL" {
  default = "https://admin.nestlancer.com"
}

variable "LANDING_NEXT_PUBLIC_API_URL" {
  default = "https://landing.nestlancer.com"
}

variable "LANDING_NEXT_PUBLIC_APP_URL" {
  default = "https://app.nestlancer.com"
}

variable "LANDING_NEXT_PUBLIC_LANDING_URL" {
  default = "https://nestlancer.com"
}

variable "NEXT_PUBLIC_WS_URL" {
  default = "https://api.nestlancer.com"
}

variable "NEXT_PUBLIC_SOCKET_IO_PATH" {
  default = "/ws/socket.io"
}

variable "NEXT_PUBLIC_API_PROXY" {
  default = "true"
}

variable "NEXT_PUBLIC_AUTH_REFRESH_BFF" {
  default = "true"
}

variable "NEXT_PUBLIC_RAZORPAY_KEY_ID" {
  default = ""
}

variable "NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY" {
  default = ""
}

variable "NEXT_PUBLIC_TURNSTILE_SITE_KEY" {
  default = ""
}

variable "NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN" {
  default = ""
}

variable "API_UPSTREAM" {
  default = "https://api.nestlancer.com"
}

target "_base" {
  context    = CONTEXT
  dockerfile = DOCKERFILE
  # Import only by default; scripts add cache-to on checkpoints / single builds.
  cache-from = ["type=local,src=${CACHE_DIR}"]
  args = {
    WEB_NEXT_PUBLIC_API_URL          = WEB_NEXT_PUBLIC_API_URL
    WEB_NEXT_PUBLIC_APP_URL          = WEB_NEXT_PUBLIC_APP_URL
    ADMIN_NEXT_PUBLIC_API_URL        = ADMIN_NEXT_PUBLIC_API_URL
    ADMIN_NEXT_PUBLIC_APP_URL        = ADMIN_NEXT_PUBLIC_APP_URL
    ADMIN_NEXT_PUBLIC_ADMIN_APP_URL  = ADMIN_NEXT_PUBLIC_ADMIN_APP_URL
    LANDING_NEXT_PUBLIC_API_URL      = LANDING_NEXT_PUBLIC_API_URL
    LANDING_NEXT_PUBLIC_APP_URL      = LANDING_NEXT_PUBLIC_APP_URL
    LANDING_NEXT_PUBLIC_LANDING_URL  = LANDING_NEXT_PUBLIC_LANDING_URL
    NEXT_PUBLIC_WS_URL               = NEXT_PUBLIC_WS_URL
    NEXT_PUBLIC_SOCKET_IO_PATH       = NEXT_PUBLIC_SOCKET_IO_PATH
    NEXT_PUBLIC_API_PROXY            = NEXT_PUBLIC_API_PROXY
    NEXT_PUBLIC_AUTH_REFRESH_BFF     = NEXT_PUBLIC_AUTH_REFRESH_BFF
    NEXT_PUBLIC_RAZORPAY_KEY_ID      = NEXT_PUBLIC_RAZORPAY_KEY_ID
    NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY  = NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
    NEXT_PUBLIC_TURNSTILE_SITE_KEY      = NEXT_PUBLIC_TURNSTILE_SITE_KEY
    NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN  = NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN
    API_UPSTREAM                        = API_UPSTREAM
  }
}

function "image_tags" {
  params = [name]
  result = ["${REGISTRY}/${name}:${TAG}"]
}

# ── Checkpoints ──
target "frontend-deps" {
  inherits = ["_base"]
  target   = "deps"
  output   = ["type=cacheonly"]
}

target "frontend-builder" {
  inherits = ["_base"]
  target   = "monorepo-builder"
  output   = ["type=cacheonly"]
}

# ── Runtime apps ──
target "frontend-web" {
  inherits = ["_base"]
  target   = "frontend-web"
  tags     = image_tags("frontend-web")
}

target "frontend-admin" {
  inherits = ["_base"]
  target   = "frontend-admin"
  tags     = image_tags("frontend-admin")
}

target "frontend-landing" {
  inherits = ["_base"]
  target   = "frontend-landing"
  tags     = image_tags("frontend-landing")
}

group "checkpoints" {
  targets = ["frontend-deps", "frontend-builder"]
}

group "all-runtime" {
  targets = ["frontend-web", "frontend-admin", "frontend-landing"]
}
