export async function POST(){const res=Response.json({ok:true});res.headers.append('Set-Cookie','ngo_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');return res}
