import { NextFunction, Request, Response, RequestHandler } from 'express'

export function use(handlerFn: RequestHandler): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await handlerFn(req, res, next)
        } catch (err) {
            next(err)
        }
    }
}
