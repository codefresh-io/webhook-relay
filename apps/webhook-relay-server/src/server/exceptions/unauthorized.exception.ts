import { HttpStatus } from '../types'
import { HttpException } from './http.exception'

export class UnauthorizedException extends HttpException {
    constructor(
        errorMsg?: string,
        description = 'Unauthorized',
    ) {
        super(
            HttpException.createResponse(
                HttpStatus.UNAUTHORIZED,
                description,
                errorMsg,
            ),
            HttpStatus.UNAUTHORIZED,
        )
    }
}
