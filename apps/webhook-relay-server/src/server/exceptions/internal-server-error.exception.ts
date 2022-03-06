import { HttpStatus } from '../types'
import { HttpException } from './http.exception'

export class InternalServerErrorException extends HttpException {
    constructor(
        errorMsg?: string,
        description = 'Internal Server Error',
    ) {
        super(
            HttpException.createResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                description,
                errorMsg,
            ),
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
