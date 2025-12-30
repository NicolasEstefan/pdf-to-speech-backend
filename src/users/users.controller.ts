import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GetUser } from 'src/auth/get-user.decorator'
import { User } from './user.entity'

@Controller('users')
@UseGuards(AuthGuard())
export class UsersController {
  @Get('/me')
  me(@GetUser() user: User) {
    return user
  }
}
