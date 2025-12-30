import { Injectable } from '@nestjs/common'
import { User } from './user.entity'
import { CreateUserParams } from './create-user-params.interface'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(createUserParams: CreateUserParams): Promise<User> {
    return await this.usersRepository.createUser(createUserParams)
  }

  async findByGoogleId(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({
      googleId: id,
    })
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: {
        id,
      },
    })
  }
}
