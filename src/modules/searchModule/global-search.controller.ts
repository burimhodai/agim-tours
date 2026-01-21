import { Controller, Get, Query } from '@nestjs/common';
import { GlobalSearchService } from './global-search.service';

@Controller('search')
export class GlobalSearchController {
  constructor(private readonly searchService: GlobalSearchService) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('agency') agencyId?: string,
    @Query('limit') limit?: string,
  ) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;
    return await this.searchService.search(query, agencyId, searchLimit);
  }
}
