import { DataSource, Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { Audio } from './audio.entity'

@Injectable()
export class AudiosRepository extends Repository<Audio> {
  constructor(private readonly dataSource: DataSource) {
    super(Audio, dataSource.manager)
  }
}
