import { DataSource, Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { Generation } from './generation.entity'
import { User } from '../users/user.entity'
import { GenerationStatus } from './generation-status.enum'
import { Audio } from './audio.entity'

@Injectable()
export class GenerationsRepository extends Repository<Generation> {
  constructor(private readonly dataSource: DataSource) {
    super(Generation, dataSource.manager)
  }

  async createGeneration(user: User) {
    const generation = this.create({
      createdBy: user,
      status: GenerationStatus.PENDING,
      title: 'generation',
    })

    await this.save(generation)
    return generation
  }

  async finishGeneration(
    generationId: string,
    audioFilePath: string,
    audioSize: number,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const audio = manager.create(Audio, {
        filePath: audioFilePath,
        generation: { id: generationId },
        size: audioSize,
      })

      await manager.save(Audio, audio)

      await manager.update(
        Generation,
        {
          id: generationId,
        },
        {
          status: GenerationStatus.DONE,
        },
      )
    })
  }
}
