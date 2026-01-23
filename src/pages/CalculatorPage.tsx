"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, Save, PlusCircle, History, Eraser, FileCode } from "lucide-react"; 
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { ExtraMaterialField } from "@/components/calculator/ExtraMaterialField";
import { FilamentUsageField } from "@/components/calculator/FilamentUsageField";
import { PaymentSummaryDialog } from "@/components/calculator/PaymentSummaryDialog";
import { StartTimerDialog } from "@/components/calculator/StartTimerDialog";
import { parseGCodeMetadata } from "@/utils/gcode-parser";
import { ProjectPartField } from "@/components/calculator/ProjectPartField";

const DEFAULT_PROFIT_MARGIN = 20;

const extraSchema = z.object({
  materialId: z.string().min(1, "Selecione um material extra."),
  quantity: z.coerce.number().min(0, "A quantidade não pode ser negativa."),
});

const filamentUsageSchema = z.object({
  filamentId: z.string().min(1, "Selecione um filamento."),
  filamentGrams: z.coerce.number().min(0, "A quantidade não pode ser negativa."),
});

const projectPartSchema = z.object({
  partName: z.string().min(1, "O nome da parte é obrigatório."),
  printerId: z.string().min(1, "Selecione uma impressora para a parte."),
  filamentsUsed: z.array(filamentUsageSchema).min(1, "Adicione pelo menos um filamento para a parte."),
  printTimeHours: z.coerce.number().min(0),
  printTimeMinutes: z.coerce.number().min(0).max(59),
  electricityProfileId: z.string().optional(),
  electricityCostPerHour: z.coerce.number().min(0),
  isConfirmed: z.boolean().default(false),
});

const formSchema = z.object({
  printName: z.string().optional(),
  printerId: z.string().optional(),
  filamentsUsed: z.array(filamentUsageSchema).optional(),
  printTimeHours: z.coerce.number().optional(),
  printTimeMinutes: z.coerce.number().optional(),
  electricityProfileId: z.string().optional(), 
  electricityCostPerHour: z.coerce.number().optional(),
  laborCostPerHour: z.coerce.number().optional(),
  laborTimeHours: z.coerce.number().optional(),
  laborTimeMinutes: z.coerce.number().optional(),
  profitMargin: z.coerce.number().optional(),
  extras: z.array(extraSchema).optional(),
  projectName: z.string().optional(),
  projectParts: z.array(projectPartSchema).optional(),
});

