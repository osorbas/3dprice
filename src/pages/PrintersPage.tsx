"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrinters } from "@/hooks/use-printers";
import { AddPrinterDialog } from "@/components/AddPrinterDialog";
import { EditPrinterDialog } from "@/components/EditPrinterDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Printer as PrinterIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showError, showSuccess } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PrintersPage = () => {
  const { printers, clearPrinters, deletePrinter } = usePrinters();

  const handleClearPrinters = () => {
    try {
      clearPrinters();
      showSuccess("Histórico de impressoras limpo com sucesso!");
    } catch (error) {
      showError("Erro ao limpar o histórico de impressoras.");
      console.error("Clear printers error:", error);
    }
  };

  const handleDeletePrinter = (id: string) => {
    try {
      deletePrinter(id);
      showSuccess("Impressora excluída com sucesso!");
    } catch (error) {
      showError("Erro ao excluir impressora.");
      console.error("Delete printer error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Impressoras Registadas</h2>
        <div className="flex gap-2">
          <AddPrinterDialog /> {/* Não é mais necessário passar onSuccess */}
          {printers.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Limpar Todas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso removerá permanentemente todas as suas impressoras registadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearPrinters}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {printers.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nenhuma Impressora Registada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Adicione a sua primeira impressora 3D para começar a gerir!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Removido key={refreshKey} */}
          {printers.map((printer) => (
            <Card key={printer.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{printer.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <EditPrinterDialog printer={printer} /> {/* Não é mais necessário passar onSuccess */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Excluir Impressora</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso removerá permanentemente a impressora "{printer.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePrinter(printer.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <PrinterIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{printer.brand} {printer.model}</p>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 gap-1 text-sm">
                  <p className="col-span-2 text-xs text-muted-foreground mt-2">
                    Adicionada em: {format(new Date(printer.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrintersPage;