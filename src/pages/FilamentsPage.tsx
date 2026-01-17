"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilaments } from "@/hooks/use-filaments";
import { AddFilamentDialog } from "@/components/AddFilamentDialog";
import { EditFilamentDialog } from "@/components/EditFilamentDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Package } from "lucide-react";
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

const FilamentsPage = () => {
  const { filaments, clearFilaments, deleteFilament } = useFilaments();

  const handleClearFilaments = () => {
    try {
      clearFilaments();
      showSuccess("Histórico de filamentos limpo com sucesso!");
    } catch (error) {
      showError("Erro ao limpar o histórico de filamentos.");
      console.error("Clear filaments error:", error);
    }
  };

  const handleDeleteFilament = (id: string) => {
    try {
      deleteFilament(id);
      showSuccess("Filamento excluído com sucesso!");
    } catch (error) {
      showError("Erro ao excluir filamento.");
      console.error("Delete filament error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Filamentos Registados</h2>
        <div className="flex gap-2">
          <AddFilamentDialog /> {/* Não é mais necessário passar onSuccess */}
          {filaments.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Limpar Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso removerá permanentemente todos os seus filamentos registados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearFilaments}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {filaments.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nenhum Filamento Registado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Adicione o seu primeiro filamento 3D para começar a gerir!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Removido key={refreshKey} */}
          {filaments.map((filament) => (
            <Card key={filament.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{filament.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <EditFilamentDialog filament={filament} /> {/* Não é mais necessário passar onSuccess */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Excluir Filamento</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso removerá permanentemente o filamento "{filament.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteFilament(filament.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{filament.brand} - {filament.type} ({filament.color || 'N/A'})</p>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <p>Preço/Kg:</p>
                  <p className="text-right font-medium">€{filament.pricePerKg.toFixed(2)}</p>
                  <p>Peso Bobina:</p>
                  <p className="text-right font-medium">{filament.weight.toFixed(2)} kg</p>
                  <p>Custo Total:</p>
                  <p className="text-right font-medium">€{(filament.pricePerKg * filament.weight).toFixed(2)}</p>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground mt-2">
                  Adicionado em: {format(new Date(filament.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilamentsPage;