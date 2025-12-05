import { Module } from '@nestjs/common';
import { MiscController } from './misc.controller';
import { MiscService } from './misc.service';

@Module({
  controllers: [MiscController],
  providers: [MiscService],
  exports: [MiscService], // optional if you want to use it elsewhere
})
export class MiscModule {}