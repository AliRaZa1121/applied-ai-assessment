import { Body, Get, HttpStatus, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiRouting } from 'src/core/decorators/api-controller.decorator';
import { AuthUser } from 'src/core/decorators/auth-user.decorator';
import { Authorized } from 'src/core/decorators/authorize.decorator';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import { DummyWebhookData } from 'src/utilities/interfaces/webhook-interface';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import {
    SubscriptionResponseDto,
    SubscriptionWithPlanResponseDto
} from './dto/subscription-response.dto';
import {
    CreateSubscriptionRequestDTO,
    UpdateSubscriptionRequestDTO
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

    @Get('/update-subscription')
    @Authorized()   
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Successfully updated subscription'
    })
    async updateSubscription(
        @AuthUser() user: User,
        @Body() data: UpdateSubscriptionRequestDTO,
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        return this._subscriptionService.updateSubscription(user.id, data);
    }

    @Post('/cancel-subscription')
    @Authorized()
    @ApiResponse({
        status: HttpStatus.OK,
        type: BaseResponseDto,
        description: 'Successfully canceled subscription'
    })
    async cancelSubscription(
        @AuthUser() user: User,
    ): Promise<BaseResponseDto<void>> {
        return this._subscriptionService.cancelSubscription(user.id);
    }

    // =====================================
    // WEBHOOK HANDLING
    // =====================================

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.CREATE_SUBSCRIPTION)
    async createSubscriptionHandler(@Payload() data: DummyWebhookData): Promise<any> {
        return await this._webhookService.createSubscriptionHandler(data);
    }
}
