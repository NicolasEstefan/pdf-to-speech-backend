import { DataSource, Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { Generation } from './entities/generation.entity'
import { GenerationStatus } from './types/generation-status.enum'
import { Audio } from './entities/audio.entity'
import { CreateGenerationParams } from './types/create-generation-params.interface'

@Injectable()
export class GenerationsRepository extends Repository<Generation> {
  constructor(private readonly dataSource: DataSource) {
    super(Generation, dataSource.manager)
  }

  async createGeneration({
    createdBy,
    speaker,
    language,
    title,
  }: CreateGenerationParams) {
    const generation = this.create({
      createdBy,
      status: GenerationStatus.IN_PROGRESS,
      title,
      speaker,
      language,
    })

    await this.save(generation)
    return generation
  }

  async finishGeneration(
    generationId: string,
    audioFilePath: string,
    audioSize: number,
  ): Promise<Generation> {
    const generation = await this.dataSource.transaction(async (manager) => {
      const audio = manager.create(Audio, {
        filePath: audioFilePath,
        generation: { id: generationId },
        size: audioSize,
      })

      await manager.save(Audio, audio)

      const generation = await manager.findOneBy(Generation, {
        id: generationId,
      })
      generation!.status = GenerationStatus.DONE
      generation!.progressPercentage = 100
      await manager.save(generation)

      return generation!
    })

    return generation
  }
}
