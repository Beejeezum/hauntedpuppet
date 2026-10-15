import type {Config,Context} from '@netlify/functions';
import {cloudRemote} from '../lib/cloud-remote.mjs';
const remote=cloudRemote();
export default async (request:Request,context:Context)=>remote.handle(request,context);
export const config:Config={path:['/api/phone/*','/api/remote/*'],rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:1200}};
