import {getDatabase} from '@netlify/database';
import {stageLease} from './stage-lease.mjs';
import {getStore} from '@netlify/blobs';
import {cloudService} from './cloud-api.mjs';
export function service(context){const scope=['production','deploy-preview','branch-deploy','dev'].includes(context?.deploy?.context)?context.deploy.context:'production';let ownership;return cloudService({deploymentId:context?.deploy?.id||null,getLease:()=>ownership||(ownership=stageLease(getDatabase())),getStorage:()=>getStore({name:'haunt-voice-'+scope,consistency:'strong'})})}
