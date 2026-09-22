import { Global, Module } from '@nestjs/common';

import { PaginationService } from './services/pagination.service.js';
import { SortingService } from './services/sorting.service.js';
import { FilteringService } from './services/filtering.service.js';
import { SearchingService } from './services/searching.service.js';

@Global()
@Module({
  providers: [
    PaginationService,
    SortingService,
    FilteringService,
    SearchingService,
  ],
  exports: [
    PaginationService,
    SortingService,
    FilteringService,
    SearchingService,
  ],
})
export class CommonModule {}
