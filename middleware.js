import {NextResponse} from 'next/server';
export function middleware(request){if(request.nextUrl.pathname.startsWith('/dashboard')&&!request.cookies.get('ngo_session'))return NextResponse.redirect(new URL('/login',request.url));return NextResponse.next()}
export const config={matcher:['/dashboard/:path*']};
