import { AdvancedTools, Variables } from '@shared/types/ai'
import {
  appendResponseMessages,
  createDataStream,
  streamText,
  UIMessage
} from 'ai'
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { v4 as uuidV4 } from 'uuid'
import {
  calculator,
  date,
  googleMapsPlaces,
  googleMapsRouting,
  weather,
  webSearch
} from '../../ai/calling-tools'
import {
  generateTitleFromUserMessage,
  getModelFromProvider,
  getMostRecentUserMessage,
  getTrailingMessageId
} from '../../ai/utils'
import {
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  getSetting,
  saveChat,
  saveMessages
} from '../../db/queries'

const chat = new Hono<{ Variables: Variables }>()

chat.get('/mcp', async (c) => {
  const tools = c.get('tools')
  return c.json({ tools })
})

chat.post('/', async (c) => {
  const { id, messages, advancedTools } = await c.req.json<{
    id: string
    messages: UIMessage[]
    advancedTools: AdvancedTools[]
  }>()
  const mcpTools = c.get('tools')

  const setting = await getSetting()
  if (!('id' in setting)) {
    throw new Error('Failed to retrieve settings.')
  }

  if (!setting.chatModel) {
    throw new Error('Failed to retrieve selected chat model.')
  }

  if (!setting.reasoningModel) {
    throw new Error('Failed to retrieve selected reasoning model.')
  }

  const userMessage = getMostRecentUserMessage(messages)
  if (!userMessage) {
    return c.text('No user message found', 400)
  }

  const { chatModel, reasoningModel } = await getModelFromProvider()

  const existingChat = await getChatById({ id })
  if (!existingChat) {
    const title = await generateTitleFromUserMessage({
      model: chatModel,
      message: userMessage
    })
    await saveChat({ id, title })
  }

  await saveMessages({
    messages: [
      {
        ...userMessage,
        chatId: id,
        id: userMessage.id,
        role: 'user',
        parts: userMessage.parts,
        attachments: userMessage.experimental_attachments ?? [],
        createdAt: new Date()
      }
    ]
  })

  const tools = {
    ...mcpTools,
    calculator,
    date,
    weather,
    googleMapsPlaces: googleMapsPlaces(setting),
    googleMapsRouting: googleMapsRouting(setting)
  }
  if (advancedTools.includes(AdvancedTools.WebSearch)) {
    tools['webSearch'] = webSearch(setting)
  }

  // immediately start streaming the response
  const dataStream = createDataStream({
    execute: async (dataStream) => {
      const result = streamText({
        model: advancedTools.includes(AdvancedTools.Reasoning)
          ? reasoningModel
          : chatModel,
        system:
          'You are a friendly assistant! Keep your responses concise and helpful.',
        messages,
        maxSteps: setting.maxSteps ?? 1,
        tools,
        experimental_generateMessageId: uuidV4,
        onFinish: async ({ response }) => {
          try {
            const assistantId = getTrailingMessageId({
              messages: response.messages.filter(
                (message) => message.role === 'assistant'
              )
            })

            if (!assistantId) {
              throw new Error('No assistant message found!')
            }

            const [, assistantMessage] = appendResponseMessages({
              messages: [userMessage],
              responseMessages: response.messages
            })

            await saveMessages({
              messages: [
                {
                  id: assistantId,
                  chatId: id,
                  role: assistantMessage.role,
                  parts: assistantMessage.parts,
                  attachments: assistantMessage.experimental_attachments ?? [],
                  createdAt: new Date()
                }
              ]
            })
          } catch {
            console.error('Failed to save chat')
          }
        }
      })

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
        sendSources: true,
        sendUsage: true
      })
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error)
    }
  })

  // Mark the response as a v1 data stream:
  c.header('X-Vercel-AI-Data-Stream', 'v1')
  c.header('Content-Type', 'text/plain; charset=utf-8')

  return stream(c, (stream) =>
    stream.pipe(dataStream.pipeThrough(new TextEncoderStream()))
  )
})

chat.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!id) {
    return c.text('Not Found', 404)
  }

  try {
    await deleteChatById({ id })
    return c.text('Chat deleted', 200)
  } catch {
    return c.text('An error occurred while processing your request', 500)
  }
})

chat.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!id) {
    return c.text('Not Found', 404)
  }

  try {
    const chat = await getChatById({ id })
    if (!chat) {
      return c.text('Not Found', 404)
    }

    const messagesFromDb = await getMessagesByChatId({ id })
    return c.json(messagesFromDb)
  } catch {
    return c.text('An error occurred while processing your request', 500)
  }
})

export default chat
