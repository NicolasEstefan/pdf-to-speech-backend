import 'socket.io'
import { User } from '../users/user.entity'

declare module 'socket.io' {
  interface Socket {
    user?: User
  }
}
