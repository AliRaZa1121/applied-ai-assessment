import { Module } from '@nestjs/common';
import { UserSubscriptionModule } from 'src/apps/user-subscription/user-subscription.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    imports: [UserSubscriptionModule],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
