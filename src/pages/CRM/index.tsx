import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useTenant } from "@/contexts/TenantContext";
import { createContact, getContacts } from "@/lib/queries/crm/contacts";
import { ContactView } from "@/lib/queries/crm/types";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { formatCompactTimestamp } from "@/lib/operator-format";
import { useIncrementalList } from "@/lib/use-incremental-list";

export function CRM() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", tags: [] as string[] });

  useEffect(() => {
    void fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        !normalizedSearch ||
        contact.name.toLowerCase().includes(normalizedSearch) ||
        contact.email.toLowerCase().includes(normalizedSearch) ||
        contact.phone.toLowerCase().includes(normalizedSearch);
      const matchesTag = !selectedTag || contact.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [contacts, deferredSearchQuery, selectedTag]);

  const visibleContacts = useIncrementalList(filteredContacts, {
    initialCount: 100,
    step: 100,
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((contact) => {
      contact.tags.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).sort((left, right) => left.localeCompare(right));
  }, [contacts]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      setContacts(await getContacts());
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("crm.error.fetchContacts") || "Failed to fetch contacts"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error(t("crm.validation.requiredFields") || "Name and phone are required");
      return;
    }

    try {
      await createContact({
        name: newContact.name,
        email: newContact.email || undefined,
        phone: newContact.phone,
        tags: newContact.tags,
      });
      toast.success(t("crm.message.contactAdded") || "Contact added successfully");
      setShowAddContact(false);
      setNewContact({ name: "", email: "", phone: "", tags: [] });
      void fetchContacts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("crm.error.addContact") || "Failed to add contact"));
    }
  };

  return (
    <div className="space-y-4 p-4">
      <OperatorPageHeader
        title={t("crm.title") || "CRM"}
        description={tenant?.name}
        actions={
          <>
            <Button onClick={() => void fetchContacts()} variant="outline" size="icon">
              <RefreshCw size={20} />
            </Button>
            <Button onClick={() => setShowAddContact(true)}>
              <Plus size={20} className="mr-2" />
              {t("crm.button.addContact") || "Add Contact"}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("crm.contacts") || "Contacts"}</CardTitle>
          <CardDescription>
            {filteredContacts.length} surfaced contact{filteredContacts.length === 1 ? "" : "s"}
            {visibleContacts.hasMore ? ` · showing first ${visibleContacts.visibleCount}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Current backend support</AlertTitle>
            <AlertDescription>
              Contacts can be listed and created from this UI. Delete and pipeline-stage management are not exposed by the current backend contract.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("crm.search") || "Search contacts..."}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-8"
              />
            </div>
            {selectedTag && (
              <Button onClick={() => setSelectedTag(null)} variant="outline">
                Clear: {selectedTag}
              </Button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge key={tag} variant={selectedTag === tag ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}>
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
                  <TableHead>Updated</TableHead>
                  <TableHead>{t("crm.table.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {t("common.loading") || "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {t("crm.noContacts") || "No contacts found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleContacts.visibleItems.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email || "-"}</TableCell>
                      <TableCell>{contact.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{contact.pipelineStage || "-"}</TableCell>
                      <TableCell>{formatCompactTimestamp(contact.updatedAt || contact.createdAt, "-")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled title="Delete is not supported by the current backend">
                          Not available
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {visibleContacts.hasMore ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
              <div className="text-sm text-muted-foreground">
                Showing {visibleContacts.visibleCount} of {visibleContacts.totalCount} filtered contacts to keep large datasets responsive.
              </div>
              <Button variant="outline" onClick={visibleContacts.showMore}>
                Show 100 more
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("crm.dialog.addContact") || "Add New Contact"}</DialogTitle>
            <DialogDescription>{t("crm.dialog.addContactDescription") || "Create a new contact in your CRM system"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="text" placeholder="Name*" value={newContact.name} onChange={(event) => setNewContact({ ...newContact, name: event.target.value })} />
            <Input type="email" placeholder="Email" value={newContact.email} onChange={(event) => setNewContact({ ...newContact, email: event.target.value })} />
            <Input type="tel" placeholder="Phone*" value={newContact.phone} onChange={(event) => setNewContact({ ...newContact, phone: event.target.value })} />
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
