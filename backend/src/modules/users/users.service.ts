import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findDemo(): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email: 'demo@casecellshop.com' } })
    if (!user) throw new NotFoundException('Demo user not found')
    return user
  }
}
