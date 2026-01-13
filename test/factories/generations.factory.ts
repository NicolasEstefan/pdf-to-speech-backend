import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import { GenerationStatus } from '../../src/generations/generation-status.enum'
import { Generation } from '../../src/generations/generation.entity'

export const generationsFactory = Factory.define<Generation>(
  ({ associations }) => ({
    id: faker.string.uuid(),
    createdBy: associations.createdBy!,
    audio: null,
    status: GenerationStatus.PENDING,
    title: 'generation',
  }),
)
