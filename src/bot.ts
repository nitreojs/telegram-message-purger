import { TelegramClient, networkMiddlewares, tl, toggleChannelIdMark } from '@mtcute/node'
import { Color, Logger } from '@starkow/logger'
import chunk from 'lodash.chunk' // yeah fight me

import { confirm, input, number, search, select } from '@inquirer/prompts'
import { createSpinner } from 'nanospinner'

import { Env } from './env'
import { sleep, toSearchDialogs } from './utils'
import { InnerDialog } from './types'
import { theme } from './constants'

const telegram = new TelegramClient({
  apiId: Env.TELEGRAM_API_ID,
  apiHash: Env.TELEGRAM_API_HASH,
  disableUpdates: true,
  network: {
    // @ts-expect-error esm interop
    middlewares: networkMiddlewares.basic({
      floodWaiter: { maxRetries: 5, maxWait: 300_000 },
      internalErrors: { maxRetries: 5, waitTime: 5_000 }
    })
  }
})

const processDeletion = async (peer: number | string | tl.RawChat) => {
  const confirmation = await confirm({
    message: 'are you sure you want to delete all your messages in this chat?',
    default: true,
    theme
  })

  if (!confirmation) {
    return Logger.create('collector')('aborted')
  }

  const me = await telegram.resolvePeer('me')

  let chatId: number
  let title: string

  if (typeof peer === 'string' || typeof peer === 'number') {
    const dialogs = await telegram.findDialogs(typeof peer === 'number' ? toggleChannelIdMark(peer) : peer) // for caching purposes

    if (dialogs.length === 0) {
      return Logger.create('collector')(`no dialogs found for chat ${peer}`)
    }

    const dialog = dialogs[0]

    chatId = dialog.chat.id
    title = dialog.chat.title!
  } else {
    chatId = peer.id
    title = peer.title
  }

  const markedChatId = toggleChannelIdMark(chatId)

  const collectingSpinner = createSpinner(`collecting messages in ${Logger.color(title, Color.Magenta)}...`).start()

  const iterable = telegram.iterSearchMessages({
    chatId: markedChatId,
    fromUser: me
  })

  const ids = []

  for await (const message of iterable) {
    ids.push(message.id)
  }

  if (ids.length === 0) {
    return collectingSpinner.error({ text: 'there are no messages to delete in this chat!' })
  }

  collectingSpinner.success({ text: `collected ${Logger.color(String(ids.length), Color.Green)} messages` })

  await sleep(5_000)

  const chunkedIds = chunk(ids, 100)

  let deleted = 0

  const deletingSpinner = createSpinner('deleting messages...').start()

  for (const chunk of chunkedIds) {
    await telegram.deleteMessagesById(markedChatId, chunk, { revoke: true })

    deleted += chunk.length

    deletingSpinner.update({
      text: `deleted ${Logger.color(String(deleted), Color.Green)} / ${Logger.color(String(ids.length), Color.Magenta)} messages`
    })
  }

  deletingSpinner.success({ text: 'done!' })
}

const processType = async (type: 'id' | 'username' | 'list') => {
  if (type === 'list') {
    const spinner = createSpinner('loading chats...').start()

    const dialogsIterator = telegram.iterDialogs({
      filter: {
        groups: true
      }
    })

    const dialogs: InnerDialog[] = []

    for await (const dialog of dialogsIterator) {
      dialogs.push({
        title: dialog.chat.title!,
        peer: dialog.chat.peer as tl.RawChat,
        username: dialog.chat.username,
        id: dialog.chat.id
      })
    }

    spinner.success({ text: `loaded ${dialogs.length} chats` })

    const peer = await search({
      message: 'select the chat you want to delete messages from:',
      source: async (input) => {
        if (!input) {
          return toSearchDialogs(dialogs)
        }

        return toSearchDialogs(dialogs).filter(dialog => dialog.name.toLowerCase().includes(input.toLowerCase()))
      },
      theme
    })

    return processDeletion(peer as tl.RawChat)
  }
  
  if (type === 'id') {
    const id = await number({
      message: 'enter chat id:',
      required: true,
      theme
    })

    if (!id) {
      return Logger.create('collector')('invalid id provided')
    }

    return processDeletion(id)
  }
  
  if (type === 'username') {
    const username = await input({
      message: 'enter chat username:',
      required: true,
      theme
    })

    const peer = username.replace('@', '').replace(/^\/(?:https?:\/\/)?(?:www\.)?t\.me\//, '')

    return processDeletion(peer)
  }
}

const main = async () => {
  const self = await telegram.start({
    phone: () => telegram.input('phone » '),
    code: () => telegram.input('code » '),
    password: () => telegram.input('password » ')
  })

  Logger.create(`${self.displayName}[${self.id}]`)('logged in')

  const type: ('id' |'username' | 'list') = await select({
    message: 'select the way you want to choose a chat:',
    choices: [
      {
        name: 'by id',
        value: 'id'
      },
      {
        name: 'by username',
        value: 'username'
      },
      {
        name: 'from a list',
        value: 'list',
        description: 'this will list all your chats'
      }
    ],
    default: 'username',
    loop: true,
    theme
  })

  await processType(type)

  return telegram.close()
}

main().catch(Logger.create('error!', Color.Red).error)
