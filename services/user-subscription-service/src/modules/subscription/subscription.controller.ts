import { Body, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiRouting } from 'src/core/decorators/api-controller.decorator';
import { AuthUser } from 'src/core/decorators/auth-user.decorator';
import { Authorized } from 'src/core/decorators/authorize.decorator';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import { DummyWebhookData } from 'src/utilities/interfaces/webhook-interface';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import {
    BillingHistoryResponseDto,
    SubscriptionResponseDto,
    SubscriptionWithPlanResponseDto
} from './dto/subscription-response.dto';
import {
    CreateSubscriptionRequestDTO
} from './dto/subscription.dto';
import WebhookService from './providers/webhook.service';
import SubscriptionService from './subscription.service';

@ApiRouting({ tag: 'Subscription Management', path: '/subscriptions' })
export default class SubscriptionController {
    constructor(
        private _subscriptionService: SubscriptionService,
        private _webhookService: WebhookService
    ) { }

    // =====================================
    // SUBSCRIPTION MANAGEMENT
    // =====================================

    @Post('/create')
    @Authorized()
    @ApiResponse({
        status: HttpStatus.CREATED,
        type: BaseResponseDto,
        description: 'Successfully created subscription'
    })
    async createSubscription(
        @AuthUser() user: User,
        @Body() data: CreateSubscriptionRequestDTO,
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        return this._subscriptionService.createSubscription(user.id, data);
    }

    @Get('/my-subscriptions')
    @Authorized()
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Retrieved user subscriptions'
    })
    async getUserSubscriptions(
        @AuthUser() user: User,
    ): Promise<BaseResponseDto<SubscriptionWithPlanResponseDto[]>> {
        return this._subscriptionService.getUserSubscriptions(user.id);
    }

    @Get('/active')
    @Authorized()
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Retrieved active subscription'
    })
    async getActiveSubscription(
        @AuthUser() user: User,
    ): Promise<BaseResponseDto<SubscriptionWithPlanResponseDto | null>> {
        return this._subscriptionService.getActiveSubscription(user.id);
    }

    @Post('/:subscriptionId/cancel')
    @Authorized()
    @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Successfully canceled subscription'
    })
    async cancelSubscription(
        @AuthUser() user: User,
        @Param('subscriptionId') subscriptionId: string,
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        return this._subscriptionService.cancelSubscription(user.id, subscriptionId);
    }

    // =====================================
    // BILLING & REPORTING
    // =====================================

    @Get('/billing-history')
    @Authorized()
    @ApiQuery({ name: 'subscriptionId', required: false, description: 'Filter by subscription ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Retrieved billing history'
    })
    async getBillingHistory(
        @AuthUser() user: User,
        @Query('subscriptionId') subscriptionId?: string,
    ): Promise<BaseResponseDto<BillingHistoryResponseDto[]>> {
        return this._subscriptionService.getBillingHistory(user.id, subscriptionId);
    }

    // =====================================
    // WEBHOOK HANDLING
    // =====================================

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.CREATE_SUBSCRIPTION)
    async createSubscriptionHandler(@Payload() data: DummyWebhookData): Promise<any> {
        return await this._webhookService.createSubscriptionHandler(data);
    }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.UPDATE_SUBSCRIPTION)
    async updateSubscriptionHandler(@Payload() data: DummyWebhookData): Promise<any> {
        return await this._webhookService.updateSubscriptionHandler(data);
    }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.CANCEL_SUBSCRIPTION)
    async cancelSubscriptionHandler(@Payload() data: DummyWebhookData): Promise<any> {
        return await this._webhookService.cancelSubscriptionHandler(data);
    }
}
