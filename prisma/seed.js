const { PrismaClient, Role, EventStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('ChangeThisPassword123!', 12);
  const admin = await prisma.user.upsert({ where:{email:'admin@example.org'}, update:{}, create:{name:'Programme Administrator',email:'admin@example.org',passwordHash:hash,role:Role.ADMIN} });
  const volunteer = await prisma.user.upsert({ where:{email:'volunteer@example.org'}, update:{}, create:{name:'Community Volunteer',email:'volunteer@example.org',passwordHash:hash,role:Role.VOLUNTEER} });
  const event = await prisma.event.upsert({ where:{slug:'community-health-camp'}, update:{}, create:{name:'Community Health Camp',slug:'community-health-camp',description:'A free community health awareness and screening day led by local partners.',category:'Health',date:new Date('2026-10-15T00:00:00Z'),startTime:'09:00',endTime:'15:00',venue:'Community Hall',address:'12 Service Road',capacity:150,registrationOpen:new Date('2026-09-01'),registrationClose:new Date('2026-10-14T18:00:00Z'),status:EventStatus.OPEN,partnerOrganization:'Local Health Network',createdById:admin.id} });
  await prisma.eventVolunteer.upsert({where:{eventId_userId:{eventId:event.id,userId:volunteer.id}},update:{},create:{eventId:event.id,userId:volunteer.id}});
}
main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e);prisma.$disconnect();process.exit(1)});
