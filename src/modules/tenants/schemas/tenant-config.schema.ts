import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Subdocumentos sem _id próprio (seção 9.2) — cada um é só um agrupamento de campos.
@Schema({ _id: false })
export class Branding {
  @Prop()
  logoUrl?: string;

  @Prop()
  primaryColor?: string;

  @Prop()
  secondaryColor?: string;
}

@Schema({ _id: false })
export class Features {
  @Prop({ default: true })
  whatsappManualLink: boolean;

  @Prop({ default: false })
  whatsappOfficialApi: boolean;
}

@Schema({ _id: false })
export class JoinPolicy {
  @Prop({ default: true })
  allowSelfRegistration: boolean;

  @Prop({ default: false })
  inviteCodeRequired: boolean;
}

// Apenas parâmetros comerciais descritivos — nunca usado para decidir
// limite de assentos (isso é papel de `subscriptions` no Postgres, seção 9.1).
@Schema({ _id: false })
export class Billing {
  @Prop({ default: 'per-seat' })
  pricingModel: string;

  @Prop({ type: Number, default: null })
  pricePerSeat: number | null;

  @Prop({ default: 'BRL' })
  currency: string;
}

@Schema({ collection: 'tenant_configs', timestamps: true })
export class TenantConfig extends Document {
  @Prop({ required: true, unique: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  tenantCode: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status: string;

  @Prop({ type: Branding, default: {} })
  branding: Branding;

  @Prop({ type: Features, default: {} })
  features: Features;

  @Prop({ type: JoinPolicy, default: {} })
  joinPolicy: JoinPolicy;

  @Prop({ type: Billing, default: {} })
  billing: Billing;

  @Prop({ type: Object, default: {} })
  contact: Record<string, unknown>;
}

export const TenantConfigSchema = SchemaFactory.createForClass(TenantConfig);
