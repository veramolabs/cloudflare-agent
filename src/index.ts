import { Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import { bearerAuth } from 'hono/bearer-auth'
import { exposedMethods, getAgent } from './veramo'
import { RequestWithAgentMiddleware } from './lib/request-agent-router'
import { AgentRouter } from './lib/agent-router'
import { ApiSchemaRouter } from './lib/api-schema-router'

type Bindings = {
  KV: KVNamespace
  API_KEY: string
  KMS_SECRET_KEY: string
  INFURA_PROJECT_ID: string
}

const app = new Hono<{ Bindings: Bindings }>()

const getAgentForRequest = async (c: Context) => getAgent({
  namespace: c.env.KV,
  kmsSecretKey: c.env.KMS_SECRET_KEY,
  infuraProjectId: c.env.INFURA_PROJECT_ID,
})

app.use('*', cors())

app.use('*', RequestWithAgentMiddleware({
  getAgentForRequest,
}))

app.on('POST', '/api/*', async (c, next) => {
  const bearer = bearerAuth({ token: c.env.API_KEY });
  return bearer(c, next);
})

app.route('/api', AgentRouter({
  exposedMethods
}))

app.route('/api/json', ApiSchemaRouter({
  basePath: '/api',
  exposedMethods
}))

app.get('/', async (c) => {
  const agent = await getAgent({
    namespace: c.env.KV,
    kmsSecretKey: c.env.KMS_SECRET_KEY,
    infuraProjectId: c.env.INFURA_PROJECT_ID,
  })
  const identifier = await agent.didManagerGetOrCreate({
    alias: 'default',
    provider: 'did:ethr:goerli',
  })

  return c.text(identifier.did)
})


export default app
