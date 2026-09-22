import { PaginationMetaDto } from './pagination-meta.dto.js';

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}
