import { Color, Logger } from '@starkow/logger'

export const theme = {
  style: {
    answer: (text: string) => Logger.color(text, Color.Magenta)
  }
}
