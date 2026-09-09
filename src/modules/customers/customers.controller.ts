import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  CustomersService,
  CustomerSummary,
  PaginatedCustomers,
} from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Query() query: ListCustomersQueryDto): Promise<PaginatedCustomers> {
    return this.customersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto): Promise<CustomerSummary> {
    return this.customersService.create(dto);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerSummary> {
    return this.customersService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerSummary> {
    return this.customersService.update(id, dto);
  }
}
