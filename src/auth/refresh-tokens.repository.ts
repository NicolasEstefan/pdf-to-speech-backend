import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { RefreshToken } from './refresh-token.entity'

@Injectable()
export class RefreshTokensRepository extends Repository<RefreshToken> {
  constructor(private readonly dataSource: DataSource) {
    super(RefreshToken, dataSource.manager)
  }

  async replaceRefreshToken(oldToken: RefreshToken, newToken: RefreshToken) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RefreshToken, oldToken)
      await manager.save(newToken)
    })
  }
}
