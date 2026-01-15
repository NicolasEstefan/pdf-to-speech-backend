import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm'
import { GenerationStatus } from '../types/generation-status.enum'
import { User } from '../../users/user.entity'
import { Audio } from './audio.entity'

@Entity()
export class Generation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column()
  status: GenerationStatus

  @ManyToOne(() => User, (user) => user.generations, {
    eager: false,
    onDelete: 'CASCADE',
  })
  createdBy: User

  @OneToOne(() => Audio, (audio) => audio.generation, {
    eager: true,
    nullable: true,
  })
  audio: Audio | null
}
