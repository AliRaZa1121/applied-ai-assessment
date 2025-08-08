import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import { CreatePlanRequestDTO, UpdatePlanRequestDTO } from '../subscription/dto';
import { PlanListFilterDto } from './dto/plan-list-filter.dto';
import { PlanResponseDto } from './dto/plan-response.dto';

@Injectable()
export class PlanService {
    constructor(private readonly _databaseService: DatabaseService) { }

    async createPlan(data: CreatePlanRequestDTO): Promise<BaseResponseDto<PlanResponseDto>> {
        // Check if plan name already exists
        const existingPlan = await this._databaseService.plan.findUnique({
            where: { name: data.name }
        });

        if (existingPlan) {
            throw new BadRequestException('Plan with this name already exists');
        }

        const plan = await this._databaseService.plan.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                currency: data.currency || 'USD',
                billingInterval: data.billingInterval,
                trialDays: data.trialDays || 0,
                features: data.features || [],
                isActive: data.isActive !== undefined ? data.isActive : true,
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
            minTrialDays,
            maxTrialDays,
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

        if (minTrialDays !== undefined || maxTrialDays !== undefined) {
            where.trialDays = {};
            if (minTrialDays !== undefined) where.trialDays.gte = minTrialDays;
            if (maxTrialDays !== undefined) where.trialDays.lte = maxTrialDays;
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

        const updatedPlan = await this._databaseService.plan.update({
            where: { id: planId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.currency && { currency: data.currency }),
                ...(data.billingInterval && { billingInterval: data.billingInterval }),
                ...(data.trialDays !== undefined && { trialDays: data.trialDays }),
                ...(data.features && { features: data.features }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
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
                        SubscriptionStatus.TRIALING,
                        SubscriptionStatus.PENDING,
                        SubscriptionStatus.PAST_DUE
                    ]
                }
            }
        });

        if (activeSubscriptions) {
            throw new BadRequestException('Cannot delete plan with active subscriptions');
        }

        await this._databaseService.plan.delete({
            where: { id: planId }
        });

        return successApiWrapper(
            null,
            'Plan deleted successfully',
            200
        );

    }
}
