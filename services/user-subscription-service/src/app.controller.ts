import { Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiRouting } from './core/decorators/api-controller.decorator';

@ApiRouting({ tag: 'App', path: '/' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
}
