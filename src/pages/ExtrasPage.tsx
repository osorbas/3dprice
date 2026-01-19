"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExtraMaterials, ExtraMaterial } from "@/hooks/use-extras";
import { AddExtraDialog } from "@/components/AddExtraDialog";
import { EditExtraDialog } from "@/components/EditExtraDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Box } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Helper function to calculate profit margin
const getProfitMargin = (sellingPrice: number, purchasePrice?: number) => {
  if (purchasePrice === undefined || purchasePrice <= 0) {
    return { value: "N/A", isProfit: null, colorClass: "text-muted-foreground" };
  }
  const profitAmount = sellingPrice - purchasePrice;
  const percentage = (profitAmount / purchasePrice) * 100;
  const isProfit = profitAmount > 0;
  const colorClass = isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  return { value: percentage.toFixed(0), isProfit, colorClass };
};

const ExtrasPage = () => {
  const { extraMaterials, clearExtraMaterials, deleteExtraMaterial } = useExtraMaterials();

  const handleClearExtras = () => {
    try {
      clearExtraMaterials();
      showSuccess("Histórico de materiais extras limpo com sucesso!");
    } catch (error) {
      showError("Erro ao limpar o histórico de materiais extras.");
      console.error("Clear extra materials error:", error);
    }
  };

  const handleDeleteExtraMaterial = (id: string) => {
    try {
      deleteExtraMaterial(id);
      showSuccess("Material extra excluído com sucesso!");
    } catch (error) {
      showError("Erro ao excluir material extra.");
      console.error("Delete extra material error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Materiais Extras Registados</h2>
        <div className="flex gap-2">
          <AddExtraDialog /> {/* Não é mais necessário passar onSuccess */}
          {extraMaterials.length > 0 && (
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
                    Esta ação não pode ser desfeita. Isso removerá permanentemente todos os seus materiais extras registados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearExtras}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {extraMaterials.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nenhum Material Extra Registado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Adicione o seu primeiro material extra para começar a gerir!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Removido key={refreshKey} */}
          {extraMaterials.map((material) => {
            const profitMargin = getProfitMargin(material.costPerUnit, material.purchasePrice);
            return (
              <Card key={material.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-medium">{material.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <EditExtraDialog extraMaterial={material} /> {/* Não é mais necessário passar onSuccess */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Excluir Material Extra</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente o material extra "{material.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteExtraMaterial(material.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Box className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{material.description || 'Sem descrição'}</p>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <p>Custo por {material.unit}:</p>
                    <p className="text-right font-medium">€{material.costPerUnit.toFixed(2)}</p>
                    {material.purchasePrice !== undefined && material.purchasePrice > 0 && (
                      <>
                        <p>Preço Compra:</p>
                        <p className="text-right font-medium">€{material.purchasePrice.toFixed(2)}</p>
                      </>
                    )}
                    <p>Margem Lucro:</p>
                    <p className={cn("text-right font-medium", profitMargin.colorClass)}>
                      {profitMargin.value}{profitMargin.value !== "N/A" ? "%" : ""}
                    </p>
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground mt-2">
                    Adicionado em: {format(new Date(material.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExtrasPage;