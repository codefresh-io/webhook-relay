import { NextFunction, Request, Response, Handler } from 'express'

export const use = (handlerFn: Handler) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await handlerFn(req, res, next)
    } catch (err) {
        next(err)
    }
}
