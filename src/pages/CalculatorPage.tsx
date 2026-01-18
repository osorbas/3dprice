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

import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { ExtraMaterialField } from "@/components/calculator/ExtraMaterialField";
import { FilamentField } from "@/components/calculator/FilamentField"; // Importar o novo componente
import { PaymentSummaryDialog } from "@/components/calculator/PaymentSummaryDialog";
import { parseGCodeMetadata } from "@/utils/gcode-parser";

const DEFAULT_PROFIT_MARGIN = 20;

const extraSchema = z.object({
  materialId: z.string().min(1, "Selecione um material extra."),
  quantity: z.coerce.number().min(0, "A quantidade não pode ser negativa."),
});

const filamentEntrySchema = z.object({
  filamentId: z.string().min(1, "Selecione um filamento."),
  grams: z.coerce.number().min(0.01, "A quantidade de filamento deve ser positiva."),
});

const formSchema = z.object({
  printName: z.string().min(1, "O nome da impressão é obrigatório."),
  printerId: z.string().min(1, "Selecione uma impressora."),
  filamentsUsed: z.array(filamentEntrySchema).min(1, "Pelo menos um filamento é obrigatório."), // Alterado para array
  printTimeHours: z.coerce.number().min(0, "Horas não podem ser negativas."),
  printTimeMinutes: z.coerce.number().min(0, "Minutos não podem ser negativos.").max(59, "Minutos não podem exceder 59."),
  
  electricityProfileId: z.string().optional(), 
  electricityCostPerHour: z.coerce.number().min(0, "O custo da eletricidade não pode ser negativo."),
  
  laborCostPerHour: z.coerce.number().min(0, "O custo da mão de obra não pode ser negativo."),
  laborTimeHours: z.coerce.number().min(0, "Horas não podem ser negativas."),
  laborTimeMinutes: z.coerce.number().min(0, "Minutos não podem ser negativos.").max(59, "Minutos não podem exceder 59."),
  profitMargin: z.coerce.number().min(0, "A margem de lucro não pode ser negativa."),
  extras: z.array(extraSchema).optional(),
});

