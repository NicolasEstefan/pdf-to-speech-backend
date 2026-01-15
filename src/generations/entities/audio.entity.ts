import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Generation } from './generation.entity'

@Entity()
export class Audio {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  size: number

  @Column()
  filePath: string

  @OneToOne(() => Generation, (generation) => generation.audio, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  generation: Generation
}
