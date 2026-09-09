import { HttpStatus, Injectable } from '@nestjs/common';
import { ILike } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: Customer['status'];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedCustomers {
  items: CustomerSummary[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(dto: CreateCustomerDto): Promise<CustomerSummary> {
    const customer = this.customersRepository.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      notes: dto.notes ?? null,
      status: 'ACTIVE',
    });
    // O retorno de save() é usado (não `customer`): TenantScopedRepository.save()
    // salva uma cópia espalhada do objeto, então é ali que id/updatedAt são
    // populados — a referência original passada não é mutada.
    const saved = await this.customersRepository.save(customer);

    return this.toSummary(saved);
  }

  async list(query: ListCustomersQueryDto): Promise<PaginatedCustomers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Duas cláusulas OR (name/phone) — withTenant() do TenantScopedRepository
    // injeta tenantId em cada uma, então a busca nunca escapa do isolamento.
    const where = query.search
      ? [
          { name: ILike(`%${query.search}%`) },
          { phone: ILike(`%${query.search}%`) },
        ]
      : {};

    const [items, total] = await this.customersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((customer) => this.toSummary(customer)),
      page,
      limit,
      total,
    };
  }

  async getById(id: string): Promise<CustomerSummary> {
    const customer = await this.findOrThrow(id);
    return this.toSummary(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerSummary> {
    const customer = await this.findOrThrow(id);

    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.email !== undefined) customer.email = dto.email;
    if (dto.notes !== undefined) customer.notes = dto.notes;
    if (dto.status !== undefined) customer.status = dto.status;

    const saved = await this.customersRepository.save(customer);

    return this.toSummary(saved);
  }

  private async findOrThrow(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) {
      // 404 (não 403): cliente de outro tenant não deve ser distinguível de
      // cliente inexistente (BE-CUS-001 / seção 3.2).
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Cliente não encontrado.',
      });
    }
    return customer;
  }

  private toSummary(customer: Customer): CustomerSummary {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      status: customer.status,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
