declare global {
  namespace Express {
    interface Request {
      // Exact bytes of a JSON body, kept for webhook signature checks (providers sign the raw body).
      rawBody?: Buffer
      context?: {
        requestId?: string
      }
    }
  }
}

export {}
