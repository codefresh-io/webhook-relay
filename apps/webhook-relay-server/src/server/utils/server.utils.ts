import { NextFunction, Request, Response, RequestHandler } from 'express'

export const use = (handlerFn: RequestHandler) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await handlerFn(req, res, next)
    } catch (err) {
        next(err)
    }
}
