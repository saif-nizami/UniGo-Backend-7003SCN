import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/user.module';
import { User } from './users/user.entity';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,     // EC2 public IP
      port: 5432,
      username: process.env.DB_USER, // appuser
      password: process.env.DB_PASS,
      database: process.env.DB_NAME, // myappdb
      entities: [User],
      synchronize: true,             // auto-create tables (dev only!)
    }),
    UsersModule,
  ],
})

export class AppModule {}
