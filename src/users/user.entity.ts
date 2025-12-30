import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { RefreshToken } from '../auth/refresh-token.entity'
import { Exclude } from 'class-transformer'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  @Exclude({ toPlainOnly: true })
  email: string

  @Column()
  username: string

  @Column({ unique: true, nullable: true, type: 'text' })
  @Exclude({ toPlainOnly: true })
  googleId: string | null

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    eager: false,
  })
  @Exclude({ toPlainOnly: true })
  refreshTokens: RefreshToken[]
}
