import crypto from 'crypto';
export const qrToken=()=>crypto.randomBytes(32).toString('base64url');
export const slugify=(value)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
export function jsonError(message,status=400,fields){return Response.json({error:message,...(fields?{fields}:{})},{status});}
