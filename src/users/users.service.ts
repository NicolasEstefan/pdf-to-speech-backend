import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/user.entity'
import { Repository } from 'typeorm'
import { CreateUserDto } from './create-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto)
    await this.usersRepository.save(newUser)

    return newUser
  }

  async findByGoogleId(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({
      googleId: id,
    })
  }
}
