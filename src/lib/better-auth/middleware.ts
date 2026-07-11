import 'server-only'
import { requireSession } from './session'

type Session = Awaited<ReturnType<typeof requireSession>>

export function withAuthAction<Args extends unknown[], Return>(
  action: (session: Session, ...args: Args) => Promise<Return>,
) {
  return async (...args: Args): Promise<Return> => {
    const session = await requireSession()
    return action(session, ...args)
  }
}
