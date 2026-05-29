import { NestFactory } from '@nestjs/core'
import { ValidationPipe, BadRequestException } from '@nestjs/common'
import type { ValidationError } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'

function flattenErrors(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap((e) => {
    const field = prefix ? `${prefix}.${e.property}` : e.property
    const own = Object.values(e.constraints ?? {}).map((msg) => `${field} ${msg}`)
    const nested = e.children?.length ? flattenErrors(e.children, field) : []
    return [...own, ...nested]
  })
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(flattenErrors(errors)),
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
