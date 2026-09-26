import "dotenv/config";
import prisma from "../app/lib/prisma";

async function main() {
  for (let season = 2000; season <= 2026; season++) {
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const res = await fetch(
        `https://api.jolpi.ca/ergast/f1/${season}/qualifying.json?limit=100&offset=${offset}`,
      );
      const data = await res.json();

      total = parseInt(data.MRData.total);
      const races = data.MRData.RaceTable.Races;

      for (const raceData of races) {
        // 1. upsert Circuit using raceData.Circuit
        // 2. create Race using raceData (season, round, date, sessionType), linked to circuit.id
        const circuit = await prisma.circuit.upsert({
          where: { jolpicaCircuitId: raceData.Circuit.circuitId },
          update: {},
          create: {
            jolpicaCircuitId: raceData.Circuit.circuitId,
            name: raceData.Circuit.circuitName,
            location: `${raceData.Circuit.Location.locality}, ${raceData.Circuit.Location.country}`,
          },
        });
        const race = await prisma.race.upsert({
          where: {
            season_round_sessionType: {
              season: parseInt(raceData.season),
              round: parseInt(raceData.round),
              sessionType: "Qualifying",
            },
          },
          update: {},
          create: {
            circuitId: circuit.id,
            season: parseInt(raceData.season),
            round: parseInt(raceData.round),
            date: new Date(raceData.date),
            sessionType: "Qualifying",
          },
        });

        console.log(
          `Season ${season}, Round ${race.round} (${raceData.raceName}) — processing ${raceData.QualifyingResults.length} results...`,
        );

        for (const result of raceData.QualifyingResults) {
          // 3. upsert Driver using result.Driver
          // 4. upsert Team using result.Constructor
          // 5. create RaceResult using driver.id, race.id, team.id, result.position, result.points
          const driver = await prisma.driver.upsert({
            where: { jolpicaDriverId: result.Driver.driverId },
            update: {},
            create: {
              jolpicaDriverId: result.Driver.driverId,
              name: `${result.Driver.givenName} ${result.Driver.familyName}`,
              nationality: result.Driver.nationality,
            },
          });

          const team = await prisma.team.upsert({
            where: { jolpicaConstructorId: result.Constructor.constructorId },
            update: {},
            create: {
              jolpicaConstructorId: result.Constructor.constructorId,
              name: result.Constructor.name,
            },
          });

          await prisma.raceResult.upsert({
            where: {
              driverId_raceId: { driverId: driver.id, raceId: race.id },
            },
            update: {},
            create: {
              driverId: driver.id,
              raceId: race.id,
              teamId: team.id,
              placement: parseInt(result.position),
              points: 0,
            },
          });
        }
      }

      offset += 100;
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`Season ${season} complete.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
