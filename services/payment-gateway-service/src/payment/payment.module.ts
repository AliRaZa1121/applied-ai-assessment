import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    controllers: [],
    providers: [PaymentController, PaymentService],
    exports: [PaymentController, PaymentService],
})
export class PaymentModule {}
