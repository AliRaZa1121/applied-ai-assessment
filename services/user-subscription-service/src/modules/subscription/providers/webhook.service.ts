import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';

@Injectable()
export default class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly _databaseService: DatabaseService) { }

}
