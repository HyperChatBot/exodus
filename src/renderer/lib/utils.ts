import type { Attachment, Message, UIMessage } from 'ai'
import { clsx, type ClassValue } from 'clsx'
import type { Message as DBMessage } from 'src/main/lib/db/schema'
import { twMerge } from 'tailwind-merge'
import { BASE_URL } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ApplicationError extends Error {
  info: string
  status: number
}

export const fetcher = async (path: string) => {
  const res = await fetch(BASE_URL + path)

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.'
    ) as ApplicationError

    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user')
  return userMessages.at(-1)
}

export function getRandomEmoji() {
  const min = 0x1f600
  const max = 0x1f64f
  const randomCodePoint = Math.floor(Math.random() * (max - min + 1)) + min
  return String.fromCodePoint(randomCodePoint)
}

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)

    fileReader.onload = () => {
      resolve(fileReader.result as string)
    }

    fileReader.onerror = (error) => {
      reject(error)
    }
  })
}

export function convertToUIMessages(
  messages: Array<DBMessage>
): Array<UIMessage> {
  return messages.map((message) => ({
    id: message.id,
    parts: message.parts as UIMessage['parts'],
    role: message.role as UIMessage['role'],
    content: '',
    createdAt: message.createdAt,
    experimental_attachments: (message.attachments as Array<Attachment>) ?? []
  }))
}
