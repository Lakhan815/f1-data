FROM public.ecr.aws/lambda/nodejs:20
WORKDIR /var/task
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build:sprint
CMD ["dist/sprint/index.handler"]