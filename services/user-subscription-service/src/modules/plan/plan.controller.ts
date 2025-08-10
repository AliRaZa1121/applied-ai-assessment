import { Body, Delete, Get, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiRouting } from 'src/core/decorators/api-controller.decorator';
import { Authorized } from 'src/core/decorators/authorize.decorator';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import { PlanListFilterDto } from './dto/plan-list-filter.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { UpdatePlanRequestDTO } from './dto/update-plan.dto';
import { PlanService } from './plan.service';
import { CreatePlanRequestDTO } from './dto/create-plan.dto';

@ApiRouting({ tag: 'Plan Management', path: '/plans' })
export class PlanController {
    constructor(private _planService: PlanService) { }

    @Post('/')
    @Authorized()
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Plan created successfully',
        type: BaseResponseDto<PlanResponseDto>
    })
    createPlan(
        @Body() data: CreatePlanRequestDTO,
    ): Promise<BaseResponseDto<PlanResponseDto>> {
        return this._planService.createPlan(data);
    }

    @Get('/')
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Plans retrieved successfully',
        type: BaseResponseDto<PlanResponseDto[]>
    })
    getPlans(
        @Query() query: PlanListFilterDto,
    ): Promise<BaseResponseDto<PlanResponseDto[]>> {
        return this._planService.getPlans(query);
    }

    @Get('/:planId')
    @ApiParam({ name: 'planId', description: 'Plan ID', example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Plan retrieved successfully',
        type: BaseResponseDto<PlanResponseDto>
    })
    getPlanById(
        @Param('planId') planId: string,
    ): Promise<BaseResponseDto<PlanResponseDto>> {
        return this._planService.getPlanById(planId);
    }

    @Put('/:planId')
    @Authorized()
    @ApiParam({ name: 'planId', description: 'Plan ID', example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Plan updated successfully',
        type: BaseResponseDto<PlanResponseDto>
    })
    updatePlan(
        @Param('planId') planId: string,
        @Body() data: UpdatePlanRequestDTO,
    ): Promise<BaseResponseDto<PlanResponseDto>> {
        return this._planService.updatePlan(planId, data);
    }

    @Delete('/:planId')
    @Authorized()
    @ApiParam({ name: 'planId', description: 'Plan ID', example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Plan deleted successfully',
        type: BaseResponseDto<void>
    })
    deletePlan(
        @Param('planId') planId: string,
    ): Promise<BaseResponseDto<void>> {
        return this._planService.deletePlan(planId);
    }
}
