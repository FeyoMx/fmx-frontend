export interface ContactTagResponse {
  id?: string;
  name: string;
  color?: string;
}

export interface ContactResponse {
  id: string;
  name: string;
  email?: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: ContactTagResponse[];
}

export interface ContactView {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  pipelineStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone: string;
  tags?: string[];
}
