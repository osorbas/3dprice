"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilaments, Filament } from "@/hooks/use-filaments";
import { AddFilamentDialog } from "@/components/AddFilamentDialog";
import { EditFilamentDialog } from "@/components/EditFilamentDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Package, LayoutGrid, List } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { showError, showSuccess } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FilamentsPage = () => {
  const { filaments, clearFilaments, deleteFilament } = useFilaments();
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("filament_view_mode") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  useEffect(() => {
    localStorage.setItem("filament_view_mode", viewMode);
  }, [viewMode]);

  const groupedFilaments = useMemo(() => {
    const groups: Record<string, Filament[]> = {};
    filaments.forEach((f) => {
      if (!groups[f.brand]) {
        groups[f.brand] = [];
      }
      groups[f.brand].push(f);
    });
    // Sort brands alphabetically
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key].sort((a, b) => {
          const nameA = a.name || `${a.brand} (${a.color || 'N/A'})`;
          const nameB = b.name || `${b.brand} (${b.color || 'N/A'})`;
          return nameA.localeCompare(nameB);
        });
        return acc;
      }, {} as Record<string, Filament[]>);
  }, [filaments]);

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

  const getFilamentDisplayName = (filament: Filament) => {
    if (filament.name && filament.name.trim() !== "") {
      return filament.name;
    }
    return `${filament.brand} (${filament.color || 'N/A'})`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Filamentos Registados</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="w-auto">
            <TabsList>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" /> <span className="hidden sm:inline">Grelha</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" /> <span className="hidden sm:inline">Lista por Marca</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <AddFilamentDialog />
          
          {filaments.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" title="Limpar Todos">
                  <Trash2 className="h-4 w-4" />
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filaments.map((filament) => (
            <Card key={filament.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{getFilamentDisplayName(filament)}</CardTitle>
                <div className="flex items-center gap-2">
                  <EditFilamentDialog filament={filament} />
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
                          Esta ação não pode ser desfeita. Isso removerá permanentemente o filamento "{getFilamentDisplayName(filament)}".
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
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {Object.entries(groupedFilaments).map(([brand, brandFilaments]) => (
            <AccordionItem key={brand} value={brand} className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-lg">{brand}</span>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {brandFilaments.length} {brandFilaments.length === 1 ? 'filamento' : 'filamentos'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Preço/Kg</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandFilaments.map((filament) => (
                        <TableRow key={filament.id}>
                          <TableCell className="font-medium">{getFilamentDisplayName(filament)}</TableCell>
                          <TableCell>{filament.type}</TableCell>
                          <TableCell>{filament.color || '-'}</TableCell>
                          <TableCell>€{filament.pricePerKg.toFixed(2)}</TableCell>
                          <TableCell>{filament.weight.toFixed(2)} kg</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditFilamentDialog filament={filament} />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar filamento?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tens a certeza que queres eliminar o filamento "{getFilamentDisplayName(filament)}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteFilament(filament.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FilamentsPage;