import type { AxiosInstance } from 'axios';

export abstract class BaseService {
  constructor(protected readonly client: AxiosInstance) {}
}
