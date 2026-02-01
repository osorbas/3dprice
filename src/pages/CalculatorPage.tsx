"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, Save, PlusCircle, History, Eraser, FileCode, Upload, Trash2, AlertTriangle } from "lucide-react"; 
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { showSuccess, showError } from "@/utils/toast";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { ExtraMaterialField } from "@/components/calculator/ExtraMaterialField";
import { FilamentUsageField } from "@/components/calculator/FilamentUsageField";
import { PaymentSummaryDialog } from "@/components/calculator/PaymentSummaryDialog";
import { StartTimerDialog } from "@/components/calculator/StartTimerDialog";
import { ProjectPartField } from "@/components/calculator/ProjectPartField";
import { parseGCodeMetadata } from "@/utils/gcode-parser";

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
  printerId: z.string().min(1, "Selecione uma impressora."),
  filamentsUsed: z.array(filamentUsageSchema).min(1, "Adicione filamento."),
  printTimeHours: z.coerce.number().min(0),
  printTimeMinutes: z.coerce.number().min(0).max(59),
  electricityProfileId: z.string().optional(),
  electricityCostPerHour: z.coerce.number().min(0),
  isConfirmed: z.boolean().default(false),
});

const formSchema = z.object({
  printName: z.string().min(1, "O nome é obrigatório."),
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
  projectParts: z.array(projectPartSchema).optional(),
});

