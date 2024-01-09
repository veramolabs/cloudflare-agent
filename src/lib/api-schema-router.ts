import { Hono } from 'hono'
import { getOpenApiSchema } from '@veramo/remote-client'
import { ContextWithAgent } from './request-agent-router.js'

/**
 * @public
 */
export interface ApiSchemaRouterOptions {
  /**
   * List of exposed methods
   */
  exposedMethods?: Array<string>

  /**
   * Base path
   */
  basePath: string

  /**
   * Security scheme
   * @example
   * ```
   * 'bearer'
   * ```
   */
  securityScheme?: string

  /**
   * Name used in OpenAPI schema
   */
  apiName?: string

  /**
   * Version used in OpenAPI schema
   */
  apiVersion?: string
}

/**
 * Creates a router that exposes {@link @veramo/core#Agent} OpenAPI schema
 *
 * @param options - Initialization option
 * @returns Expressjs router
 *
 * @public
 */
export const ApiSchemaRouter = (options: ApiSchemaRouterOptions): Hono => {
  const router = new Hono()

  router.get('/', (c: ContextWithAgent) => {
    if (c.agent) {
      const openApiSchema = getOpenApiSchema(
        c.agent,
        '',
        options.exposedMethods || c.agent?.availableMethods(),
        options.apiName,
        options.apiVersion,
      )
      const url = 'https://' + c.req.header('host') + options.basePath
      openApiSchema.servers = [{ url }]

      if (options.securityScheme && openApiSchema.components) {
        openApiSchema.components.securitySchemes = {
          auth: { type: 'http', scheme: options.securityScheme },
        }
        openApiSchema.security = [{ auth: [] }]
      }

      return c.json(openApiSchema)
    } else {
      c.status(500)
      return c.json({ error: 'Agent not available' })
    }
  })

  return router
}
