import { NextFunction, Request, Response, Handler } from 'express'
import { AUTH_TOKEN_HTTP_HEADER } from '@codefresh-io/common'

import { UnauthorizedException } from '../exceptions'

export function auth(authToken?: string): Handler {
    return authToken ?
        function (req: Request, res: Response, next: NextFunction): void {
            if (req.headers[AUTH_TOKEN_HTTP_HEADER] !== authToken) {
                next(new UnauthorizedException('invalid auth token'))
                return
            }

            next()
        } :
        function (req: Request, res: Response, next: NextFunction): void {
            next()
        }
}