const CalculatorPage = () => {
  const { addCalculation } = usePrintCalculations();
  const { printers, updatePrinter } = usePrinters();
  const { filaments, subtractStock } = useFilaments();
  const { extraMaterials } = useExtraMaterials();
  const { electricityProfiles } = useElectricityProfiles();

  const [activeTab, setActiveTab] = useState<"single-print" | "project">("single-print");
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [isBusyPrinterAlertOpen, setIsBusyPrinterAlertOpen] = useState(false);
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [pendingTimerData, setPendingTimerData] = useState<{ printerId: string, duration: number } | null>(null);
  const [busyPrinterInfo, setBusyPrinterInfo] = useState<{ id: string, name: string, onChange: (val: string) => void } | null>(null);
  const [openPartStates, setOpenPartStates] = useState<boolean[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar predefinições
  const defaults = useMemo(() => {
    if (typeof window === "undefined") return { printerId: "", filamentId: "", profitMargin: DEFAULT_PROFIT_MARGIN, electricityProfileId: "", electricityCostPerHour: 0.15 };
    const pId = localStorage.getItem("default_printer_id");
    const fId = localStorage.getItem("default_filament_id");
    const eId = localStorage.getItem("default_electricity_profile_id");
    const margin = localStorage.getItem("default_profit_margin");
    
    const eProfile = electricityProfiles.find(p => p.id === eId);
    
    return {
      printerId: pId && pId !== "none" ? pId : "",
      filamentId: fId && fId !== "none" ? fId : "",
      profitMargin: margin ? parseFloat(margin) : DEFAULT_PROFIT_MARGIN,
      electricityProfileId: eId && eId !== "none" ? eId : "",
      electricityCostPerHour: eProfile ? eProfile.costPerHour : 0.15,
    };
  }, [electricityProfiles]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printName: "", 
      printerId: defaults.printerId, 
      filamentsUsed: [{ filamentId: defaults.filamentId, filamentGrams: 0 }],
      printTimeHours: 0, 
      printTimeMinutes: 0, 
      electricityProfileId: defaults.electricityProfileId, 
      electricityCostPerHour: defaults.electricityCostPerHour,
      laborCostPerHour: 10, 
      laborTimeHours: 0, 
      laborTimeMinutes: 0, 
      profitMargin: defaults.profitMargin,
      extras: [], 
      projectParts: [],
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

  const watchedValues = form.watch();

  useEffect(() => {
    if (projectPartFields.length !== openPartStates.length) {
      setOpenPartStates(prev => {
        const newStates = Array(projectPartFields.length).fill(false);
        for (let i = 0; i < prev.length && i < projectPartFields.length; i++) {
          newStates[i] = prev[i];
        }
        if (projectPartFields.length > 0 && projectPartFields.length > prev.length) {
            newStates[projectPartFields.length - 1] = true;
        }
        return newStates;
      });
    }
  }, [projectPartFields.length]);


  const totals = useMemo(() => {
    let materialCost = 0;
    let electricityCost = 0;
    let laborCost = 0;
    let extrasCost = 0;
    let totalPrintTime = 0;
    let totalFilamentGrams = 0;

    extrasCost = watchedValues.extras?.reduce((acc, ex) => {
      const material = extraMaterials.find(m => m.id === ex.materialId);
      return acc + (material ? material.costPerUnit * Number(ex.quantity || 0) : 0);
    }, 0) || 0;

    if (activeTab === "single-print") {
      watchedValues.filamentsUsed?.forEach(f => {
        const filament = filaments.find(fil => fil.id === f.filamentId);
        const grams = Number(f.filamentGrams || 0);
        if (filament) materialCost += (filament.pricePerKg / 1000) * grams;
        totalFilamentGrams += grams;
      });
      const hours = Number(watchedValues.printTimeHours || 0) + (Number(watchedValues.printTimeMinutes || 0) / 60);
      electricityCost = hours * Number(watchedValues.electricityCostPerHour || 0);
      totalPrintTime = hours;
    } else {
      watchedValues.projectParts?.forEach(part => {
        part.filamentsUsed.forEach(f => {
          const filament = filaments.find(fil => fil.id === f.filamentId);
          const grams = Number(f.filamentGrams || 0);
          if (filament) materialCost += (filament.pricePerKg / 1000) * grams;
          totalFilamentGrams += grams;
        });
        const hours = Number(part.printTimeHours || 0) + (Number(part.printTimeMinutes || 0) / 60);
        electricityCost += hours * Number(part.electricityCostPerHour || 0);
        totalPrintTime += hours;
      });
    }

    laborCost = (Number(watchedValues.laborTimeHours || 0) + (Number(watchedValues.laborTimeMinutes || 0) / 60)) * Number(watchedValues.laborCostPerHour || 0);
    
    const baseCost = materialCost + electricityCost + laborCost + extrasCost;
    const profitAmount = baseCost * (Number(watchedValues.profitMargin || 0) / 100);
    const totalPrice = baseCost + profitAmount;

    return { materialCost, electricityCost, laborCost, extrasCost, baseCost, profitAmount, totalPrice, totalPrintTime, totalFilamentGrams };
  }, [watchedValues, filaments, extraMaterials, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const metadata = parseGCodeMetadata(content);
      if (metadata.filamentGrams) {
        if (activeTab === "single-print") {
          form.setValue("filamentsUsed.0.filamentGrams", parseFloat(metadata.filamentGrams.toFixed(2)));
        }
      }
      if (metadata.totalTimeSeconds) {
        const h = Math.floor(metadata.totalTimeSeconds / 3600);
        const m = Math.floor((metadata.totalTimeSeconds % 3600) / 60);
        if (activeTab === "single-print") {
          form.setValue("printTimeHours", h);
          form.setValue("printTimeMinutes", m);
        }
      }
      showSuccess("Dados importados do G-code com sucesso!");
    };
    reader.readAsText(file);
  };

  const handleConfirmPart = (index: number, confirmed: boolean) => {
    form.setValue(`projectParts.${index}.isConfirmed`, confirmed);
    const newOpenStates = [...openPartStates];
    newOpenStates[index] = !confirmed;
    setOpenPartStates(newOpenStates);
  };

  const handlePrinterChange = (printerId: string, fieldOnChange: (val: string) => void) => {
    const printer = printers.find(p => p.id === printerId);
    if (printer?.status === "Ocupada") {
      setBusyPrinterInfo({ id: printerId, name: printer.name, onChange: fieldOnChange });
      setIsBusyPrinterAlertOpen(true);
    } else {
      fieldOnChange(printerId);
    }
  };

  const confirmBusyPrinterSelection = () => {
    if (busyPrinterInfo) {
      busyPrinterInfo.onChange(busyPrinterInfo.id);
    }
    setIsBusyPrinterAlertOpen(false);
    setBusyPrinterInfo(null);
  };

  const handleCloseSummary = (open: boolean) => {
    setIsSummaryDialogOpen(open);
    
    if (!open) {
      if (pendingTimerData) {
        setIsTimerDialogOpen(true);
      } else {
        form.reset({
          printName: "", 
          printerId: defaults.printerId, 
          filamentsUsed: [{ filamentId: defaults.filamentId, filamentGrams: 0 }],
          printTimeHours: 0, 
          printTimeMinutes: 0, 
          electricityProfileId: defaults.electricityProfileId, 
          electricityCostPerHour: defaults.electricityCostPerHour,
          laborCostPerHour: 10, 
          laborTimeHours: 0, 
          laborTimeMinutes: 0, 
          profitMargin: defaults.profitMargin,
          extras: [], 
          projectParts: [],
        });
        setOpenPartStates([]);
      }
    }
  };

  const handleStartTimer = () => {
    if (pendingTimerData) {
      const now = Date.now();
      updatePrinter(pendingTimerData.printerId, {
        status: "Ocupada",
        timerStart: now,
        timerEnd: now + (pendingTimerData.duration * 3600000)
      });
      showSuccess("Temporizador ativado!");
    }
    setPendingTimerData(null);
    form.reset({
      printName: "", 
      printerId: defaults.printerId, 
      filamentsUsed: [{ filamentId: defaults.filamentId, filamentGrams: 0 }],
      printTimeHours: 0, 
      printTimeMinutes: 0, 
      electricityProfileId: defaults.electricityProfileId, 
      electricityCostPerHour: defaults.electricityCostPerHour,
      laborCostPerHour: 10, 
      laborTimeHours: 0, 
      laborTimeMinutes: 0, 
      profitMargin: defaults.profitMargin,
      extras: [], 
      projectParts: [],
    });
    setOpenPartStates([]);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (activeTab === "project") {
      if (!values.projectParts || values.projectParts.length === 0) {
        showError("Adicione pelo menos uma parte ao projeto.");
        return;
      }
      const allPartsConfirmed = values.projectParts.every(part => part.isConfirmed);
      if (!allPartsConfirmed) {
        showError("Confirme todas as partes do projeto antes de guardar.");
        return;
      }
    }

    const selectedPrinterId = activeTab === "single-print" ? values.printerId : values.projectParts?.[0]?.printerId;
    const printer = printers.find(p => p.id === selectedPrinterId);
    
    if (printer?.status === "Em Manutenção") {
      showError(`A impressora ${printer.name} está em manutenção.`);
      return;
    }

    const projectPartsDetails = activeTab === "project" ? values.projectParts?.map(part => {
      let partMatCost = 0;
      let partGrams = 0;
      part.filamentsUsed.forEach(f => {
        const filament = filaments.find(fil => fil.id === f.filamentId);
        const grams = Number(f.filamentGrams || 0);
        if (filament) partMatCost += (filament.pricePerKg / 1000) * grams;
        partGrams += grams;
      });
      const partHours = Number(part.printTimeHours || 0) + (Number(part.printTimeMinutes || 0) / 60);
      const partElecCost = partHours * Number(part.electricityCostPerHour || 0);

      return {
        partName: part.partName,
        printerId: part.printerId,
        materialCost: parseFloat(partMatCost.toFixed(2)),
        printTimeHours: parseFloat(partHours.toFixed(2)),
        electricityCost: parseFloat(partElecCost.toFixed(2)),
        filamentGrams: parseFloat(partGrams.toFixed(2)),
        filamentId: part.filamentsUsed[0]?.filamentId || "",
        totalPrice: parseFloat((partMatCost + partElecCost).toFixed(2)),
        filaments: part.filamentsUsed.map(f => ({
          filamentId: f.filamentId,
          grams: Number(f.filamentGrams || 0)
        })),
      };
    }) : [];

    if (localStorage.getItem("manage_filament_stock") === "true") {
      if (activeTab === "single-print") {
        values.filamentsUsed?.forEach(f => subtractStock(f.filamentId, Number(f.filamentGrams || 0)));
      } else {
        values.projectParts?.forEach(part => {
          part.filamentsUsed.forEach(f => subtractStock(f.filamentId, Number(f.filamentGrams || 0)));
        });
      }
    }

    const calculationData: Omit<PrintCalculation, "id" | "timestamp"> = {
      materialCost: totals.materialCost,
      printTimeHours: totals.totalPrintTime,
      electricityCost: totals.electricityCost,
      laborCost: totals.laborCost,
      extraCost: totals.extrasCost,
      profitMargin: Number(values.profitMargin || 0),
      totalPrice: totals.totalPrice,
      filamentGrams: totals.totalFilamentGrams,
      filamentId: values.filamentsUsed?.[0]?.filamentId || "",
      isProject: activeTab === "project",
      printName: values.printName,
      projectName: activeTab === "project" ? values.printName : undefined,
      printerId: values.printerId,
      projectParts: projectPartsDetails as any,
      filaments: activeTab === "single-print" ? values.filamentsUsed?.map(f => ({
        filamentId: f.filamentId,
        grams: Number(f.filamentGrams || 0)
      })) : undefined,
    };

    addCalculation(calculationData);

    setSummaryData({
      id: Date.now().toString(),
      printName: values.printName,
      ...totals,
      profitMargin: Number(values.profitMargin || 0)
    });

    if (selectedPrinterId && printer?.status === "Pronta") {
      setPendingTimerData({ printerId: selectedPrinterId, duration: totals.totalPrintTime });
    } else {
      setPendingTimerData(null);
    }

    setIsSummaryDialogOpen(true);
  };

  return (
    <div className="flex flex-col items-center p-4 max-w-5xl mx-auto w-full">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calculadora de Preço</h1>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList>
            <TabsTrigger value="single-print">Individual</TabsTrigger>
            <TabsTrigger value="project">Projeto</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalhes do {activeTab === "single-print" ? "Cálculo" : "Projeto"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="printName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome {activeTab === "single-print" ? "da Impressão" : "do Projeto"} *</FormLabel>
                    <FormControl><Input placeholder={activeTab === "single-print" ? "ex: Darth Vader" : "ex: Armadura Iron Man"} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {activeTab === "single-print" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="printerId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impressora</FormLabel>
                          <Select onValueChange={(val) => handlePrinterChange(val, field.onChange)} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>{printers.map(p => <SelectItem key={p.id} value={p.id} disabled={p.status === "Em Manutenção"}>{p.name} {p.status === "Em Manutenção" ? "(Manutenção)" : p.status === "Ocupada" ? "(Ocupada)" : ""}</SelectItem>)}</SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="electricityProfileId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfil Energia</FormLabel>
                          <Select onValueChange={(val) => { field.onChange(val); const p = electricityProfiles.find(ep => ep.id === val); if(p) form.setValue("electricityCostPerHour", p.costPerHour); }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>{electricityProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Filamentos Usados</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendSingleFilament({ filamentId: defaults.filamentId, filamentGrams: 0 })}><PlusCircle className="h-4 w-4 mr-1" /> Adicionar</Button>
                      </div>
                      {singleFilamentFields.map((field, idx) => (
                        <FilamentUsageField key={field.id} index={idx} totalFields={singleFilamentFields.length} onRemove={removeSingleFilament} namePrefix="filamentsUsed" />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel>Tempo de Impressão</FormLabel>
                        <div className="flex gap-2">
                          <FormField control={form.control} name="printTimeHours" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input type="number" placeholder="Horas" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="printTimeMinutes" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input type="number" max="59" placeholder="Min" {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" /> Importar G-code</Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".gcode" onChange={handleFileUpload} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {projectPartFields.map((field, idx) => (
                      <ProjectPartField
                        key={field.id}
                        index={idx}
                        namePrefix="projectParts"
                        onRemove={removeProjectPart}
                        printers={printers}
                        filaments={filaments}
                        electricityProfiles={electricityProfiles}
                        defaultFilamentId={defaults.filamentId || filaments[0]?.id || ""}
                        isConfirmed={watchedValues.projectParts?.[idx]?.isConfirmed || false}
                        onConfirmPart={handleConfirmPart}
                        isAccordionOpen={openPartStates[idx] || false}
                        setIsAccordionOpen={(open) => { const s = [...openPartStates]; s[idx] = open; setOpenPartStates(s); }}
                      />
                    ))}
                    <Button type="button" variant="outline" className="w-full gap-2" onClick={() => { appendProjectPart({ partName: "", printerId: defaults.printerId, filamentsUsed: [{ filamentId: defaults.filamentId, filamentGrams: 0 }], printTimeHours: 0, printTimeMinutes: 0, electricityCostPerHour: defaults.electricityCostPerHour, isConfirmed: false }); setOpenPartStates([...openPartStates, true]); }}>
                      <PlusCircle className="h-4 w-4" /> Adicionar Parte
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">Mão de Obra e Extras</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="laborCostPerHour" render={({ field }) => (
                    <FormItem><FormLabel>Custo Mão de Obra (€/h)</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="laborTimeHours" render={({ field }) => (
                    <FormItem><FormLabel>Horas Mão de Obra</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="laborTimeMinutes" render={({ field }) => (
                    <FormItem><FormLabel>Min Mão de Obra</FormLabel><FormControl><Input type="number" max="59" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Materiais Extras</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSingleExtra({ materialId: "", quantity: 0 })}><PlusCircle className="h-4 w-4 mr-1" /> Adicionar</Button>
                  </div>
                  {singleExtraFields.map((field, idx) => (
                    <ExtraMaterialField key={field.id} index={idx} namePrefix="extras" onRemove={removeSingleExtra} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-4 border-primary/20 shadow-primary/5">
              <CardHeader className="bg-primary/5"><CardTitle>Resumo do Orçamento</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Filamento:</span><span>€{totals.materialCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Energia:</span><span>€{totals.electricityCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Mão de Obra:</span><span>€{totals.laborCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Extras:</span><span>€{totals.extrasCost.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Custo Base:</span><span>€{totals.baseCost.toFixed(2)}</span></div>
                </div>

                <FormField control={form.control} name="profitMargin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem de Lucro (%)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Preço Final Estimado</div>
                  <div className="text-3xl font-black text-primary">€{totals.totalPrice.toFixed(2)}</div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 font-bold h-12">Guardar e Resumo</Button>
                <Button type="button" variant="ghost" onClick={() => { form.reset(); setOpenPartStates([]); }} className="w-full text-muted-foreground"><Eraser className="h-4 w-4 mr-2" /> Limpar Tudo</Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>

      <PaymentSummaryDialog isOpen={isSummaryDialogOpen} onOpenChange={handleCloseSummary} data={summaryData} onDelete={() => {}} />
      <StartTimerDialog 
        isOpen={isTimerDialogOpen} 
        onOpenChange={(open) => {
          setIsTimerDialogOpen(open);
          if (!open) {
            setPendingTimerData(null);
            form.reset({
              printName: "", 
              printerId: defaults.printerId, 
              filamentsUsed: [{ filamentId: defaults.filamentId, filamentGrams: 0 }],
              printTimeHours: 0, 
              printTimeMinutes: 0, 
              electricityProfileId: defaults.electricityProfileId, 
              electricityCostPerHour: defaults.electricityCostPerHour,
              laborCostPerHour: 10, 
              laborTimeHours: 0, 
              laborTimeMinutes: 0, 
              profitMargin: defaults.profitMargin,
              extras: [], 
              projectParts: [],
            });
            setOpenPartStates([]);
          }
        }} 
        printer={printers.find(p => p.id === pendingTimerData?.printerId)} 
        durationHours={pendingTimerData?.duration || 0} 
        onConfirm={handleStartTimer} 
      />
      
      <AlertDialog open={isBusyPrinterAlertOpen} onOpenChange={setIsBusyPrinterAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Impressora Ocupada
            </AlertDialogTitle>
            <AlertDialogDescription>
              A impressora <strong>{busyPrinterInfo?.name}</strong> está atualmente a realizar outra impressão. 
              Tens a certeza que a queres selecionar para este novo cálculo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBusyPrinterInfo(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBusyPrinterSelection} className="bg-orange-500 hover:bg-orange-600">
              Sim, utilizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalculatorPage;