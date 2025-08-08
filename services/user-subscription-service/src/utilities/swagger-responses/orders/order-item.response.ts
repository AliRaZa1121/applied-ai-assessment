import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDTO {
    @ApiProperty()
    productId: string;

    @ApiProperty()
    quantity: number;

    @ApiProperty()
    price: number;
}