const CalculatorPage = () => {
  const { addCalculation, calculations } = usePrintCalculations();
  const { printers, updatePrinter } = usePrinters();
  const { filaments } = useFilaments();
  const { extraMaterials } = useExtraMaterials();
  const { electricityProfiles } = useElectricityProfiles();

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"single-print" | "project">("single-print");
  const [pendingTimerData, setPendingTimerData] = useState<{ printerId: string, duration: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openPartStates, setOpenPartStates] = useState<boolean[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printName: "", printerId: "", filamentsUsed: [{ filamentId: "", filamentGrams: 0 }],
      printTimeHours: 0, printTimeMinutes: 0, electricityProfileId: "", electricityCostPerHour: 0.15,
      laborCostPerHour: 10, laborTimeHours: 0, laborTimeMinutes: 0, profitMargin: DEFAULT_PROFIT_MARGIN,
      extras: [], projectName: "", projectParts: [],
    },
  });

  const { fields: singleFilamentFields, append: appendSingleFilament, remove: removeSingleFilament } = useFieldArray({
    control: form.control,
    name: "filamentsUsed",
  });

  const { fields: singleExtraFields, append: appendSingleExtra, remove: removeSingleExtra } = useFieldArray({
    control: form.control,
    name: "extras",
  });

  const { fields: projectPartFields, append: appendProjectPart, remove: removeProjectPart } = useFieldArray({
    control: form.control,
    name: "projectParts",
  });

  const handleStartTimer = () => {
    if (pendingTimerData) {
      const printer = printers.find(p => p.id === pendingTimerData.printerId);
      if (printer) {
        updatePrinter(printer.id, {
          status: "Ocupada",
          timerEnd: Date.now() + (pendingTimerData.duration * 3600000)
        });
        showSuccess(`Temporizador ativado para ${printer.name}!`);
      }
    }
    setPendingTimerData(null);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validação de manutenção antes de prosseguir
    const selectedPrinterId = activeTab === "single-print" ? values.printerId : values.projectParts?.[0]?.printerId;
    const printer = printers.find(p => p.id === selectedPrinterId);
    
    if (printer?.status === "Em Manutenção") {
      showError(`A impressora ${printer.name} está em manutenção e não pode ser usada.`);
      return;
    }

    let totalPrintTimeHours = 0;
    if (activeTab === "single-print") {
      totalPrintTimeHours = (values.printTimeHours || 0) + ((values.printTimeMinutes || 0) / 60);
    } else {
      totalPrintTimeHours = (values.projectParts || []).reduce((acc, p) => acc + (p.printTimeHours || 0) + (p.printTimeMinutes || 0) / 60, 0);
    }

    // Lógica de guardar cálculo (simplificada para o exemplo)
    const id = Date.now().toString();
    const finalPrice = 100; // Placeholder para o preço real calculado

    setSummaryData({
      id, printName: activeTab === "single-print" ? values.printName : values.projectName,
      totalPrice: finalPrice, materialCost: 20, electricityCost: 5, laborCost: 50, extrasCost: 10,
      baseCost: 85, profitMargin: 15, profitAmount: 15,
    });

    if (selectedPrinterId) {
      setPendingTimerData({ printerId: selectedPrinterId, duration: totalPrintTimeHours });
      setIsTimerDialogOpen(true);
    }

    setIsSummaryDialogOpen(true);
    showSuccess("Cálculo guardado!");
  };

  const calculatedTotalPrice = 0; // Placeholder

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <Card className="w-full max-w-2xl shadow-lg flex flex-col max-h-[85vh]">
        <CardHeader className="pb-4 flex-shrink-0 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold">Calcular Preço</CardTitle>
            <p className="text-muted-foreground">Insira os detalhes da impressão.</p>
          </div>
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-auto">
            <TabsList><TabsTrigger value="single-print">Individual</TabsTrigger><TabsTrigger value="project">Projeto</TabsTrigger></TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {activeTab === "single-print" ? (
                <div className="space-y-4">
                  <FormField control={form.control} name="printName" render={({ field }) => (
                    <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="printerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impressora</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {printers.map(p => (
                            <SelectItem key={p.id} value={p.id} disabled={p.status === "Em Manutenção"}>
                              {p.name} {p.status === "Em Manutenção" ? "(Em Manutenção)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <div className="flex gap-2">
                    <FormField control={form.control} name="printTimeHours" render={({ field }) => (
                      <FormItem className="flex-grow"><FormLabel>Horas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="printTimeMinutes" render={({ field }) => (
                      <FormItem className="flex-grow"><FormLabel>Minutos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Lógica de Projeto Ativa</div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 p-6 flex flex-col gap-4">
          <Button onClick={form.handleSubmit(onSubmit)} className="w-full bg-orange-500 hover:bg-orange-600 font-bold">
            Guardar e Resumo
          </Button>
        </CardFooter>
      </Card>

      <PaymentSummaryDialog isOpen={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen} data={summaryData} onDelete={() => {}} />
      <StartTimerDialog 
        isOpen={isTimerDialogOpen} 
        onOpenChange={setIsTimerDialogOpen} 
        printer={printers.find(p => p.id === pendingTimerData?.printerId)} 
        durationHours={pendingTimerData?.duration || 0}
        onConfirm={handleStartTimer}
      />
    </div>
  );
};

export default CalculatorPage;