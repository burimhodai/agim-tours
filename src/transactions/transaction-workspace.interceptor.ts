import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Model, Types } from 'mongoose';
import { Observable } from 'rxjs';
import type { IAgency } from 'src/shared/types/agency.types';
import { transactionWorkspace } from './transaction-workspace';

const ledgerRoutes = /^(?:bus\/tickets|plane\/tickets|hotel\/reservations|arrangements|events|organized-travel|airport-transport|driver-reports|transactions|reports\/(?:seed|clear))(?:\/|$)/i;

@Injectable()
export class TransactionWorkspaceInterceptor implements NestInterceptor {
  constructor(
    private readonly jwt: JwtService,
    @InjectModel('Agency') private readonly agencies: Model<IAgency>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path.replace(/^\/(?:api\/v1\/)?/i, '');
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || !ledgerRoutes.test(path)) {
      return next.handle();
    }

    const token = request.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    let identity: { sub?: string; role?: string } | undefined;
    try {
      if (token) identity = await this.jwt.verifyAsync<{ sub?: string; role?: string }>(token);
    } catch {
      throw new UnauthorizedException();
    }
    const user = identity?.sub;
    if (!user || !Types.ObjectId.isValid(user)) throw new UnauthorizedException();

    if (/^reports\//i.test(path) && identity?.role !== 'admin') throw new ForbiddenException();

    const agency = request.get('X-Agency-Id');
    if (!agency || !Types.ObjectId.isValid(agency) || !(await this.agencies.exists({ _id: agency }))) {
      throw new BadRequestException('Zgjidhni një agjenci të vlefshme në hapësirën e punës.');
    }

    const workspace = { agency: new Types.ObjectId(agency).toHexString(), user };
    return new Observable(subscriber =>
      transactionWorkspace.run(workspace, () => next.handle().subscribe(subscriber)),
    );
  }
}
