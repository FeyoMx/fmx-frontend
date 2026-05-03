import { apiGlobal } from "../api";
import { ContactResponse, ContactView, CreateContactInput } from "./types";

const normalizeContact = (contact: ContactResponse): ContactView => ({
  id: contact.id || contact.phone || "contact-unavailable",
  name: contact.name || contact.phone || "Unnamed contact",
  email: contact.email ?? "",
  phone: contact.phone ?? "",
  tags: (contact.tags ?? []).map((tag) => tag.name).filter(Boolean),
  pipelineStage: "",
  createdAt: contact.createdAt ?? "",
  updatedAt: contact.updatedAt ?? "",
});

export const getContacts = async (): Promise<ContactView[]> => {
  const response = await apiGlobal.get<ContactResponse[]>("/contacts");
  return (response.data ?? []).map(normalizeContact);
};

export const createContact = async (input: CreateContactInput): Promise<ContactView> => {
  const response = await apiGlobal.post<ContactResponse>("/contacts", input);
  return normalizeContact(response.data);
};
