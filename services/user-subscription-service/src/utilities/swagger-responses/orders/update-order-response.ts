import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDTO } from './order-item.response';

export class UpdateOrderResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty({ type: [OrderItemResponseDTO] })
    items: OrderItemResponseDTO[];

    @ApiProperty()
    status: string;

    @ApiProperty()
    notes: string;

    @ApiProperty()
    orderSource: string;

    @ApiProperty()
    total: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
