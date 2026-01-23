import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Generation } from './generation.entity'
import { Exclude } from 'class-transformer'

@Entity()
export class Audio {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  size: number

  @Column()
  @Exclude({ toPlainOnly: true })
  filePath: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date

  @OneToOne(() => Generation, (generation) => generation.audio, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  generation: Generation
}
