import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import { GenerationStatus } from '../../src/generations/types/generation-status.enum'
import { Generation } from '../../src/generations/entities/generation.entity'
import dayjs from 'dayjs'
import { usersFactory } from './users.factory'
import { User } from '../../src/users/user.entity'

export const generationsFactory = Factory.define<Generation>(({ params }) => {
  const createdBy = (params.createdBy ?? usersFactory.build()) as User

  return {
    id: faker.string.uuid(),
    createdBy: createdBy,
    createdById: createdBy.id,
    audio: null,
    status: GenerationStatus.PENDING,
    title: 'generation',
    createdAt: dayjs().subtract(2, 'days').toDate(),
    updatedAt: dayjs().subtract(2, 'days').toDate(),
  }
})
