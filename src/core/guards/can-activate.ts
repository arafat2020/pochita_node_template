import { Request, Response } from 'express';
import { RequestContext } from '../context/request-context';

export interface ExecutionContext {
  req: Request;
  res: Response;
  context: RequestContext;
  handler: Function;
  controller: Function;
}

export interface CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean>;
}
