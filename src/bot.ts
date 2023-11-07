import { Telegram } from 'puregram'
import { Color, Logger } from '@starkow/logger'

import { Env } from './env'

const telegram = Telegram.fromToken(Env.TOKEN)

telegram.updates.on('message', (context) => {
  return context.send('Hello, world!')
})

const main = async () => {
  await telegram.updates.startPolling()

  Logger.create(`@${telegram.bot.username}`)('started')
}

main().catch(Logger.create('error!', Color.Red).error)
