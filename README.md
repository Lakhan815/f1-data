# F1 Data

An automated Formula 1 data pipeline on AWS. Scheduled Lambda functions pull race, sprint, and qualifying results from the public Jolpica API into a PostgreSQL database on RDS, so the data stays current without any manual runs.

I built this to learn system design hands-on: it deliberately uses raw AWS infrastructure (RDS, ECR, Lambda, IAM, EventBridge Scheduler, security groups) instead of a managed backend like Supabase, which hides most of that work.

> **Status:** the ingestion pipeline is live and running on a schedule. The web frontend, authentication, and favorites feature are still in progress (see the roadmap).

## Architecture

```mermaid
flowchart LR
    S[EventBridge Scheduler<br/>Mon + Thu, 12:00 ET] --> L[AWS Lambda<br/>container image]
    L -->|fetch results| J[Jolpica API]
    L -->|upsert| R[(PostgreSQL on RDS)]
    E[ECR] -. image .-> L
```

1. **EventBridge Scheduler** fires twice a week (Monday and Thursday), which catches new race results and any post-race penalty corrections that land a few days later.
2. A **Lambda function packaged as a container image** fetches the current season from the Jolpica API, paging through results.
3. It **upserts** circuits, drivers, teams, races, and results into **PostgreSQL on RDS** through Prisma 7.

## Data

- **Coverage:** 2000 to present (Grand Prix and qualifying), sprint races from 2021.
- **Volume:** roughly 520 Grand Prix races, 29 sprints, 470 qualifying sessions, 21,000+ result rows, 130 drivers, 40 teams.
- **Source:** [Jolpica F1 API](https://github.com/jolpica/jolpica-f1), the maintained successor to the retired Ergast API.

Some older seasons have no qualifying data in the source API. The schema allows for this rather than assuming every race has every session type.

## Schema

| Table | Purpose |
|---|---|
| `Circuit`, `Team`, `Driver` | Core entities, each with a unique Jolpica ID stored for safe upserts |
| `Race` | One row per season, round, and session type (Grand Prix, Sprint, Qualifying) |
| `RaceResult` | A driver's finishing position and points for one race, with the team they drove for at that time |
| `User`, `FavoriteTeam`, `FavoriteDriver` | Planned favorites feature, using composite primary keys on the junction tables |

Design choices worth noting:

- **Point-in-time facts get their own rows.** A driver's team changes between seasons, so team assignment lives on `RaceResult`, not on `Driver`.
- **Upserts are keyed on external IDs and unique constraints**, never on mutable fields like names, so the ingestion is idempotent and safe to re-run.
- **Points come from the API** instead of a custom scoring engine, which already handles sprint scoring and fastest-lap rules correctly.

## Tech stack

- **Language and runtime:** TypeScript, Node.js 20
- **Database:** PostgreSQL on AWS RDS, accessed through Prisma 7 with the `pg` driver adapter
- **Compute and scheduling:** AWS Lambda (container images), EventBridge Scheduler
- **Packaging:** Docker, Amazon ECR, esbuild
- **Planned frontend:** Next.js, React

## Why these decisions

- **RDS over Supabase.** This project's goal was learning infrastructure. RDS meant working with VPCs, route tables and internet gateways, security groups, and IAM directly.
- **Container images over zip packaging.** Prisma ships a native query-engine binary that must match the OS it runs on. Building inside the AWS Lambda base image guarantees the generated binary matches the runtime.
- **esbuild bundling.** Each ingestion script is bundled into a single ESM file, with `@prisma/client` kept external so its native binary stays in `node_modules`.
- **Lambda outside the VPC.** A NAT gateway costs about $30 a month, which is not worth it for a twice-weekly job. The tradeoff is that the database accepts connections from the internet and relies on credentials plus TLS (see known limitations).

## Project structure

```
scripts/        Ingestion handlers (Grand Prix, Sprint, Qualifying)
app/lib/        Shared Prisma client
prisma/         Schema and migrations
docker/         One Dockerfile per Lambda function
```

## Running locally

1. Install dependencies: `npm install`
2. Create a `.env` file:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
   DB_CA_PATH=certs/global-bundle.pem
   ```
3. Download the AWS RDS CA bundle into `certs/` from `https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem`
4. Generate the client and apply migrations: `npx prisma generate` and `npx prisma migrate deploy`
5. Run an ingestion handler through a small wrapper, or invoke it directly with `tsx`.

## Deploying a Lambda

```bash
docker build --provenance=false --platform linux/amd64 -f docker/gp.Dockerfile -t f1-ingest-gp .
docker tag f1-ingest-gp:latest <account>.dkr.ecr.<region>.amazonaws.com/<repo>:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/<repo>:latest
```

Then deploy the new image on the Lambda function and set `DATABASE_URL` (and `DB_CA_PATH`) as environment variables.

## Known limitations

- The ingestion handler currently logs errors without failing the invocation, so a broken run can look like a success. A fix is planned.
- Certificate verification against the RDS CA bundle works locally; deploying it to the Lambda function is in progress.
- The database is reachable from the public internet and relies on a strong role password. This should be revisited before user accounts ship.
- The sprint and qualifying ingestion functions exist as scripts but are not yet deployed as scheduled Lambdas.

## Roadmap

- [x] Schema design and RDS setup
- [x] Historical ingestion (2000 to present)
- [x] Containerized Lambda with scheduled ingestion for Grand Prix results
- [ ] TLS certificate verification on Lambda, least-privilege database role
- [ ] Deploy sprint and qualifying Lambdas
- [ ] Next.js frontend: standings, race results, driver and team history
- [ ] Authentication and favorite drivers and teams
- [ ] Stretch: lap-level telemetry data
