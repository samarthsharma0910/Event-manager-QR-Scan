import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
const key = new TextEncoder().encode(process.env.SESSION_SECRET || 'development-secret-change-before-production');
export async function createSession(user) { return new SignJWT({ role:user.role, name:user.name }).setProtectedHeader({alg:'HS256'}).setSubject(user.id).setIssuedAt().setExpirationTime('8h').sign(key); }
export async function getSession() { const token = (await cookies()).get('ngo_session')?.value; if(!token) return null; try { const {payload}=await jwtVerify(token,key); return {id:payload.sub,role:payload.role,name:payload.name}; } catch { return null; } }
export async function requireStaff(roles) { const session=await getSession(); if(!session) return {error:'Authentication required',status:401}; if(roles && !roles.includes(session.role)) return {error:'You do not have permission to perform this action',status:403}; return {session}; }
export async function canAccessEvent(session,eventId) { if(session.role==='ADMIN') return true; return !!await prisma.eventVolunteer.findUnique({where:{eventId_userId:{eventId,userId:session.id}}}); }
