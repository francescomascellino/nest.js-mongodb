import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      // I payload sono oggetti JS. Abilitiamo la trasformazione automatica globale per tipicizzare questi oggetti in base alla loro classe DTO
      transform: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
