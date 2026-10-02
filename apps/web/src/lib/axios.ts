import { createNestlancerApi } from '@nestlancer/api-client';

const api = createNestlancerApi();

export const http = api.client;
export const apiServices = api;
