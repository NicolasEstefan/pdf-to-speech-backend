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

@Entity()
export class Generation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column()
  status: GenerationStatus

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
