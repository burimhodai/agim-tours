import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { createUserDTO, LoginDto } from 'src/shared/DTO/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() data: createUserDTO) {
    try {
      return await this.userService.createUser(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  @Post('login')
  async login(@Body() data: LoginDto) {
    try {
      return await this.userService.login(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
