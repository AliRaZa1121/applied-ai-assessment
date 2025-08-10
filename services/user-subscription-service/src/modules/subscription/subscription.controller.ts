import { Body, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiRouting } from 'src/core/decorators/api-controller.decorator';
import { AuthUser } from 'src/core/decorators/auth-user.decorator';
import { Authorized } from 'src/core/decorators/authorize.decorator';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import {
    BillingHistoryResponseDto,
    PaymentInitiationResponseDto,
    SubscriptionResponseDto,
    SubscriptionWithPlanResponseDto
} from './dto/subscription-response.dto';
import {
    CreateSubscriptionRequestDTO,
    UpgradeSubscriptionRequestDTO
} from './dto/subscription.dto';
import { ProcessWebhookDTO } from './dto/webhook.dto';
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
    ): Promise<BaseResponseDto<PaymentInitiationResponseDto>> {
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

    // @Post('/:subscriptionId/upgrade')
    // @Authorized()
    // @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
    // @ApiResponse({
    //     status: HttpStatus.OK,
    //     type: BaseResponseDto,
    //     description: 'Successfully upgraded subscription'
    // })
    // async upgradeSubscription(
    //     @AuthUser() user: User,
    //     @Param('subscriptionId') subscriptionId: string,
    //     @Body() data: UpgradeSubscriptionRequestDTO,
    // ): Promise<BaseResponseDto<PaymentInitiationResponseDto>> {
    //     return this._subscriptionService.upgradeSubscription(user.id, subscriptionId, data);
    // }

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

    @Post('/webhook')
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Successfully processed webhook'
    })
    async processWebhook(
        @Body() data: ProcessWebhookDTO,
    ): Promise<BaseResponseDto<void>> {
        return this._subscriptionService.processWebhook(data);
    }
}
