import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { GenerationStatus } from '../types/generation-status.enum'
import { User } from '../../users/user.entity'
import { Audio } from './audio.entity'
import { Language } from '../types/language.enum'
import { Speaker } from '../../external-services/tts/types/speaker.enum'

@Entity()
export class Generation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'character varying' })
  status: GenerationStatus

  @Column({ type: 'character varying' })
  language: Language

  @Column({ type: 'character varying' })
  speaker: Speaker

  @Column({ default: 0, type: 'float' })
  progressPercentage: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => User, (user) => user.generations, {
    eager: false,
    onDelete: 'CASCADE',
  })
  createdBy: User
  @Column()
  createdById: string

  @OneToOne(() => Audio, (audio) => audio.generation, {
    eager: true,
    nullable: true,
  })
  audio: Audio | null
}
