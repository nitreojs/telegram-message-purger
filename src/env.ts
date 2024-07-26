import 'dotenv/config'
import env from 'env-var'

export class Env {
  static TELEGRAM_API_ID = env.get('TELEGRAM_API_ID').required().asIntPositive()
  static TELEGRAM_API_HASH = env.get('TELEGRAM_API_HASH').required().asString()
}
