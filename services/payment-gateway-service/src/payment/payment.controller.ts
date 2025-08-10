import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import type { PlanCreateInterface } from 'src/utilities/interfaces/plan-create-interface';
import type { PlanUpdateInterface } from 'src/utilities/interfaces/plan-update-interface';
import { PaymentService } from './payment.service';


@Injectable()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }


    // =====================================
    // PLAN MANAGEMENT
    // =====================================

    /** 
    * Create a new plan
    * Called by user-subscription service to create a new subscription plan
    */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PLAN)
    async createPlan(@Payload() planData: PlanCreateInterface): Promise<string> {
        console.log('PaymentController: Creating plan:', planData);
        return await this.paymentService.createPlan(planData);
    }

    /**
     * Update an existing plan
     * Called by user-subscription service to update a subscription plan
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_PLAN)
    async updatePlan(planId: string, planData: PlanUpdateInterface): Promise<boolean> {
        console.log('PaymentController: Updating plan:', planId, planData);
        return await this.paymentService.updatePlan(planId, planData);
    }

    /**
     * Delete a plan
     * Called by user-subscription service to delete a subscription plan
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.DELETE_PLAN)
    async deletePlan(planId: string): Promise<boolean> {
        console.log('PaymentController: Deleting plan:', planId);
        return await this.paymentService.deletePlan(planId);
    }
}
