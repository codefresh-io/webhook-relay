import { Handler, NextFunction, Request, Response } from 'express'

import crypto from 'crypto'

export const githubPayloadSignatureHeaderName = 'X-Hub-Signature-256'
const signatureHashAlgo = 'sha256'

export function verifyGithubPayload(secret: string): Handler {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.rawBody) {
      return next('Request body empty')
    }
    const sig = Buffer.from(req.get(githubPayloadSignatureHeaderName) || '', 'utf8')
    const hmac = crypto.createHmac(signatureHashAlgo, secret)
    const digest = Buffer.from(`${signatureHashAlgo}=${hmac.update(req.rawBody).digest('hex')}`, 'utf8')
    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      return next(`Request body digest (${digest}) did not match ${githubPayloadSignatureHeaderName} (${sig})`)
    }
    return next()
  }
}
