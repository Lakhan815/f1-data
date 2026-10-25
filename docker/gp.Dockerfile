FROM public.ecr.aws/lambda/nodejs:20
WORKDIR /var/task
COPY package.json package-lock.json ./
RUN npm install
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /var/task/certs/global-bundle.pem
COPY . .
RUN npx prisma generate
RUN npm run build:gp
CMD ["dist/gp/index.handler"]