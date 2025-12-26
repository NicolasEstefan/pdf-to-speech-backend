import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { RefreshToken } from '../auth/refresh-token.entity'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column({ unique: true, nullable: true })
  googleId: string

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    eager: false,
  })
  refreshTokens: RefreshToken[]
}
