import { IAgent } from '@veramo/core-types'
import { Context, MiddlewareHandler } from 'hono'

export interface ContextWithAgent extends Context {
  agent?: IAgent
}

/**
 * @public
 */
export interface RequestWithAgentRouterOptions {
  /**
   * Optional. Pre-configured agent
   */
  agent?: IAgent

  /**
   * Optional. Function that returns a Promise that resolves to a configured agent for specific request
   */
  getAgentForRequest?: (c: Context) => Promise<IAgent>
}

/**
 * Creates an expressjs router that adds a Veramo agent to the request object.
 *
 * This is needed by all other routers provided by this package to be able to perform their functions.
 *
 * @param options - Initialization option
 * @returns Expressjs router
 *
 * @public
 */
export const RequestWithAgentMiddleware = (options: RequestWithAgentRouterOptions): MiddlewareHandler =>
  async (c: ContextWithAgent, next) => {
    if (options.agent) {
      c.agent = options.agent
    } else if (options.getAgentForRequest) {
      c.agent = await options.getAgentForRequest(c)
    } else {
      throw Error('[RequestWithAgentRouter] agent or getAgentForRequest is required')
    }
    return next()

  }
