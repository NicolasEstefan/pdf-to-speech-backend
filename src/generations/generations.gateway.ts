import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { WsAuthService } from '../auth/ws-auth.service'
import { GenerationProgress } from './types/generation-progress.interface'

@WebSocketGateway()
export class GenerationsGateway implements OnGatewayConnection {
  logger: Logger = new Logger(GenerationsGateway.name)
  @WebSocketServer()
  server: Server

  constructor(private readonly wsAuthService: WsAuthService) {}

  async handleConnection(client: Socket) {
    const user = await this.wsAuthService.getAuthenticatedUser(client)

    if (!user) {
      client.disconnect()
      this.logger.verbose(`Disconnected unauthenticated user`)
      return
    }

    this.logger.verbose(`User ${user.username} connected`)
    await client.join(user.id)
  }

  emitGenerationProgress(generationProgress: GenerationProgress) {
    this.server
      .to(generationProgress.createdById)
      .emit('generation-progress', generationProgress)
    this.logger.verbose(
      `Sent generation progress update ${generationProgress.progressPercentage}% for generation ${generationProgress.generationId}`,
    )
  }
}
