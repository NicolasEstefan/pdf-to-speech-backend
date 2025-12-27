import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { User } from '../users/user.entity'

@Entity()
export class RefreshToken {
  @PrimaryColumn()
  token: string

  @Column({ type: 'timestamptz' })
  expiresAt: string

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    eager: false,
    onDelete: 'CASCADE',
  })
  user: User
}
