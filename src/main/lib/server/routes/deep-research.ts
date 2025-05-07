import { Hono } from 'hono'

const app = new Hono()

app.get('/sse', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // 发送初始事件
      controller.enqueue(encoder.encode('data: Connected to SSE\n\n'))

      // 每 2 秒发送一个消息
      const interval = setInterval(() => {
        const data = `data: ${new Date().toISOString()}\n\n`
        controller.enqueue(encoder.encode(data))
      }, 2000)

      // 清理定时器
      const cleanup = () => clearInterval(interval)

      c.req.raw.signal?.addEventListener('abort', cleanup)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
})
