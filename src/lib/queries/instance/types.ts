import { Instance, Settings } from "@/types/evolution.types";

export type FetchInstancesResponse = Instance[];

export type FetchInstanceResponse = Instance;

export type FetchSettingsResponse = Settings;

export interface BackendInstanceResponse {
  id?: string;
  instance_id?: string;
  instanceName?: string;
  name?: string;
  status?: string;
  connectionStatus?: string;
  engine_instance_id?: string;
  integration?: string;
  owner?: string;
  ownerJid?: string;
  jid?: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
  businessId?: string;
  token?: string;
  apikey?: string;
  apiKey?: string;
  clientName?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  webhook?: string;
  webhook_url?: string;
  connected?: boolean;
  Setting?: Settings;
  _count?: {
    Message?: number;
    Contact?: number;
    Chat?: number;
  };
  Message?: number;
  Contact?: number;
  Chat?: number;
}
