import { IAgent } from '@veramo/core-types'
import { Hono, Context } from 'hono'
import Debug from 'debug'

interface ContextWithAgent extends Context {
  agent?: IAgent
}

/**
 * @public
 */
export interface AgentRouterOptions {
  /**
   * List of exposed methods
   */
  exposedMethods: Array<string>
}

/**
 * Creates a router that exposes {@link @veramo/core#Agent} methods remotely.
 *
 * This can be used by {@link @veramo/remote-client#AgentRestClient | AgentRestClient} to instantiate the methods of
 * this agent on the client.
 *
 * @param options - Initialization option
 * @returns Hono router
 *
 * @public
 */
export const AgentRouter = (options: AgentRouterOptions): Hono => {
  const router = new Hono()

  for (const exposedMethod of options.exposedMethods) {
    Debug('veramo:remote-hono-server:initializing')(exposedMethod)

    router.post('/' + exposedMethod, async (c: ContextWithAgent) => {
      if (!c.agent) throw Error('Agent not available')
      try {
        const json = await c.req.json()
        const result = await c.agent.execute(exposedMethod, json)
        c.status(200)
        return c.json(result)
      } catch (e: any) {
        if (e.name === 'ValidationError') {
          c.status(400)
          return c.json({
            name: 'ValidationError',
            message: e.message,
            method: e.method,
            path: e.path,
            code: e.code,
            description: e.description,
          })
        } else {
          c.status(500)
          return c.json({ error: e.message })
        }
      }
    })
  }

  return router
}
