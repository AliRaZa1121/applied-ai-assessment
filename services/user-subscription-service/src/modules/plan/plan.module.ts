import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { PaymentModule } from 'src/apps/payment/payment.module';

@Module({
    imports: [PaymentModule],
    controllers: [PlanController],
    providers: [PlanService],
    exports: [PlanService],
})
export default class PlanModule { }
