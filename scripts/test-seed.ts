import "dotenv/config";
import prisma from "../app/lib/prisma";

async function main() {
  const circuit = await prisma.circuit.create({
    data: {
      name: "Autodromo Nazionale Monza",
      location: "Monza, Italy",
    },
  });

  const team = await prisma.team.create({ data: { name: "Ferrari" } });

  const driver = await prisma.driver.create({
    data: { name: "Charles Leclerc", nationality: "Monegasque" },
  });

  const race = await prisma.race.create({
    data: {
      circuitId: circuit.id,
      season: 2024,
      round: 16,
      date: new Date("2024-09-01"),
      sessionType: "Grand Prix",
    },
  });

  const raceResult = await prisma.raceResult.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      driverId: driver.id,
      placement: 1,
      points: 25,
    },
  });

  console.log("Seed complete:", { circuit, team, driver, race, raceResult });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
