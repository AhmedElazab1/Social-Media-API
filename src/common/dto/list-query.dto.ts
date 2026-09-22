import { IntersectionType } from '@nestjs/swagger';

import { PaginationDto } from './pagination.dto.js';
import { SortingDto } from './sorting.dto.js';
import { FilteringDto } from './filtering.dto.js';
import { SearchDto } from './search.dto.js';

export class ListQueryDto extends IntersectionType(
  PaginationDto,
  SortingDto,
  FilteringDto,
  SearchDto,
) {}
