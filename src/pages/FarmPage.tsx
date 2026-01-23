"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrinters, Printer, PrinterStatus } from "@/hooks/use-printers";
import { useFilaments, Filament } from "@/hooks/use-filaments";
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
  Layers
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FarmPage = () => {
  const { printers, updatePrinter } = usePrinters();
  const { filaments } = useFilaments();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
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

  const getStatusColor = (status: PrinterStatus) => {
    switch (status) {
      case "Pronta": return "bg-green-500/10 text-green-600 border-green-200";
      case "Ocupada": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "Em Manutenção": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  const groupedPrinters = {
    "Ocupada": printers.filter(p => p.status === "Ocupada"),
    "Pronta": printers.filter(p => p.status === "Pronta"),
    "Em Manutenção": printers.filter(p => p.status === "Em Manutenção"),
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
            <Badge variant="outline" className={getStatusColor(printer.status)}>
              {printer.status}
            </Badge>
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
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Print Farm</h1>
        <p className="text-muted-foreground">Monitorização em tempo real da tua frota e stock.</p>
      </div>

      {printers.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhuma impressora registada. Adiciona-as nas Definições.
        </Card>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedPrinters).map(([status, items]) => items.length > 0 && (
            <div key={status} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", status === "Pronta" ? "bg-green-500" : status === "Ocupada" ? "bg-blue-500" : "bg-red-500")} />
                {status} ({items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(renderPrinterCard)}
              </div>
            </div>
          ))}

          {filaments.length > 0 && (
            <div className="space-y-6 pt-6">
              <Separator />
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Filamentos em Stock</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filaments.map((f) => {
                  const stockKg = (f.currentWeightGrams / 1000).toFixed(2);
                  const totalKg = f.weight;
                  const percent = Math.min(100, (f.currentWeightGrams / (totalKg * 1000)) * 100);
                  const isLow = percent < 20;

                  return (
                    <Card key={f.id} className={cn("bg-muted/30 border-dashed", isLow && "border-orange-200 bg-orange-50/30")}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold truncate max-w-[150px]">{f.name || f.type}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{f.brand}</p>
                          </div>
                          <Badge variant={isLow ? "destructive" : "secondary"} className="text-[10px] px-1.5 h-5">
                            {f.type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium">
                            <span className={isLow ? "text-red-600 font-bold" : "text-muted-foreground"}>
                              {isLow ? "Stock Baixo" : "Disponível"}
                            </span>
                            <span>{stockKg}kg / {totalKg}kg</span>
                          </div>
                          <Progress value={percent} className={cn("h-1.5", isLow ? "bg-red-100" : "")} />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{f.currentWeightGrams.toFixed(0)}g</span>
                          {f.color && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-[10px] text-muted-foreground">{f.color}</span>
                              <div className="h-2 w-2 rounded-full border" style={{ backgroundColor: f.color.toLowerCase() }} />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FarmPage;