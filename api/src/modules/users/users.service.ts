import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileDto } from '../auth/auth.dto';
import { publicUser } from '../auth/auth.service';
import { User } from './user.entity';
@Injectable()
export class UsersService {
  constructor(private db: DataSource) {}
  async update(user: User, body: ProfileDto) {
    const update = Object.fromEntries(Object.entries(body).filter(([,value]) => value !== undefined && value !== null));
    if (Object.keys(update).length) await this.db.getRepository(User).update(user.id,update);
    return publicUser(Object.assign(user,update));
  }
}
