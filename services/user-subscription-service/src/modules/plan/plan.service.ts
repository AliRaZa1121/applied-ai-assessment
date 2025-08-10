import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PaymentIntegrationService } from 'src/apps/payment-integration/payment-integration.service';
import DatabaseService from 'src/database/database.service';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import { CreatePlanRequestDTO } from './dto/create-plan.dto';
import { PlanListFilterDto } from './dto/plan-list-filter.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { UpdatePlanRequestDTO } from './dto/update-plan.dto';

@Injectable()
export class PlanService {
    constructor(
        private readonly _databaseService: DatabaseService,
        private readonly _paymentService: PaymentIntegrationService
    ) {}

    /**
     * Create a plan in the local database and payment gateway.
     * Rolls back the DB transaction if gateway creation fails.
     */
    async createPlan(data: CreatePlanRequestDTO): Promise<BaseResponseDto<PlanResponseDto>> {
        const existingPlan = await this._databaseService.plan.findUnique({
            where: { name: data.name }
        });
        if (existingPlan) {
            throw new BadRequestException('Plan with this name already exists');
        }

        const plan = await this._databaseService.$transaction(async (prisma) => {
            const newPlan = await prisma.plan.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    currency: data.currency,
                    billingInterval: data.billingInterval,
                    features: data.features,
                    isActive: data.isActive,
                }
            });

            let gatewayPlanId: string;
            try {
                gatewayPlanId = await this._paymentService.createPlan({
                    name: newPlan.name,
                    price: newPlan.price,
                    currency: newPlan.currency,
                    billingInterval: newPlan.billingInterval,
                });
            } catch (gatewayError) {
                throw new Error(`Failed to create plan in payment gateway: ${gatewayError.message || gatewayError}`);
            }

            return prisma.plan.update({
                where: { id: newPlan.id },
                data: { gatewayPlanId }
            });
        });

        return successApiWrapper(plan, 'Plan created successfully', 201);
    }

    /**
     * Get a paginated and filtered list of plans.
     */
    async getPlans(query: PlanListFilterDto): Promise<BaseResponseDto<PlanResponseDto[]>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            isActive,
            billingInterval,
            minPrice,
            maxPrice,
            currency,
            name,
        } = query;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive;
        if (billingInterval) where.billingInterval = billingInterval;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }
        if (currency) where.currency = currency;
        if (name) where.name = { contains: name, mode: 'insensitive' };

        const skip = (page - 1) * limit;
        const orderBy = { [sortBy]: sortOrder };

        const [plans, total] = await Promise.all([
            this._databaseService.plan.findMany({ where, orderBy, skip, take: limit }),
            this._databaseService.plan.count({ where })
        ]);

        return successApiWrapper(
            plans,
            `Plans retrieved successfully. Total: ${total}, Page: ${page}/${Math.ceil(total / limit)}`,
            200
        );
    }

    /**
     * Retrieve a single plan by ID.
     */
    async getPlanById(planId: string): Promise<BaseResponseDto<PlanResponseDto>> {
        const plan = await this._databaseService.plan.findUnique({
            where: { id: planId }
        });
        if (!plan) {
            throw new NotFoundException('Plan not found');
        }
        return successApiWrapper(plan, 'Plan retrieved successfully', 200);
    }

    /**
     * Update a plan in the local database and payment gateway.
     * Rolls back if gateway update fails.
     */
    async updatePlan(planId: string, data: UpdatePlanRequestDTO): Promise<BaseResponseDto<PlanResponseDto>> {
        const existingPlan = await this._databaseService.plan.findUnique({
            where: { id: planId }
        });
        if (!existingPlan) {
            throw new NotFoundException('Plan not found');
        }

        if (data.name && data.name !== existingPlan.name) {
            const planWithSameName = await this._databaseService.plan.findUnique({
                where: { name: data.name }
            });
            if (planWithSameName) {
                throw new BadRequestException('Plan with this name already exists');
            }
        }

        const updatedPlan = await this._databaseService.$transaction(async (prisma) => {
            const planInDb = await prisma.plan.update({
                where: { id: planId },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.price !== undefined && { price: data.price }),
                    ...(data.currency && { currency: data.currency }),
                    ...(data.billingInterval && { billingInterval: data.billingInterval }),
                    ...(data.features && { features: data.features }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                }
            });

            if (existingPlan.gatewayPlanId) {
                try {
                    await this._paymentService.updatePlan({
                        name: planInDb.name,
                        description: planInDb.description || undefined,
                        price: planInDb.price,
                        currency: planInDb.currency,
                        billingInterval: planInDb.billingInterval,
                        planId: existingPlan.gatewayPlanId
                    });
                } catch (gatewayError) {
                    throw new Error(`Failed to update plan in payment gateway: ${gatewayError.message || gatewayError}`);
                }
            }
            return planInDb;
        });

        return successApiWrapper(updatedPlan, 'Plan updated successfully', 200);
    }

    /**
     * Delete a plan from both the local database and payment gateway.
     * Prevents deletion if active subscriptions exist.
     */
    async deletePlan(planId: string): Promise<BaseResponseDto<void>> {
        const existingPlan = await this._databaseService.plan.findUnique({
            where: { id: planId }
        });
        
        if (!existingPlan) {
            throw new NotFoundException('Plan not found');
        }


        const activeSubscriptions = await this._databaseService.subscription.findFirst({
            where: {
                planId,
                status: {
                    in: [
                        SubscriptionStatus.ACTIVE,
                        SubscriptionStatus.PENDING,
                        SubscriptionStatus.PAST_DUE
                    ]
                }
            }
        });
        if (activeSubscriptions) {
            throw new BadRequestException('Cannot delete plan with active subscriptions');
        }

        await this._databaseService.$transaction(async (prisma) => {
            if (existingPlan.gatewayPlanId) {
                try {
                    await this._paymentService.deletePlan(existingPlan.gatewayPlanId);
                } catch (gatewayError) {
                    throw new Error(`Failed to delete plan from payment gateway: ${gatewayError.message || gatewayError}`);
                }
            }
            await prisma.plan.delete({ where: { id: planId } });
        });

        return successApiWrapper(null, 'Plan deleted successfully', 200);
    }
}
