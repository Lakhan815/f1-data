import "dotenv/config";
import prisma from "../app/lib/prisma";

async function main() {
  const count = await prisma.race.count();
  console.log(`Connected with certificate verification. Race rows: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
