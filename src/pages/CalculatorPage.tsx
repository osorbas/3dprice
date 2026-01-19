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

import { usePrintCalculations, PrintCalculation, ProjectPartDetail } from "@/hooks/use-print-calculations";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { ExtraMaterialField } from "@/components/calculator/ExtraMaterialField";
import { FilamentUsageField } from "@/components/calculator/FilamentUsageField";
import { PaymentSummaryDialog } from "@/components/calculator/PaymentSummaryDialog";
import { parseGCodeMetadata } from "@/utils/gcode-parser";
import { ProjectPartField } from "@/components/calculator/ProjectPartPartField";

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

const formSchema = z.object({
  // Fields for single print
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

  // Fields for project
  projectName: z.string().optional(),
  projectParts: z.array(projectPartSchema).optional(),
}).superRefine((data, ctx) => {
  // Conditional validation based on active tab (managed by `activeTab` state)
  // This schema is broad, actual validation will be triggered by form.trigger() on submit
  // and controlled by the UI's activeTab.
  // For Zod's resolver, we'll ensure basic structure.
  // More specific validation for required fields will be handled by the UI's activeTab logic.
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
  const [activeTab, setActiveTab] = useState<"single-print" | "project">("single-print");

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
      printerId: "",
      filamentsUsed: [{ filamentId: "", filamentGrams: 0 }],
      printTimeHours: 0,
      printTimeMinutes: 0,
      electricityProfileId: "",
      electricityCostPerHour: 0.15,
      laborCostPerHour: 10,
      laborTimeHours: 0,
      laborTimeMinutes: 0,
      profitMargin: DEFAULT_PROFIT_MARGIN,
      extras: [],
      projectName: "",
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

  // Effect to set default values when component mounts or activeTab changes
  useEffect(() => {
    const resetDefaults = () => {
      const targetProfileId = defaultElectricityProfileId || "default-normal";
      const prof = electricityProfiles.find(p => p.id === targetProfileId) || 
                   electricityProfiles.find(p => p.name.includes("Tarifa Normal"));
      
      if (activeTab === "single-print") {
        form.reset({
          printName: "",
          printerId: defaultPrinterId || "",
          filamentsUsed: [{ filamentId: defaultFilamentId || "", filamentGrams: 0 }],
          printTimeHours: 0,
          printTimeMinutes: 0,
          electricityProfileId: prof?.id || "",
          electricityCostPerHour: prof?.costPerHour || 0.15,
          laborCostPerHour: 10,
          laborTimeHours: 0,
          laborTimeMinutes: 0,
          profitMargin: defaultProfitMargin,
          extras: [],
          projectName: "", // Clear project fields
          projectParts: [], // Clear project parts
        });
      } else { // activeTab === "project"
        form.reset({
          printName: "", // Clear single print fields
          printerId: "",
          filamentsUsed: [],
          printTimeHours: 0,
          printTimeMinutes: 0,
          electricityProfileId: "",
          electricityCostPerHour: 0.15,
          laborCostPerHour: 10,
          laborTimeHours: 0,
          laborTimeMinutes: 0,
          profitMargin: DEFAULT_PROFIT_MARGIN,
          extras: [],
          projectName: "",
          projectParts: [{
            partName: "",
            printerId: defaultPrinterId || "",
            filamentsUsed: [{ filamentId: defaultFilamentId || "", filamentGrams: 0 }],
            printTimeHours: 0,
            printTimeMinutes: 0,
            electricityProfileId: prof?.id || "",
            electricityCostPerHour: prof?.costPerHour || 0.15,
            laborCostPerHour: 10,
            laborTimeHours: 0,
            laborTimeMinutes: 0,
            profitMargin: defaultProfitMargin,
            extras: [],
          }],
        });
      }
    };
    resetDefaults();
  }, [activeTab, defaultPrinterId, defaultFilamentId, defaultElectricityProfileId, defaultProfitMargin, electricityProfiles, form]);


  const watchedValues = form.watch();
  
  const calculatePartCosts = (part: z.infer<typeof projectPartSchema>) => {
    const partFilamentsCost = (part.filamentsUsed || []).reduce((sum, f) => {
      const material = filaments.find(mat => mat.id === f.filamentId);
      const grams = parseFloat(String(f.filamentGrams)) || 0;
      if (material) {
        return sum + ((material.pricePerKg / 1000) * grams);
      }
      return sum;
    }, 0);

    const partPrintTimeHours = (Number(part.printTimeHours) || 0) + (Number(part.printTimeMinutes) || 0) / 60;
    const partElectricityCostPerHour = Number(part.electricityCostPerHour) || 0;
    const partLaborCostPerHour = Number(part.laborCostPerHour) || 0;
    const partLaborTimeHours = (Number(part.laborTimeHours) || 0) + (Number(part.laborTimeMinutes) || 0) / 60;
    const partProfitMargin = Number(part.profitMargin) || 0;

    const partCalculatedElectricityCost = partPrintTimeHours * partElectricityCostPerHour;
    const partCalculatedLaborCost = partLaborTimeHours * partLaborCostPerHour;

    const partCalculatedExtraCost = (part.extras || []).reduce((sum, extra) => {
      const material = extraMaterials.find(mat => mat.id === extra.materialId);
      const qty = parseFloat(String(extra.quantity)) || 0;
      if (material) return sum + (material.costPerUnit * qty);
      return sum;
    }, 0);

    const partCalculatedBaseCost = partFilamentsCost + partCalculatedElectricityCost + partCalculatedLaborCost + partCalculatedExtraCost;
    const partCalculatedProfit = partCalculatedBaseCost * (partProfitMargin / 100);
    const partTotalPrice = isNaN(partCalculatedBaseCost) ? 0 : (partCalculatedBaseCost + partCalculatedProfit);

    const totalGrams = (part.filamentsUsed || []).reduce((sum, f) => sum + (f.filamentGrams || 0), 0);

    return {
      materialCost: partFilamentsCost,
      printTimeHours: partPrintTimeHours,
      electricityCost: partCalculatedElectricityCost,
      laborCost: partCalculatedLaborCost,
      extraCost: partCalculatedExtraCost,
      profitMargin: partProfitMargin,
      totalPrice: partTotalPrice,
      filamentGrams: totalGrams,
      filamentId: part.filamentsUsed?.[0]?.filamentId || "",
      filaments: part.filamentsUsed?.map(f => ({ filamentId: f.filamentId, grams: f.filamentGrams })) || [],
      extras: part.extras?.map(e => ({ materialId: e.materialId, quantity: e.quantity, cost: extraMaterials.find(em => em.id === e.materialId)?.costPerUnit || 0 })) || [],
    };
  };

  const calculatedTotalPrice = useMemo(() => {
    let total = 0;
    if (activeTab === "single-print") {
      // Cálculo do custo de todos os filamentos
      const filamentsCost = (watchedValues.filamentsUsed || []).reduce((sum, f) => {
        const material = filaments.find(mat => mat.id === f.filamentId);
        const grams = parseFloat(String(f.filamentGrams)) || 0;
        if (material) {
          return sum + ((material.pricePerKg / 1000) * grams);
        }
        return sum;
      }, 0);

      const currentPrintTimeHours = (Number(watchedValues.printTimeHours) || 0) + (Number(watchedValues.printTimeMinutes) || 0) / 60;
      const currentElectricityCostPerHour = Number(watchedValues.electricityCostPerHour) || 0;
      const currentLaborCostPerHour = Number(watchedValues.laborCostPerHour) || 0;
      const currentLaborTimeHours = (Number(watchedValues.laborTimeHours) || 0) + (Number(watchedValues.laborTimeMinutes) || 0) / 60;
      const currentProfitMargin = Number(watchedValues.profitMargin) || 0;

      const calculatedElectricityCost = currentPrintTimeHours * currentElectricityCostPerHour;
      const calculatedLaborCost = currentLaborTimeHours * currentLaborCostPerHour;

      const calculatedExtraCost = (watchedValues.extras || []).reduce((sum, extra) => {
        const material = extraMaterials.find(mat => mat.id === extra.materialId);
        const qty = parseFloat(String(extra.quantity)) || 0;
        if (material) return sum + (material.costPerUnit * qty);
        return sum;
      }, 0);

      const calculatedBaseCost = filamentsCost + calculatedElectricityCost + calculatedLaborCost + calculatedExtraCost;
      const calculatedProfit = calculatedBaseCost * (currentProfitMargin / 100);
      
      total = isNaN(calculatedBaseCost) ? 0 : (calculatedBaseCost + calculatedProfit);
    } else { // activeTab === "project"
      total = (watchedValues.projectParts || []).reduce((sum, part) => {
        const partCosts = calculatePartCosts(part);
        return sum + partCosts.totalPrice;
      }, 0);
    }
    return total;
  }, [watchedValues, filaments, extraMaterials, activeTab]);

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
        form.setValue("filamentsUsed.0.filamentGrams", parseFloat(metadata.filamentGrams.toFixed(2)));
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
    let newCalculation: Omit<PrintCalculation, "id" | "timestamp">;
    let totalPrintTimeHours = 0;
    let totalFilamentGrams = 0;
    let totalMaterialCost = 0;
    let totalElectricityCost = 0;
    let totalLaborCost = 0;
    let totalExtraCost = 0;
    let overallProfitMargin = 0;
    let baseCost = 0;
    let profit = 0;
    let finalPrice = 0;

    if (activeTab === "single-print") {
      // Validate single print fields
      const singlePrintValidation = z.object({
        printName: z.string().min(1, "O nome da impressão é obrigatório."),
        printerId: z.string().min(1, "Selecione uma impressora."),
        filamentsUsed: z.array(filamentUsageSchema).min(1, "Adicione pelo menos um filamento."),
        printTimeHours: z.coerce.number().min(0, "Horas não podem ser negativas."),
        printTimeMinutes: z.coerce.number().min(0, "Minutos não podem ser negativos.").max(59, "Minutos não podem exceder 59."),
        electricityProfileId: z.string().optional(), 
        electricityCostPerHour: z.coerce.number().min(0, "O custo da eletricidade não pode ser negativo."),
        laborCostPerHour: z.coerce.number().min(0, "O custo da mão de obra não pode ser negativo."),
        laborTimeHours: z.coerce.number().min(0, "Horas não podem ser negativas."),
        laborTimeMinutes: z.coerce.number().min(0, "Minutos não podem ser negativos.").max(59, "Minutos não podem exceder 59."),
        profitMargin: z.coerce.number().min(0, "A margem de lucro não pode ser negativa."),
        extras: z.array(extraSchema).optional(),
      }).safeParse(values);

      if (!singlePrintValidation.success) {
        singlePrintValidation.error.errors.forEach(err => {
          form.setError(err.path.join('.') as any, { message: err.message });
        });
        showError("Por favor, preencha todos os campos obrigatórios para a impressão única.");
        return;
      }

      const validatedValues = singlePrintValidation.data;

      totalFilamentGrams = (validatedValues.filamentsUsed || []).reduce((sum, f) => sum + f.filamentGrams, 0);
      totalMaterialCost = (validatedValues.filamentsUsed || []).reduce((sum, f) => {
        const material = filaments.find(mat => mat.id === f.filamentId);
        return material ? sum + ((material.pricePerKg / 1000) * f.filamentGrams) : sum;
      }, 0);

      totalPrintTimeHours = validatedValues.printTimeHours + (validatedValues.printTimeMinutes / 60);
      const totalLaborTimeHours = validatedValues.laborTimeHours + (validatedValues.laborTimeMinutes / 60);
      totalElectricityCost = totalPrintTimeHours * (validatedValues.electricityCostPerHour || 0);
      totalLaborCost = totalLaborTimeHours * (validatedValues.laborCostPerHour || 0);

      totalExtraCost = (validatedValues.extras || []).reduce((sum, extra) => {
        const material = extraMaterials.find(mat => mat.id === extra.materialId);
        return material ? sum + (material.costPerUnit * extra.quantity) : sum;
      }, 0);

      baseCost = totalMaterialCost + totalElectricityCost + totalLaborCost + totalExtraCost;
      overallProfitMargin = validatedValues.profitMargin;
      profit = baseCost * (overallProfitMargin / 100);
      finalPrice = baseCost + profit;

      newCalculation = {
        printName: validatedValues.printName,
        printerId: validatedValues.printerId,
        materialCost: parseFloat(totalMaterialCost.toFixed(2)),
        printTimeHours: parseFloat(totalPrintTimeHours.toFixed(1)),
        electricityCost: parseFloat(totalElectricityCost.toFixed(2)),
        laborCost: parseFloat(totalLaborCost.toFixed(2)),
        extraCost: parseFloat(totalExtraCost.toFixed(2)),
        profitMargin: overallProfitMargin,
        totalPrice: parseFloat(finalPrice.toFixed(2)),
        filamentGrams: totalFilamentGrams,
        filamentId: validatedValues.filamentsUsed?.[0]?.filamentId || "",
        filaments: validatedValues.filamentsUsed?.map(f => ({ filamentId: f.filamentId, grams: f.filamentGrams })) || [],
        isProject: false,
      };

      const selectedPrinter = printers.find(p => p.id === validatedValues.printerId);
      if (selectedPrinter) {
        updatePrinter(selectedPrinter.id, {
          workingHours: selectedPrinter.workingHours + totalPrintTimeHours,
        });
      }

    } else { // activeTab === "project"
      // Validate project fields
      const projectValidation = z.object({
        projectName: z.string().min(1, "O nome do projeto é obrigatório."),
        projectParts: z.array(projectPartSchema).min(1, "Adicione pelo menos uma parte ao projeto."),
      }).safeParse(values);

      if (!projectValidation.success) {
        projectValidation.error.errors.forEach(err => {
          form.setError(err.path.join('.') as any, { message: err.message });
        });
        showError("Por favor, preencha todos os campos obrigatórios para o projeto.");
        return;
      }

      const validatedValues = projectValidation.data;
      const projectPartsDetails: ProjectPartDetail[] = [];
      let totalProjectBaseCost = 0;
      let totalProjectProfit = 0;
      let totalProjectProfitMarginSum = 0; // For average calculation

      validatedValues.projectParts.forEach(part => {
        const partCalculatedCosts = calculatePartCosts(part);
        projectPartsDetails.push({
          partName: part.partName,
          printerId: part.printerId,
          ...partCalculatedCosts,
        });

        totalMaterialCost += partCalculatedCosts.materialCost;
        totalPrintTimeHours += partCalculatedCosts.printTimeHours;
        totalElectricityCost += partCalculatedCosts.electricityCost;
        totalLaborCost += partCalculatedCosts.laborCost;
        totalExtraCost += partCalculatedCosts.extraCost;
        totalFilamentGrams += partCalculatedCosts.filamentGrams;
        totalProjectBaseCost += (partCalculatedCosts.totalPrice / (1 + part.profitMargin / 100)) || 0;
        totalProjectProfit += partCalculatedCosts.totalPrice - ((partCalculatedCosts.totalPrice / (1 + part.profitMargin / 100)) || 0);
        totalProjectProfitMarginSum += part.profitMargin;

        const selectedPrinter = printers.find(p => p.id === part.printerId);
        if (selectedPrinter) {
          updatePrinter(selectedPrinter.id, {
            workingHours: selectedPrinter.workingHours + partCalculatedCosts.printTimeHours,
          });
        }
      });

      baseCost = totalProjectBaseCost;
      profit = totalProjectProfit;
      finalPrice = baseCost + profit;
      overallProfitMargin = baseCost > 0 ? (profit / baseCost) * 100 : 0;

      newCalculation = {
        projectName: validatedValues.projectName,
        projectParts: projectPartsDetails,
        materialCost: parseFloat(totalMaterialCost.toFixed(2)),
        printTimeHours: parseFloat(totalPrintTimeHours.toFixed(1)),
        electricityCost: parseFloat(totalElectricityCost.toFixed(2)),
        laborCost: parseFloat(totalLaborCost.toFixed(2)),
        extraCost: parseFloat(totalExtraCost.toFixed(2)),
        profitMargin: parseFloat(overallProfitMargin.toFixed(0)),
        totalPrice: parseFloat(finalPrice.toFixed(2)),
        filamentGrams: totalFilamentGrams,
        filamentId: "", // Not applicable for overall project
        filaments: [], // Not applicable for overall project
        isProject: true,
      };
    }

    const tempId = Date.now().toString();
    addCalculation(newCalculation);

    setLastCalculationId(tempId); 
    setSummaryData({
      id: tempId,
      printName: newCalculation.isProject ? newCalculation.projectName : newCalculation.printName,
      materialCost: newCalculation.materialCost,
      electricityCost: newCalculation.electricityCost,
      laborCost: newCalculation.laborCost,
      extrasCost: newCalculation.extraCost,
      baseCost: baseCost,
      profitMargin: newCalculation.profitMargin,
      profitAmount: profit,
      totalPrice: newCalculation.totalPrice,
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
    }
    setLastCalculationId(null);
    setSummaryData(null);
  };

  const handleImportFromHistory = (calculation: PrintCalculation) => {
    const targetProfileId = defaultElectricityProfileId || "default-normal";
    const prof = electricityProfiles.find(p => p.id === targetProfileId) || 
                 electricityProfiles.find(p => p.name.includes("Tarifa Normal"));

    if (calculation.isProject && calculation.projectParts) {
      setActiveTab("project");
      form.reset({
        projectName: calculation.projectName || "",
        projectParts: calculation.projectParts.map(part => ({
          partName: part.partName,
          printerId: part.printerId || "",
          filamentsUsed: part.filaments || [{ filamentId: part.filamentId || "", filamentGrams: part.filamentGrams || 0 }],
          printTimeHours: Math.floor(part.printTimeHours),
          printTimeMinutes: Math.round((part.printTimeHours - Math.floor(part.printTimeHours)) * 60),
          electricityProfileId: electricityProfiles.find(p => p.costPerHour === (part.electricityCost / part.printTimeHours))?.id || prof?.id || "",
          electricityCostPerHour: part.electricityCost / part.printTimeHours || prof?.costPerHour || 0.15,
          laborCostPerHour: part.laborCost / (part.laborCost > 0 ? part.printTimeHours : 1) || 10, // Assuming labor cost is per print time hour if not explicitly stored
          laborTimeHours: Math.floor(part.printTimeHours), // Placeholder, actual labor time not stored
          laborTimeMinutes: Math.round((part.printTimeHours - Math.floor(part.printTimeHours)) * 60), // Placeholder
          profitMargin: part.profitMargin,
          extras: part.extras?.map(e => ({ materialId: e.materialId, quantity: e.quantity })) || [],
        })),
        // Clear single print fields
        printName: "", printerId: "", filamentsUsed: [], printTimeHours: 0, printTimeMinutes: 0,
        electricityProfileId: "", electricityCostPerHour: 0.15, laborCostPerHour: 10, laborTimeHours: 0, laborTimeMinutes: 0,
        profitMargin: DEFAULT_PROFIT_MARGIN, extras: [],
      });
    } else {
      setActiveTab("single-print");
      form.reset({
        printName: calculation.printName || "",
        printerId: calculation.printerId || "",
        filamentsUsed: calculation.filaments 
          ? calculation.filaments.map(f => ({ filamentId: f.filamentId, filamentGrams: f.grams }))
          : [{ filamentId: calculation.filamentId || "", filamentGrams: calculation.filamentGrams || 0 }],
        printTimeHours: Math.floor(calculation.printTimeHours),
        printTimeMinutes: Math.round((calculation.printTimeHours - Math.floor(calculation.printTimeHours)) * 60),
        electricityProfileId: electricityProfiles.find(p => p.costPerHour === (calculation.electricityCost / calculation.printTimeHours))?.id || prof?.id || "",
        electricityCostPerHour: calculation.electricityCost / calculation.printTimeHours || prof?.costPerHour || 0.15,
        laborCostPerHour: calculation.laborCost / (calculation.laborCost > 0 ? calculation.printTimeHours : 1) || 10, // Assuming labor cost is per print time hour if not explicitly stored
        laborTimeHours: Math.floor(calculation.printTimeHours), // Placeholder, actual labor time not stored
        laborTimeMinutes: Math.round((calculation.printTimeHours - Math.floor(calculation.printTimeHours)) * 60), // Placeholder
        profitMargin: calculation.profitMargin,
        extras: calculation.extraCost > 0 ? [{ materialId: "", quantity: 0 }] : [], // Placeholder for extras
        // Clear project fields
        projectName: "", projectParts: [],
      });
    }
    setIsHistoryDialogOpen(false);
  };

  const handleClearCalculator = () => {
    const targetProfileId = defaultElectricityProfileId || "default-normal";
    const prof = electricityProfiles.find(p => p.id === targetProfileId) || 
                 electricityProfiles.find(p => p.name.includes("Tarifa Normal"));
    
    if (activeTab === "single-print") {
      form.reset({
        printName: "",
        printerId: defaultPrinterId || "",
        filamentsUsed: [{ filamentId: defaultFilamentId || "", filamentGrams: 0 }],
        printTimeHours: 0,
        printTimeMinutes: 0,
        electricityProfileId: prof?.id || "",
        electricityCostPerHour: prof?.costPerHour || 0.15,
        laborCostPerHour: 10,
        laborTimeHours: 0,
        laborTimeMinutes: 0,
        profitMargin: defaultProfitMargin,
        extras: [],
        projectName: "",
        projectParts: [],
      });
    } else { // activeTab === "project"
      form.reset({
        printName: "",
        printerId: "",
        filamentsUsed: [],
        printTimeHours: 0,
        printTimeMinutes: 0,
        electricityProfileId: "",
        electricityCostPerHour: 0.15,
        laborCostPerHour: 10,
        laborTimeHours: 0,
        laborTimeMinutes: 0,
        profitMargin: DEFAULT_PROFIT_MARGIN,
        extras: [],
        projectName: "",
        projectParts: [{
          partName: "",
          printerId: defaultPrinterId || "",
          filamentsUsed: [{ filamentId: defaultFilamentId || "", filamentGrams: 0 }],
          printTimeHours: 0,
          printTimeMinutes: 0,
          electricityProfileId: prof?.id || "",
          electricityCostPerHour: prof?.costPerHour || 0.15,
          laborCostPerHour: 10,
          laborTimeHours: 0,
          laborTimeMinutes: 0,
          profitMargin: defaultProfitMargin,
          extras: [],
        }],
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <Card className="w-full max-w-full sm:max-w-2xl shadow-lg flex flex-col max-h-[85vh]">
        <CardHeader className="pb-4 flex-shrink-0 flex-row items-center justify-between"> {/* Adicionado flex-row e justify-between */}
          <div>
            <CardTitle className="text-3xl font-bold">Calcular Custo de Impressão</CardTitle>
            <p className="text-muted-foreground">Insira os detalhes para calcular o orçamento.</p>
          </div>
          <Tabs value={activeTab} onValueChange={(value: "single-print" | "project") => setActiveTab(value)} className="w-auto"> {/* Removido w-full */}
            <TabsList className="grid grid-cols-2 gap-2 p-1 md:flex md:w-full md:overflow-x-auto md:whitespace-nowrap md:justify-start"> {/* Ajustado para ser mais compacto */}
              <TabsTrigger value="single-print">Impressão Única</TabsTrigger>
              <TabsTrigger value="project">Projeto</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
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
                          <TableHead>Tipo</TableHead> {/* Nova coluna para tipo de cálculo */}
                          <TableHead>Preço (€)</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calculations.map((calc) => (
                          <TableRow key={calc.id}>
                            <TableCell>{format(new Date(calc.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell>{calc.isProject ? calc.projectName : calc.printName || "N/A"}</TableCell>
                            <TableCell>{calc.isProject ? "Projeto" : "Impressão Única"}</TableCell>
                            <TableCell className="font-semibold">€{calc.totalPrice.toFixed(2)}</TableCell>
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
              <div className="relative min-h-[350px]"> {/* Mantém o TabsContent aqui */}
                  <TabsContent value="single-print" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField control={form.control} name="printName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Impressão *</FormLabel>
                          <FormControl><Input placeholder="ex: Peça de Reposição" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="printerId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impressora *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>{printers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="electricityProfileId" render={({ field }) => (
                        <FormItem className="max-w-[240px]">
                          <FormLabel>Perfil Energia</FormLabel>
                          <Select onValueChange={(val) => {
                            field.onChange(val);
                            const prof = electricityProfiles.find(p => p.id === val);
                            if (prof) form.setValue("electricityCostPerHour", prof.costPerHour);
                          }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Personalizado..." /></SelectTrigger></FormControl>
                            <SelectContent>{electricityProfiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    
                    <div className="space-y-4 border rounded-md p-3 bg-background/50">
                      <FormLabel>Filamentos Usados</FormLabel>
                      <div className="space-y-3">
                        {singleFilamentFields.map((field, index) => (
                          <FilamentUsageField 
                            key={field.id} 
                            index={index} 
                            onRemove={removeSingleFilament}
                            onAdd={() => appendSingleFilament({ filamentId: defaultFilamentId || "", filamentGrams: 0 })}
                            showAdd={index === singleFilamentFields.length - 1}
                            totalFields={singleFilamentFields.length}
                            namePrefix="filamentsUsed"
                          />
                        ))}
                      </div>
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
                  <TabsContent value="project" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
                    <FormField control={form.control} name="projectName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Projeto *</FormLabel>
                        <FormControl><Input placeholder="ex: Coleção de Miniaturas" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Separator className="my-4" />
                    <h3 className="text-lg font-semibold mb-4">Partes do Projeto</h3>
                    <div className="space-y-6">
                      {projectPartFields.map((field, index) => (
                        <ProjectPartField
                          key={field.id}
                          index={index}
                          namePrefix="projectParts"
                          onRemove={removeProjectPart}
                          printers={printers}
                          filaments={filaments}
                          extraMaterials={extraMaterials}
                          electricityProfiles={electricityProfiles}
                          defaultFilamentId={defaultFilamentId}
                          defaultElectricityProfileId={defaultElectricityProfileId}
                          defaultProfitMargin={defaultProfitMargin}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendProjectPart({
                          partName: "",
                          printerId: defaultPrinterId || "",
                          filamentsUsed: [{ filamentId: defaultFilamentId || "", filamentGrams: 0 }],
                          printTimeHours: 0,
                          printTimeMinutes: 0,
                          electricityProfileId: defaultElectricityProfileId || "",
                          electricityCostPerHour: electricityProfiles.find(p => p.id === (defaultElectricityProfileId || "default-normal"))?.costPerHour || 0.15,
                          laborCostPerHour: 10,
                          laborTimeHours: 0,
                          laborTimeMinutes: 0,
                          profitMargin: defaultProfitMargin,
                          extras: [],
                        })}
                        className="w-full"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Parte
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              {/* Common fields for both tabs, or specific to single-print if not moved to ProjectPartField */}
              {activeTab === "single-print" && (
                <>
                  <Tabs defaultValue="labor" className="w-full">
                    <TabsList className="grid grid-cols-3 gap-2 w-full p-1 md:flex md:w-full md:overflow-x-auto md:whitespace-nowrap md:justify-start">
                      <TabsTrigger value="labor">Mão de Obra</TabsTrigger>
                      <TabsTrigger value="extras">Extras</TabsTrigger>
                      <TabsTrigger value="pricing">Margem</TabsTrigger>
                    </TabsList>
                    <div className="relative mt-4 min-h-[150px]">
                      <TabsContent value="labor" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
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
                        </div>
                      </TabsContent>
                      <TabsContent value="extras" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
                        {singleExtraFields.map((field, index) => (<ExtraMaterialField key={field.id} index={index} namePrefix="extras" onRemove={removeSingleExtra} />))}
                        <Button type="button" variant="outline" onClick={() => appendSingleExtra({ materialId: "", quantity: 0 })} className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Material Extra</Button>
                      </TabsContent>
                      <TabsContent value="pricing" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
                        <FormField control={form.control} name="profitMargin" render={({ field }) => (
                          <FormItem className="w-44">
                            <FormLabel>Margem de Lucro (%)</FormLabel>
                            <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 justify-between items-center border-t bg-muted/30 py-6 px-8 rounded-b-lg flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <p className="text-xl font-medium">Total Estimado:</p>
            <p className="text-3xl font-black text-primary">€{calculatedTotalPrice.toFixed(2)}</p>
          </div>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} className="w-full bg-orange-500 hover:bg-orange-600 py-6 text-lg font-bold">
            <Save className="h-5 w-5 mr-2" /> Guardar e Ver Resumo
          </Button>
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