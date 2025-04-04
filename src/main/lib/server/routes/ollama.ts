import { Hono } from 'hono'
import { Variables } from '../types'

const ollama = new Hono<{ Variables: Variables }>()

ollama.get('/ping', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.text('Not Found', 404)
  }

  try {
    await fetch(url)
    return c.json({
      message: 'Ollama is running'
    })
  } catch {
    return c.text('Not Found', 404)
  }
})

export default ollama
