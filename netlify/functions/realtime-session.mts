import type {Context,Config} from '@netlify/functions';
import {service} from '../lib/runtime.mjs';
export default async (request:Request,context:Context)=>service(context).handle(request);
export const config:Config={path:'/api/realtime/session',rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:6}};
