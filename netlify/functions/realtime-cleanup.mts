import type {Context,Config} from '@netlify/functions';
import {service} from '../lib/runtime.mjs';
export default async (_request:Request,context:Context)=>{await service(context).reap();return new Response(null,{status:204})};
export const config:Config={schedule:'* * * * *'};
