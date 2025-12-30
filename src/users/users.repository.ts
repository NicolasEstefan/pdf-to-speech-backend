import { DataSource, Repository } from 'typeorm'
import { User } from './user.entity'
import { Injectable } from '@nestjs/common'
import { CreateUserParams } from './create-user-params.interface'

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.manager)
  }

  async createUser(createUserParams: CreateUserParams) {
    const newUser = this.create(createUserParams)
    await this.save(newUser)
    return newUser
  }
}
