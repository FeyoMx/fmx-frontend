import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { apiGlobal } from "@/lib/queries/api";
import { useTenant } from "@/contexts/TenantContext";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  pipelineStage: string;
  createdAt: string;
}

export function CRM() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", tags: [] as string[] });

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || contact.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [contacts, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((contact) => {
      contact.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [contacts]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await apiGlobal.get("/contacts");
      setContacts(response.data || []);
    } catch (error) {
      toast.error(t("crm.error.fetchContacts") || "Failed to fetch contacts");
    } finally {
      setIsLoading(false);
    }
  };


  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast.error(t("crm.validation.requiredFields") || "Name and email are required");
      return;
    }

    try {
      await apiGlobal.post("/contacts", newContact);
      toast.success(t("crm.message.contactAdded") || "Contact added successfully");
      setShowAddContact(false);
      setNewContact({ name: "", email: "", phone: "", tags: [] });
      fetchContacts();
    } catch (error) {
      toast.error(t("crm.error.addContact") || "Failed to add contact");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await apiGlobal.delete(`/contacts/${contactId}`);
      toast.success(t("crm.message.contactDeleted") || "Contact deleted successfully");
      fetchContacts();
    } catch (error) {
      toast.error(t("crm.error.deleteContact") || "Failed to delete contact");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("crm.title") || "CRM"}</h1>
          <p className="text-gray-600">{tenant?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchContacts} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
          <Button onClick={() => setShowAddContact(true)}>
            <Plus size={20} className="mr-2" />
            {t("crm.button.addContact") || "Add Contact"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("crm.contacts") || "Contacts"}</CardTitle>
          <CardDescription>{filteredContacts.length} contacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder={t("crm.search") || "Search contacts..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
            </div>
            {selectedTag && (
              <Button onClick={() => setSelectedTag(null)} variant="outline">
                {selectedTag} ✕
              </Button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("crm.table.name") || "Name"}</TableHead>
                  <TableHead>{t("crm.table.email") || "Email"}</TableHead>
                  <TableHead>{t("crm.table.phone") || "Phone"}</TableHead>
                  <TableHead>{t("crm.table.tags") || "Tags"}</TableHead>
                  <TableHead>{t("crm.table.stage") || "Stage"}</TableHead>
                  <TableHead>{t("crm.table.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {t("common.loading") || "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {t("crm.noContacts") || "No contacts found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{contact.pipelineStage || "-"}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleDeleteContact(contact.id)} variant="ghost" size="sm">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("crm.dialog.addContact") || "Add New Contact"}</DialogTitle>
            <DialogDescription>{t("crm.dialog.addContactDescription") || "Create a new contact in your CRM system"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input type="text" placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full rounded border p-2" />
            <input type="email" placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="w-full rounded border p-2" />
            <input type="tel" placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full rounded border p-2" />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAddContact(false)} variant="outline">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleAddContact}>{t("common.add") || "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
