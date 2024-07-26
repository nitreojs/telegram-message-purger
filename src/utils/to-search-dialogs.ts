import { Color, Logger } from '@starkow/logger'

export const toSearchDialogs = (dialogs: Record<string, any>[]) => dialogs.map((dialog) => {
  const name = dialog.title as string

  const additions: string[] = []

  if (dialog.username) {
    additions.push('@' + dialog.username)
  }

  if (dialog.id) {
    additions.push(`id = ${dialog.id}`)
  }

  return {
    name: `${Logger.color(name, Color.Magenta)} ${Logger.color(`(${additions.join(', ')})`, Color.Gray)}`,
    value: dialog.peer
  }
})
