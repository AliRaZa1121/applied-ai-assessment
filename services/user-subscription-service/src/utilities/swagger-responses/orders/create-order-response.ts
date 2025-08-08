import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDTO } from './order-item.response';

export class CreateOrderResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty({ type: [OrderItemResponseDTO] })
    items: OrderItemResponseDTO[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    notes: string;

    @ApiProperty()
    orderSource: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
