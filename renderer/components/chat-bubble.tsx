import { cn } from '@/lib/utils'
import { UIMessage } from 'ai'
import { FC, memo } from 'react'
import Markdown from './markdown'
import { Avatar, AvatarImage } from './ui/avatar'

interface Props {
  message: UIMessage
}

const ChatBubble: FC<Props> = ({ message }) => {
  return (
    <section
      className={cn('group mb-8 flex items-start', {
        'flex-row-reverse': message.role === 'user'
      })}
    >
      {message.role === 'assistant' && (
        <Avatar
          className={cn({
            'mr-4': message.role === 'assistant'
          })}
        >
          <AvatarImage src="/logo.png" />
        </Avatar>
      )}

      <section
        className={cn('flex flex-col', {
          'items-start': message.role === 'assistant',
          'items-end': message.role === 'user'
        })}
      >
        <div
          className={cn({
            'bg-accent rounded-xl px-3 py-2 break-words whitespace-pre-wrap':
              message.role === 'user'
          })}
        >
          {message.role === 'assistant' && <Markdown src={message.content} />}

          {message.role === 'user' && <p>{message.content}</p>}
        </div>
      </section>
    </section>
  )
}

export default memo(ChatBubble)
