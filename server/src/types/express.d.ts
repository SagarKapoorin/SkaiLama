declare global {
  namespace Express {
    interface Request {
      clientTimezone?: string;
    }
  }
}

export {};
