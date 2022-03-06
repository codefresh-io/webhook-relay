import { NextFunction, Request, Response } from 'express'

import { HttpException, InternalServerErrorException } from '../exceptions'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    // If response is already sent, don't attempt to respond to client
    if (res.headersSent) {
        return next(err)
    }

    const exception = err instanceof HttpException ? err : new InternalServerErrorException()
    res.status(exception.getStatus()).json(exception.getResponse())

    next(err)
}
