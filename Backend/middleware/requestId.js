import { randomUUID } from 'crypto';

export default function requestId(req, _res, next) {
  req.requestId = randomUUID();
  next();
}
