import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/roles.decorator';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // step 1: route pe kaunsa role chahiye?
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    // step 2: koi role nahi → true return karo
    if (!requiredRoles) {
      return true;
    }
    // step 3: user ka role check karo
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);   

  }
}