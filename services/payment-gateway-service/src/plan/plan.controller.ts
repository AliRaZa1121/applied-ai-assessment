import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import type { PlanCreateInterface } from 'src/utilities/interfaces/plan-create-interface';
import type { PlanUpdateInterface } from 'src/utilities/interfaces/plan-update-interface';
import { PlanService } from './plan.service';

@Injectable()
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PLAN)
    async createPlan(@Payload() planData: PlanCreateInterface): Promise<string> {
        console.log('PlanController: Creating plan:', planData);
        return await this.planService.createPlan(planData);
    }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_PLAN)
    async updatePlan(@Payload() data:  PlanUpdateInterface): Promise<boolean> {
        const { planId } = data; 
        return await this.planService.updatePlan(planId, data);
    }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.DELETE_PLAN)
    async deletePlan(planId: string): Promise<boolean> {
        console.log('PlanController: Deleting plan:', planId);
        return await this.planService.deletePlan(planId);
    }
}
