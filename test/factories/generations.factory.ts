import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import { GenerationStatus } from '../../src/generations/types/generation-status.enum'
import { Generation } from '../../src/generations/entities/generation.entity'
import dayjs from 'dayjs'

export const generationsFactory = Factory.define<Generation>(
  ({ associations }) => ({
    id: faker.string.uuid(),
    createdBy: associations.createdBy!,
    audio: null,
    status: GenerationStatus.PENDING,
    title: 'generation',
    createdAt: dayjs().subtract(2, 'days').toDate(),
    updatedAt: dayjs().subtract(2, 'days').toDate(),
  }),
)
