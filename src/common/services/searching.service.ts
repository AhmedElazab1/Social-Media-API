import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchingService {
  getSearchTerm(search: string | undefined): string | null {
    if (!search?.trim()) {
      return null;
    }

    return search.trim();
  }
}
