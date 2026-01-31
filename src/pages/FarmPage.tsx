"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrinters, Printer, PrinterStatus } from "@/hooks/use-printers";
import { useFilaments, Filament } from "@/hooks/use-filaments";
import { useFilamentColors } from "@/hooks/use-filament-colors"; // Importado
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Printer as PrinterIcon, 
  Activity, 
  Clock, 
  Wrench, 
  CheckCircle2,
  Calendar,
  Package,
  Layers,
  CheckCircle,
  PlusCircle,
  Pencil,
  Palette,
  AlertTriangle,
  ArrowDownUp,
  Filter
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showSuccess } from "@/utils/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // <-- Adicionado
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AddFilamentDialog } from "@/components/AddFilamentDialog";
import { EditFilamentDialog } from "@/components/EditFilamentDialog";
import { AddFilamentStockDialog } from "@/components/AddFilamentStockDialog";
import { AddPrinterDialog } from "@/components/AddPrinterDialog"; 
import { FilamentStatsDialog } from "@/components/FilamentStatsDialog"; // Importado
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importado

type FilamentSortBy = "brand" | "color" | "stock" | "name";

const FarmPage = () => {
  const { printers, updatePrinter } = usePrinters();
  const { filaments } = useFilaments();
  const { colors: predefinedColors } = useFilamentColors(); // Usar cores predefinidas
  const [now, setNow] = useState(Date.now());
  const [manageStockEnabled, setManageStockEnabled] = useState(false); 
  const [selectedFilament, setSelectedFilament] = useState<Filament | null>(null);
  const [sortBy, setSortBy] = useState<FilamentSortBy>("stock");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    
    const checkStockSetting = () => {
        if (typeof window !== "undefined") {
            setManageStockEnabled(localStorage.getItem("manage_filament_stock") === "true");
        }
    };

    checkStockSetting();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "manage_filament_stock" || e.key === null) {
            checkStockSetting();
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleMaintenanceToggle = (printer: Printer) => {
    if (printer.status === "Em Manutenção") {
      updatePrinter(printer.id, { 
        status: "Pronta", 
        lastMaintenance: Date.now() 
      });
      showSuccess(`Manutenção de ${printer.name} concluída!`);
    } else {
      updatePrinter(printer.id, { status: "Em Manutenção" });
      showSuccess(`${printer.name} colocada em manutenção.`);
    }
  };

  const handleManualComplete = (printer: Printer) => {
    let additionalHours = 0;
    if (printer.timerStart) {
      const elapsedMs = now - printer.timerStart;
      additionalHours = elapsedMs / 3600000;
    }

    updatePrinter(printer.id, { 
      status: "Pronta",
      workingHours: (printer.workingHours || 0) + additionalHours,
      timerStart: undefined,
      timerEnd: undefined
    });
    showSuccess(`Impressão em ${printer.name} marcada como concluída.`);
  };

  const getStatusColor = (status: PrinterStatus) => {
    switch (status) {
      case "Pronta": return "bg-green-500/10 text-green-600 border-green-200";
      case "Ocupada": return "bg-blue-500/10 text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-500/20";
      case "Em Manutenção": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  const groupedPrinters = {
    "Ocupada": printers.filter(p => p.status === "Ocupada"),
    "Pronta": printers.filter(p => p.status === "Pronta"),
    "Em Manutenção": printers.filter(p => p.status === "Em Manutenção"),
  };

  const sortedFilaments = useMemo(() => {
    const sorted = [...filaments].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "brand":
          comparison = a.brand.localeCompare(b.brand);
          break;
        case "color":
          comparison = (a.color || "").localeCompare(b.color || "");
          break;
        case "stock":
          comparison = a.currentWeightGrams - b.currentWeightGrams;
          break;
        case "name":
        default:
          comparison = (a.name || a.type).localeCompare(b.name || b.type);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filaments, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const getFilamentColorHex = (colorName: string | undefined): string | undefined => {
    if (!colorName) return undefined;
    
    // Tenta encontrar a cor exata ou por nome
    const foundColor = predefinedColors.find(c => c.name.toLowerCase() === colorName.toLowerCase() || c.hex.toLowerCase() === colorName.toLowerCase());
    if (foundColor) return foundColor.hex;

    // Se for um código HEX válido, usa-o diretamente
    if (/^#[0-9A-F]{6}$/i.test(colorName)) return colorName;

    return undefined;
  };

  const renderPrinterCard = (printer: Printer) => {
    let progress = 0;
    let timeRemainingStr = "";

    if (printer.status === "Ocupada" && printer.timerStart && printer.timerEnd) {
      const totalTime = printer.timerEnd - printer.timerStart;
      const elapsedTime = now - printer.timerStart;
      progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
      
      const remainingMs = printer.timerEnd - now;
      if (remainingMs > 0) {
        const h = Math.floor(remainingMs / 3600000);
        const m = Math.floor((remainingMs % 3600000) / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        
        const hStr = h > 0 ? `${h}h ` : "";
        const mStr = m > 0 || h > 0 ? `${m}m ` : "";
        timeRemainingStr = `${hStr}${mStr}${s}s restantes`;
      } else {
        timeRemainingStr = "Concluído";
        progress = 100;
      }
    }

    return (
      <Card key={printer.id} className="overflow-hidden border-l-4 shadow-sm" style={{ borderLeftColor: printer.status === "Pronta" ? "#22c55e" : printer.status === "Ocupada" ? "#3b82f6" : "#ef4444" }}>
        <CardHeader className="bg-muted/10 pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <PrinterIcon className="h-5 w-5 opacity-70" />
                {printer.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">{printer.brand} {printer.model}</p>
            </div>
            
            {printer.status === "Ocupada" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Badge variant="outline" className={getStatusColor(printer.status)}>
                    {printer.status}
                  </Badge>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Concluir Impressão?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Desejas marcar a impressão na <strong>{printer.name}</strong> como concluída manualmente? 
                      Isto libertará a impressora e atualizará as horas de trabalho.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Não, continuar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleManualComplete(printer)} className="bg-green-600 hover:bg-green-700">
                      Sim, concluída
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Badge variant="outline" className={getStatusColor(printer.status)}>
                {printer.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Uso Total</p>
                <p className="font-semibold">{Math.floor(printer.workingHours)}h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Última Manut.</p>
                {printer.lastMaintenance ? (
                  <div className="flex flex-col">
                    <p className="font-semibold text-[11px] leading-tight">
                      {formatDistanceToNow(printer.lastMaintenance, { addSuffix: true, locale: ptBR })}
                    </p>
                    <p className="text-[9px] text-muted-foreground/80 leading-tight">
                      {format(printer.lastMaintenance, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold">Nunca</p>
                )}
              </div>
            </div>
          </div>

          {printer.status === "Ocupada" && (
            <div className="space-y-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-600 dark:text-blue-400 font-bold">Progresso</span>
                <span className="font-mono">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <div className="flex items-center justify-center gap-2 pt-1">
                <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
                <p className="text-sm font-bold text-center text-blue-700 dark:text-blue-300 tabular-nums">
                  {timeRemainingStr}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            {printer.status === "Em Manutenção" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2 border-green-200 text-green-600 hover:bg-green-50">
                    <CheckCircle2 className="h-4 w-4" /> Concluir Manutenção
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Manutenção Concluída?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Confirmas que a manutenção de <strong>{printer.name}</strong> foi realizada com sucesso? 
                      A impressora ficará disponível para novos cálculos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Não, continuar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleMaintenanceToggle(printer)}>Sim, concluída</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleMaintenanceToggle(printer)}
                disabled={printer.status === "Ocupada"}
              >
                <Wrench className="h-4 w-4" /> Colocar em Manutenção
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h1 className="text-3xl font-bold">Print Farm</h1>
          <p className="text-muted-foreground">Monitorização em tempo real da tua frota e stock.</p>
        </div>
        <AddPrinterDialog />
      </div>

      <div className="space-y-10">
        {/* Secção de Impressoras */}
        {printers.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            Nenhuma impressora registada. Adiciona-as para começar a gerir a tua farm.
          </Card>
        ) : (
          Object.entries(groupedPrinters).map(([status, items]) => items.length > 0 && (
            <div key={status} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", status === "Pronta" ? "bg-green-500" : status === "Ocupada" ? "bg-blue-500" : "bg-red-500")} />
                {status} ({items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(renderPrinterCard)}
              </div>
            </div>
          ))
        )}

        {/* Secção de Filamentos - Sempre Visível */}
        <div className="space-y-6 pt-6">
          <Separator />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Filamentos em Stock</h2>
              {!manageStockEnabled && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground">Gestão de Stock Desativada</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as FilamentSortBy)}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="brand">Marca</SelectItem>
                    <SelectItem value="color">Cor</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleSortOrder}>
                  <ArrowDownUp className={cn("h-4 w-4 transition-transform", sortOrder === "asc" ? "rotate-180" : "rotate-0")} />
                </Button>
              </div>
              <AddFilamentDialog />
            </div>
          </div>

          {filaments.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhum filamento registado em stock. Adiciona o primeiro para monitorizar o uso.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedFilaments.map((f) => {
                const currentGrams = f.currentWeightGrams;
                const totalCapacityGrams = f.weight * 1000;
                const stockPercent = Math.min(100, Math.max(0, (currentGrams / totalCapacityGrams) * 100));
                
                const isCritical = manageStockEnabled && stockPercent <= 10;
                const isWarning = manageStockEnabled && stockPercent > 10 && stockPercent <= 25;
                
                let stockColor = "bg-green-500";
                let stockBg = "bg-green-100";
                let textColor = "text-green-600";
                let borderColor = "border-green-200";

                if (isCritical) {
                  stockColor = "bg-red-500";
                  stockBg = "bg-red-100";
                  textColor = "text-red-600";
                  borderColor = "border-red-200";
                } else if (isWarning) {
                  stockColor = "bg-orange-500";
                  stockBg = "bg-orange-100";
                  textColor = "text-orange-600";
                  borderColor = "border-orange-200";
                }

                const displayValue = currentGrams >= 1000 ? `${(currentGrams / 1000).toFixed(2)}kg` : `${currentGrams.toFixed(0)}g`;
                const colorHex = getFilamentColorHex(f.color);

                return (
                  <Card 
                    key={f.id} 
                    className={cn(
                      "overflow-hidden border-l-4 shadow-sm transition-all",
                      manageStockEnabled ? borderColor : "border-border"
                    )} 
                    style={{ borderLeftColor: manageStockEnabled ? (isCritical ? "#ef4444" : isWarning ? "#f97316" : "#22c55e") : "hsl(var(--border))" }}
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 max-w-[70%]">
                          <button 
                            type="button"
                            onClick={() => setSelectedFilament(f)}
                            className="font-bold text-sm truncate text-left hover:text-primary transition-colors"
                          >
                            {f.name || f.type}
                          </button>
                          <div className="flex flex-col">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">
                              {f.brand} {f.type}
                            </p>
                            {f.color && (
                              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                <Palette className="h-2.5 w-2.5" /> {f.color}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <EditFilamentDialog filament={f} />
                          <AddFilamentStockDialog filament={f} /> 
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-end text-xs">
                          <div className="flex items-center gap-1">
                            <span className={cn("font-bold text-sm", manageStockEnabled ? textColor : "text-muted-foreground")}>
                              {manageStockEnabled ? displayValue : "Stock Off"}
                            </span>
                            {isCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          </div>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {manageStockEnabled ? `${stockPercent.toFixed(0)}%` : "N/A"}
                          </span>
                        </div>
                        <div className={cn("h-2.5 w-full rounded-full overflow-hidden", manageStockEnabled ? stockBg : "bg-muted")}>
                          <div 
                            className={cn("h-full transition-all duration-500", manageStockEnabled ? stockColor : "bg-muted-foreground/20")}
                            style={{ width: `${manageStockEnabled ? stockPercent : 0}%` }}
                          />
                        </div>
                      </div>

                      {colorHex && (
                        <div 
                          className="h-3 w-3 rounded-full border border-black/10 shadow-sm ml-auto" 
                          style={{ backgroundColor: colorHex }} 
                          title={`Cor: ${f.color}`}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {selectedFilament && (
        <FilamentStatsDialog 
          filament={selectedFilament} 
          isOpen={!!selectedFilament} 
          onOpenChange={(open) => !open && setSelectedFilament(null)} 
        />
      )}
    </div>
  );
};

export default FarmPage;