const CalculatorPage = () => {
  const { addCalculation, deleteCalculation, calculations } = usePrintCalculations();
  const { printers, updatePrinter } = usePrinters();
  const { filaments } = useFilaments();
  const { extraMaterials } = useExtraMaterials();
  const { electricityProfiles } = useElectricityProfiles();

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [lastCalculationId, setLastCalculationId] = useState<string | null>(null);

  const [defaultPrinterId, setDefaultPrinterId] = useState<string | null>(null);
  const [defaultFilamentId, setDefaultFilamentId] = useState<string | null>(null);
  const [defaultElectricityProfileId, setDefaultElectricityProfileId] = useState<string | null>(null);
  const [defaultProfitMargin, setDefaultProfitMargin] = useState<number>(DEFAULT_PROFIT_MARGIN);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDefaultPrinterId = localStorage.getItem("default_printer_id");
      if (storedDefaultPrinterId) setDefaultPrinterId(storedDefaultPrinterId);
      
      const storedDefaultFilamentId = localStorage.getItem("default_filament_id");
      if (storedDefaultFilamentId) setDefaultFilamentId(storedDefaultFilamentId);

      const storedDefaultElectricityProfileId = localStorage.getItem("default_electricity_profile_id");
      if (storedDefaultElectricityProfileId) setDefaultElectricityProfileId(storedDefaultElectricityProfileId);

      const storedDefaultProfitMargin = localStorage.getItem("default_profit_margin");
      if (storedDefaultProfitMargin) setDefaultProfitMargin(parseFloat(storedDefaultProfitMargin));
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printName: "",
      printerId: defaultPrinterId || "",
      filamentsUsed: defaultFilamentId ? [{ filamentId: defaultFilamentId, grams: 0 }] : [{ filamentId: "", grams: 0 }], // Inicializa com um filamento
      printTimeHours: 0,
      printTimeMinutes: 0,
      electricityProfileId: defaultElectricityProfileId || "",
      electricityCostPerHour: 0.15,
      laborCostPerHour: 10,
      laborTimeHours: 0,
      laborTimeMinutes: 0,
      profitMargin: defaultProfitMargin,
      extras: [],
    },
  });

  // Atualizar valores iniciais quando os defaults são carregados
  useEffect(() => {
    if (defaultPrinterId) {
      form.setValue("printerId", defaultPrinterId, { shouldValidate: true });
    }
    if (defaultFilamentId && form.getValues("filamentsUsed").length === 1 && form.getValues("filamentsUsed")[0].filamentId === "") {
      form.setValue("filamentsUsed.0.filamentId", defaultFilamentId, { shouldValidate: true });
    }
    if (defaultElectricityProfileId) {
      const prof = electricityProfiles.find(p => p.id === defaultElectricityProfileId);
      if (prof) {
        form.setValue("electricityProfileId", defaultElectricityProfileId, { shouldValidate: true });
        form.setValue("electricityCostPerHour", prof.costPerHour, { shouldValidate: true });
      }
    }
    form.setValue("profitMargin", defaultProfitMargin, { shouldValidate: true });
  }, [defaultPrinterId, defaultFilamentId, defaultElectricityProfileId, defaultProfitMargin, electricityProfiles, form]);


  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control: form.control,
    name: "extras",
  });

  const { fields: filamentFields, append: appendFilament, remove: removeFilament } = useFieldArray({
    control: form.control,
    name: "filamentsUsed",
  });

  const watchedValues = form.watch();
  
  const calculatedTotalPrice = useMemo(() => {
    const currentPrintTimeHours = (Number(watchedValues.printTimeHours) || 0) + (Number(watchedValues.printTimeMinutes) || 0) / 60;
    const currentElectricityCostPerHour = Number(watchedValues.electricityCostPerHour) || 0;
    const currentLaborCostPerHour = Number(watchedValues.laborCostPerHour) || 0;
    const currentLaborTimeHours = (Number(watchedValues.laborTimeHours) || 0) + (Number(watchedValues.laborTimeMinutes) || 0) / 60;
    const currentProfitMargin = Number(watchedValues.profitMargin) || 0;

    const calculatedMaterialCost = (watchedValues.filamentsUsed || []).reduce((sum, entry) => {
      const selectedFilament = filaments.find(f => f.id === entry.filamentId);
      if (selectedFilament) {
        return sum + (selectedFilament.pricePerKg / 1000) * (Number(entry.grams) || 0);
      }
      return sum;
    }, 0);

    const calculatedElectricityCost = currentPrintTimeHours * currentElectricityCostPerHour;
    const calculatedLaborCost = currentLaborTimeHours * currentLaborCostPerHour;

    const calculatedExtraCost = (watchedValues.extras || []).reduce((sum, extra) => {
      const material = extraMaterials.find(mat => mat.id === extra.materialId);
      if (material) return sum + (material.costPerUnit * (Number(extra.quantity) || 0));
      return sum;
    }, 0);

    const calculatedBaseCost = calculatedMaterialCost + calculatedElectricityCost + calculatedLaborCost + calculatedExtraCost;
    const calculatedProfit = calculatedBaseCost * (currentProfitMargin / 100);
    return calculatedBaseCost + calculatedProfit;
  }, [watchedValues, filaments, extraMaterials]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = showLoading("A processar ficheiro...");
    
    try {
      const fileName = file.name.replace(/\.(gcode)$/i, "",).replace(/_/g, " ");
      form.setValue("printName", fileName);

      let gcodeContent = "";

      if (file.name.toLowerCase().endsWith(".gcode")) {
        gcodeContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      } else {
        dismissToast(toastId);
        showError("Formato de ficheiro não suportado. Por favor, use .gcode.");
        event.target.value = "";
        return;
      }

      const metadata = parseGCodeMetadata(gcodeContent);

      let foundData = false;
      if (metadata.filamentGrams !== null) {
        form.setValue("filamentsUsed.0.grams", parseFloat(metadata.filamentGrams.toFixed(2))); // Define para o primeiro filamento
        foundData = true;
      }

      if (metadata.totalTimeSeconds !== null) {
        const totalMinutes = Math.ceil(metadata.totalTimeSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        form.setValue("printTimeHours", hours);
        form.setValue("printTimeMinutes", mins);
        foundData = true;
      }

      dismissToast(toastId);
      if (foundData) {
        showSuccess("Dados importados com sucesso!");
      } else {
        showError("Não foram encontrados metadados padrão neste ficheiro.");
      }
    } catch (error) {
      dismissToast(toastId);
      showError("Erro ao processar o ficheiro.");
      console.error(error);
    }
    
    event.target.value = "";
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.filamentsUsed.length === 0) {
      showError("Pelo menos um filamento é obrigatório.");
      return;
    }

    let totalFilamentGrams = 0;
    let materialCost = 0;

    values.filamentsUsed.forEach(entry => {
      const selectedFilament = filaments.find(f => f.id === entry.filamentId);
      if (!selectedFilament) {
        showError(`Filamento selecionado inválido: ${entry.filamentId}`);
        return;
      }
      totalFilamentGrams += entry.grams;
      materialCost += (selectedFilament.pricePerKg / 1000) * entry.grams;
    });

    const totalPrintTimeHours = values.printTimeHours + (values.printTimeMinutes / 60);
    const totalLaborTimeHours = values.laborTimeHours + (values.laborTimeMinutes / 60);
    const electricityCost = totalPrintTimeHours * values.electricityCostPerHour;
    const laborCost = totalLaborTimeHours * values.laborCostPerHour;

    const extraCostTotal = (values.extras || []).reduce((sum, extra) => {
      const material = extraMaterials.find(mat => mat.id === extra.materialId);
      return material ? sum + (material.costPerUnit * extra.quantity) : sum;
    }, 0);

    const baseCost = materialCost + electricityCost + laborCost + extraCostTotal;
    const profit = baseCost * (values.profitMargin / 100);
    const finalPrice = baseCost + profit;

    const newCalculation = {
      printName: values.printName,
      printerId: values.printerId,
      materialCost: parseFloat(materialCost.toFixed(2)),
      printTimeHours: parseFloat(totalPrintTimeHours.toFixed(1)),
      electricityCost: parseFloat(electricityCost.toFixed(2)),
      laborCost: parseFloat(laborCost.toFixed(2)),
      extraCost: parseFloat(extraCostTotal.toFixed(2)),
      profitMargin: values.profitMargin,
      totalPrice: parseFloat(finalPrice.toFixed(2)),
      filamentGrams: parseFloat(totalFilamentGrams.toFixed(2)), // Total de gramas de todos os filamentos
      filamentId: values.filamentsUsed[0]?.filamentId || "", // Manter o ID do primeiro filamento para compatibilidade com histórico
    };
    
    const tempId = Date.now().toString();
    addCalculation(newCalculation);

    const selectedPrinter = printers.find(p => p.id === values.printerId);
    if (selectedPrinter) {
      updatePrinter(selectedPrinter.id, {
        workingHours: selectedPrinter.workingHours + totalPrintTimeHours,
      });
    }

    setLastCalculationId(tempId); 

    setSummaryData({
      id: tempId,
      printName: values.printName,
      materialCost,
      electricityCost,
      laborCost,
      extrasCost: extraCostTotal,
      baseCost,
      profitMargin: values.profitMargin,
      profitAmount: profit,
      totalPrice: finalPrice,
    });
    setIsSummaryDialogOpen(true);
    showSuccess("Cálculo guardado!");
    handleClearCalculator();
  };

  const handleDeleteLastCalculation = (tempId: string) => {
    const actualCalculation = calculations.find(c => c.id === tempId) || calculations[0];

    if (actualCalculation) {
      deleteCalculation(actualCalculation.id);
      showSuccess("Registo de cálculo apagado com sucesso.");
    } else {
      showError("Erro ao apagar o registo. Cálculo não encontrado.");
    }
    setLastCalculationId(null);
    setSummaryData(null);
  };

  const handleImportFromHistory = (calculation: PrintCalculation) => {
    form.reset({
      printName: calculation.printName || "",
      printerId: calculation.printerId || "",
      filamentsUsed: [{ filamentId: calculation.filamentId || "", grams: calculation.filamentGrams }], // Popula o primeiro filamento
      printTimeHours: Math.floor(calculation.printTimeHours),
      printTimeMinutes: Math.round((calculation.printTimeHours - Math.floor(calculation.printTimeHours)) * 60),
      electricityCostPerHour: calculation.electricityCost,
      laborCostPerHour: calculation.laborCost,
      laborTimeHours: 0,
      laborTimeMinutes: 0,
      profitMargin: calculation.profitMargin,
      extras: [],
    });
    setIsHistoryDialogOpen(false);
  };

  const handleClearCalculator = () => {
    form.reset({
      printName: "",
      printerId: defaultPrinterId || "",
      filamentsUsed: defaultFilamentId ? [{ filamentId: defaultFilamentId, grams: 0 }] : [{ filamentId: "", grams: 0 }],
      printTimeHours: 0,
      printTimeMinutes: 0,
      electricityProfileId: defaultElectricityProfileId || "",
      electricityCostPerHour: 0.15,
      laborCostPerHour: 10,
      laborTimeHours: 0,
      laborTimeMinutes: 0,
      profitMargin: defaultProfitMargin,
      extras: [],
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <Card className="w-full max-w-full sm:max-w-3xl shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold">Calcular Custo de Impressão</CardTitle>
          <p className="text-muted-foreground">Insira os detalhes para calcular o orçamento.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 mb-6 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> Gestão de Dados
            </div>
            <div className="flex gap-2">
              <input type="file" accept=".gcode" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border-primary text-primary">
                <FileCode className="h-4 w-4" /> Importar G-code
              </Button>
              <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="flex items-center gap-2">
                    <History className="h-4 w-4" /> Histórico
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Importar do Histórico</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-grow pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Preço (€)</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calculations.map((calc) => (
                          <TableRow key={calc.id}>
                            <TableCell>{format(new Date(calc.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell>{calc.printName || "N/A"}</TableCell>
                            <TableCell className="font-semibold">{calc.totalPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleImportFromHistory(calc)}>Importar</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleClearCalculator}>
                <Eraser className="h-4 w-4" /> Limpar
              </Button>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <Tabs defaultValue="basic-info" className="w-full">
                <TabsList className="grid grid-cols-2 gap-2 w-full p-1 md:flex md:w-full md:overflow-x-auto md:whitespace-nowrap md:justify-start">
                  <TabsTrigger value="basic-info">Impressão</TabsTrigger>
                  <TabsTrigger value="labor">Mão de Obra</TabsTrigger>
                  <TabsTrigger value="extras">Extras</TabsTrigger>
                  <TabsTrigger value="pricing">Margem</TabsTrigger>
                </TabsList>
                <div className="relative mt-4 min-h-[350px]">
                  <TabsContent value="basic-info" className="absolute inset-0 space-y-4 pt-4 p-4 rounded-lg border bg-muted/50 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="printName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Impressão *</FormLabel>
                          <FormControl><Input placeholder="ex: Peça de Reposição" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="printerId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impressora *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="w-1/2"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>{printers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="electricityProfileId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfil Energia</FormLabel>
                          <Select onValueChange={(val) => {
                            field.onChange(val);
                            const prof = electricityProfiles.find(p => p.id === val);
                            if (prof) form.setValue("electricityCostPerHour", prof.costPerHour);
                          }} value={field.value}>
                            <FormControl><SelectTrigger className="w-1/2"><SelectValue placeholder="Personalizado..." /></SelectTrigger></FormControl>
                            <SelectContent>{electricityProfiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="space-y-4">
                      <FormLabel>Filamentos Utilizados *</FormLabel>
                      {filamentFields.map((field, index) => (
                        <FilamentField key={field.id} index={index} namePrefix="filamentsUsed" onRemove={removeFilament} />
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => appendFilament({ filamentId: "", grams: 0 })} 
                        className="w-full flex items-center gap-2"
                      >
                        <PlusCircle className="h-4 w-4" /> Adicionar Filamento
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Tempo de Impressão *</FormLabel>
                      <div className="flex gap-2">
                        <FormField control={form.control} name="printTimeHours" render={({ field }) => (
                          <FormItem className="w-24">
                            <div className="relative">
                              <FormControl><Input type="number" min="0" className="pr-6" {...field} /></FormControl>
                              <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="printTimeMinutes" render={({ field }) => (
                          <FormItem className="w-24">
                            <div className="relative">
                              <FormControl><Input type="number" min="0" max="59" className="pr-8" {...field} /></FormControl>
                              <span className="absolute right-2 top-2 text-xs text-muted-foreground">min</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="labor" className="absolute inset-0 space-y-4 pt-4 p-4 rounded-lg border bg-muted/50 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="laborCostPerHour" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Hora Mão de Obra (€/h)</FormLabel>
                          <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="space-y-2">
                        <FormLabel>Tempo de Trabalho</FormLabel>
                        <div className="flex gap-2">
                          <FormField control={form.control} name="laborTimeHours" render={({ field }) => (
                            <FormItem className="w-24">
                              <div className="relative">
                                <FormControl><Input type="number" min="0" className="pr-6" {...field} /></FormControl>
                                <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="laborTimeMinutes" render={({ field }) => (
                            <FormItem className="w-24">
                              <div className="relative">
                                <FormControl><Input type="number" min="0" max="59" className="pr-8" {...field} /></FormControl>
                                <span className="absolute right-2 top-2 text-xs text-muted-foreground">min</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="extras" className="absolute inset-0 space-y-4 pt-4 p-4 rounded-lg border bg-muted/50 overflow-y-auto">
                    {extraFields.map((field, index) => (<ExtraMaterialField key={field.id} index={index} namePrefix="extras" onRemove={removeExtra} />))}
                    <Button type="button" variant="outline" onClick={() => appendExtra({ materialId: "", quantity: 0 })} className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Material Extra</Button>
                  </TabsContent>
                  <TabsContent value="pricing" className="absolute inset-0 space-y-4 pt-4 p-4 rounded-lg border bg-muted/50 overflow-y-auto">
                    <FormField control={form.control} name="profitMargin" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margem de Lucro (%)</FormLabel>
                        <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </TabsContent>
                </div>
              </Tabs>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 py-6 text-lg font-bold"><Save className="h-5 w-5 mr-2" /> Guardar e Ver Resumo</Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t bg-muted/30 py-6 px-8 rounded-b-lg">
          <p className="text-xl font-medium">Total Estimado:</p>
          <p className="text-3xl font-black text-primary">€{calculatedTotalPrice.toFixed(2)}</p>
        </CardFooter>
      </Card>
      <PaymentSummaryDialog 
        isOpen={isSummaryDialogOpen} 
        onOpenChange={setIsSummaryDialogOpen} 
        data={summaryData} 
        onDelete={handleDeleteLastCalculation}
      />
    </div>
  );
};

export default CalculatorPage;