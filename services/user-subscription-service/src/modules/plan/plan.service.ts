import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PaymentService } from 'src/apps/payment/payment.service';
import DatabaseService from 'src/database/database.service';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import { CreatePlanRequestDTO, UpdatePlanRequestDTO } from '../subscription/dto';
import { PlanListFilterDto } from './dto/plan-list-filter.dto';
import { PlanResponseDto } from './dto/plan-response.dto';

@Injectable()
export class PlanService {

    constructor(
        private readonly _databaseService: DatabaseService,
        private readonly _paymentService: PaymentService
    ) { }

    async createPlan(data: CreatePlanRequestDTO): Promise<BaseResponseDto<PlanResponseDto>> {
        // Check if plan name already exists
        const existingPlan = await this._databaseService.plan.findUnique({
            where: { name: data.name }
        });

        if (existingPlan) {
            throw new BadRequestException('Plan with this name already exists');
        }

        // db transaction to ensure atomicity
        const plan = await this._databaseService.$transaction(async (prisma) => {
            try {
                // Create plan in the database
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

                console.log('✅ Plan created in database:', newPlan.id);

                // Create plan in the payment gateway
                console.log('🔄 Creating plan in payment gateway...');
                let gatewayPlanId: string;

                try {

                    gatewayPlanId = await this._paymentService.createPlan({
                        name: newPlan.name,
                        price: newPlan.price,
                        currency: newPlan.currency,
                        billingInterval: newPlan.billingInterval,
                    });

                    console.log('✅ Plan created in payment gateway:', gatewayPlanId);
                } catch (gatewayError) {
                    console.error('❌ Failed to create plan in payment gateway:', gatewayError);

                    // The transaction will automatically rollback the database plan creation
                    // because we're throwing an error inside the transaction
                    throw new Error(`Failed to create plan in payment gateway: ${gatewayError.message || gatewayError}`);
                }

                // Update the plan with the gateway ID
                const updatedPlan = await prisma.plan.update({
                    where: { id: newPlan.id },
                    data: { gatewayPlanId }
                });

                console.log('✅ Plan creation completed successfully');
                return updatedPlan;

            } catch (error) {
                console.error('❌ Plan creation failed, transaction will rollback:', error);
                throw error; // This will cause the transaction to rollback
            }
        });

        return successApiWrapper(
            plan,
            'Plan created successfully',
            201
        );

    }

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

        // Build where clause for filtering
        const where: any = {};

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (billingInterval) {
            where.billingInterval = billingInterval;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        if (currency) {
            where.currency = currency;
        }

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive'
            };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build order by clause
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        const [plans, total] = await Promise.all([
            this._databaseService.plan.findMany({
                where,
                orderBy,
                skip,
                take: limit
            }),
            this._databaseService.plan.count({ where })
        ]);

        return successApiWrapper(
            plans,
            `Plans retrieved successfully. Total: ${total}, Page: ${page}/${Math.ceil(total / limit)}`,
            200
        );
    }

    async getPlanById(planId: string): Promise<BaseResponseDto<PlanResponseDto>> {
        const plan = await this._databaseService.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        return successApiWrapper(
            plan,
            'Plan retrieved successfully',
            200
        );

    }

    async updatePlan(planId: string, data: UpdatePlanRequestDTO): Promise<BaseResponseDto<PlanResponseDto>> {

        const existingPlan = await this._databaseService.plan.findUnique({
            where: { id: planId }
        });

        if (!existingPlan) {
            throw new NotFoundException('Plan not found');
        }

        // Check if name is being updated and if it already exists
        if (data.name && data.name !== existingPlan.name) {
            const planWithSameName = await this._databaseService.plan.findUnique({
                where: { name: data.name }
            });

            if (planWithSameName) {
                throw new BadRequestException('Plan with this name already exists');
            }
        }

        // db transaction to ensure atomicity
        const updatedPlan = await this._databaseService.$transaction(async (prisma) => {
            try {
                // Update plan in the database
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

                console.log('✅ Plan updated in database:', planInDb.id);

                // Update plan in the payment gateway if gatewayPlanId exists
                if (existingPlan.gatewayPlanId) {
                    console.log('🔄 Updating plan in payment gateway...');
                    
                    try {
                        const gatewaySuccess = await this._paymentService.updatePlan({
                            name: planInDb.name,
                            description: planInDb.description || undefined,
                            price: planInDb.price,
                            currency: planInDb.currency,
                            billingInterval: planInDb.billingInterval,
                            planId: existingPlan.gatewayPlanId
                        });

                        console.log('✅ Plan updated in payment gateway:', gatewaySuccess);
                    } catch (gatewayError) {
                        console.error('❌ Failed to update plan in payment gateway:', gatewayError);
                        
                        // The transaction will automatically rollback the database plan update
                        // because we're throwing an error inside the transaction
                        throw new Error(`Failed to update plan in payment gateway: ${gatewayError.message || gatewayError}`);
                    }
                } else {
                    console.log('⚠️ No gatewayPlanId found, skipping payment gateway update');
                }

                console.log('✅ Plan update completed successfully');
                return planInDb;

            } catch (error) {
                console.error('❌ Plan update failed, transaction will rollback:', error);
                throw error; // This will cause the transaction to rollback
            }
        });

        return successApiWrapper(
            updatedPlan,
            'Plan updated successfully',
            200
        );
    }

    async deletePlan(planId: string): Promise<BaseResponseDto<void>> {
        const existingPlan = await this._databaseService.plan.findUnique({
            where: { id: planId }
        });

        if (!existingPlan) {
            throw new NotFoundException('Plan not found');
        }

        // Check if plan has active subscriptions
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

        // db transaction to ensure atomicity
        await this._databaseService.$transaction(async (prisma) => {
            try {
                // Delete plan from the payment gateway first if gatewayPlanId exists
                if (existingPlan.gatewayPlanId) {
                    console.log('🔄 Deleting plan from payment gateway...');
                    
                    try {
                        const gatewaySuccess = await this._paymentService.deletePlan(existingPlan.gatewayPlanId);
                        console.log('✅ Plan deleted from payment gateway:', gatewaySuccess);
                    } catch (gatewayError) {
                        console.error('❌ Failed to delete plan from payment gateway:', gatewayError);
                        
                        // The transaction will automatically rollback the database plan deletion
                        // because we're throwing an error inside the transaction
                        throw new Error(`Failed to delete plan from payment gateway: ${gatewayError.message || gatewayError}`);
                    }
                } else {
                    console.log('⚠️ No gatewayPlanId found, skipping payment gateway deletion');
                }

                // Delete plan from the database
                await prisma.plan.delete({
                    where: { id: planId }
                });

                console.log('✅ Plan deleted from database:', planId);
                console.log('✅ Plan deletion completed successfully');

            } catch (error) {
                console.error('❌ Plan deletion failed, transaction will rollback:', error);
                throw error; // This will cause the transaction to rollback
            }
        });

        return successApiWrapper(
            null,
            'Plan deleted successfully',
            200
        );

    }
}
