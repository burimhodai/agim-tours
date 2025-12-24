import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IUser, UserRoles } from 'src/shared/types/user.types';
import { createUserDTO, LoginDto, UpdateUserDto } from 'src/shared/DTO/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    private jwtService: JwtService,
  ) { }

  async createUser(
    createUserDto: createUserDTO,
  ): Promise<{ user: Partial<IUser>; token: string }> {
    const { email, password, role, permissions } = createUserDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      role: role || UserRoles.USER,
      permissions: permissions || [],
      agency: createUserDto.agency,
    });

    const savedUser = await newUser.save();

    const token = this.generateToken(savedUser);

    const userResponse = this.sanitizeUser(savedUser);

    return { user: userResponse, token };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<IUser>; token: string }> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    const userResponse = this.sanitizeUser(user);

    return { user: userResponse, token };
  }

  async findById(id: string): Promise<Partial<IUser>> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async findAll(): Promise<Partial<IUser>[]> {
    const users = await this.userModel.find().populate("agency");
    return users.map((user) => this.sanitizeUser(user));
  }

  async updateUser(
    id: string,
    updateData: UpdateUserDto,
  ): Promise<Partial<IUser>> {
    const updatePayload: any = { ...updateData };

    if (updateData.password) {
      const saltRounds = await bcrypt.genSalt(10);
      updatePayload.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    if (updateData.agency) {
      updatePayload.agency = updateData.agency;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  private generateToken(user: IUser): string {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any): Partial<IUser> {
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}
