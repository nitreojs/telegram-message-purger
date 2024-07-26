import { tl } from '@mtcute/node'

export interface InnerDialog {
  title: string
  username: string | null
  id: number
  peer: tl.RawChat
}
