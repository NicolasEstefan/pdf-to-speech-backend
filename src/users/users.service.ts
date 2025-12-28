import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from './user.entity'
import { Repository } from 'typeorm'
import { CreateUserParams } from './create-user-params.interface'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserParams: CreateUserParams): Promise<User> {
    const newUser = this.usersRepository.create(createUserParams)
    await this.usersRepository.save(newUser)

    return newUser
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
