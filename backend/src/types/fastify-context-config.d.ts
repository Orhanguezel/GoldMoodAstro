import "fastify";

declare module "fastify" {
  type RateLimitConfig = {
    max?: number;
    timeWindow?: string | number;
    [key: string]: unknown;
  };

  interface FastifyContextConfig {
    auth?: boolean;
    admin?: boolean;
    public?: boolean;
    rateLimit?: RateLimitConfig | boolean;
  }
}

