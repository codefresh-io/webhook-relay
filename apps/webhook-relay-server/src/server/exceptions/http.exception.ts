import { isObject, isString } from 'lodash'

import { HttpStatus } from '../types'

export abstract class HttpException extends Error {
    protected constructor(
        private readonly response: string | Record<string, any>,
        private readonly status: HttpStatus,
    ) {
        super()
        this.initMessage()
    }

    get name(): string {
        return this.constructor.name
    }

    static createResponse(
        statusCode: HttpStatus,
        description: string,
        errorMsg?: string,
    ): Record<string, any> {
        if (!errorMsg) {
            return { statusCode, message: description }
        }

        return { statusCode, message: errorMsg, error: description }
    }

    getResponse(): string | Record<string, any> {
        return this.response
    }

    getStatus(): HttpStatus {
        return this.status
    }

    private initMessage(): void {
        if (isString(this.response)) {
            this.message = this.response
        } else if (isObject(this.response) && isString((this.response as Record<string, any>).message)) {
            this.message = (this.response as Record<string, any>).message
        } else {
            this.message = this.name.match(/[A-Z][a-z]+|\d+/g)?.join(' ') || this.name
        }
    }
}
