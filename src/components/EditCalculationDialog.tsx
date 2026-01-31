"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil, CalendarIcon, Clock, Package, Printer, ChevronRight, PlusCircle } from "lucide-react";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { FilamentUsageField } from "./calculator/FilamentUsageField";
import { ExtraMaterialField } from "./calculator/ExtraMaterialField";

const filamentUsageSchema = z.object({
  filamentId: z.string().min(1, "Selecione um filamento."),
  filamentGrams: z.coerce.number().min(0),
});

const extraSchema = z.object({
  materialId: z.string().min(1, "Selecione um material."),
  quantity: z.coerce.number().min(0),
});

const partSchema = z.object({
  partName: z.string().min(1, "O nome da parte é obrigatório."),
  printerId: z.string().min(1, "Selecione uma impressora."),
  printTimeHours: z.coerce.number().min(0),
  printTimeMinutes: z.coerce.number().min(0).max(59),
  filamentsUsed: z.array(filamentUsageSchema),
});

const formSchema = z.object({
  isProject: z.boolean(),
  displayName: z.string().min(1, "O nome é obrigatório."),
  timestamp: z.date(),
  recordHour: z.coerce.number().min(0).max(23),
  recordMinute: z.coerce.number().min(0).max(59),
  profitMargin: z.coerce.number().min(0),
  laborCostTotal: z.coerce.number().min(0),
  extras: z.array(extraSchema),
  
  // Single Print Fields
  printerId: z.string().optional(),
  filamentsUsed: z.array(filamentUsageSchema).optional(),
  printTimeHours: z.coerce.number().optional(),
  printTimeMinutes: z.coerce.number().optional(),
  electricityCostPerHour: z.coerce.number().optional(),

  // Project Parts Fields
  projectParts: z.array(partSchema).optional(),
});

interface EditCalculationDialogProps {
  calculation: PrintCalculation;
}

export const EditCalculationDialog = ({ calculation }: EditCalculationDialogProps) => {
  const { updateCalculation } = usePrintCalculations();
  const { printers } = usePrinters();
  const { filaments } = useFilaments();
  const { extraMaterials } = useExtraMaterials();
  const [open, setOpen] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [editingPartIndex, setEditingPartIndex] = React.useState<number | null>(null);

  const initialDate = new Date(calculation.timestamp);
  
  // Função auxiliar para calcular a taxa de eletricidade por hora
  const getElectricityCostPerHour = (calc: PrintCalculation) => {
    if (calc.printTimeHours > 0) {
      return calc.electricityCost / calc.printTimeHours;
    }
    // Tenta encontrar a impressora para obter o consumo e calcular uma taxa padrão
    const printer = printers.find(p => p.id === calc.printerId);
    if (printer) {
      // Assumindo um custo de 0.15€/kWh (1000W) como padrão se não houver tempo de impressão
      return (printer.powerConsumptionWatts / 1000) * 0.15; 
    }
    return 0.15; // Fallback
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isProject: !!calculation.isProject,
      displayName: calculation.isProject ? (calculation.projectName || "") : (calculation.printName || ""),
      timestamp: initialDate,
      recordHour: initialDate.getHours(),
      recordMinute: initialDate.getMinutes(),
      profitMargin: calculation.profitMargin,
      laborCostTotal: calculation.laborCost,
      
      // Inicialização de Extras
      extras: (calculation.extras as z.infer<typeof extraSchema>[]) || [],
      
      // Single Print Fields
      printerId: calculation.printerId || "",
      filamentsUsed: calculation.isProject ? [] : (calculation.filaments && calculation.filaments.length > 0 ? calculation.filaments.map(f => ({ filamentId: f.filamentId, filamentGrams: f.grams })) : [{ filamentId: calculation.filamentId || "", filamentGrams: calculation.filamentGrams || 0 }]),
      printTimeHours: !calculation.isProject ? Math.floor(calculation.printTimeHours) : 0,
      printTimeMinutes: !calculation.isProject ? Math.round((calculation.printTimeHours - Math.floor(calculation.printTimeHours)) * 60) : 0,
      electricityCostPerHour: !calculation.isProject ? getElectricityCostPerHour(calculation) : 0.15,
      
      // Project
      projectParts: calculation.isProject ? calculation.projectParts?.map(p => ({
        partName: p.partName,
        printerId: p.printerId,
        printTimeHours: Math.floor(p.printTimeHours),
        printTimeMinutes: Math.round((p.printTimeHours - Math.floor(p.printTimeHours)) * 60),
        filamentsUsed: p.filaments && p.filaments.length > 0 ? p.filaments.map(f => ({ filamentId: f.filamentId, filamentGrams: f.grams })) : [{ filamentId: p.filamentId || "", filamentGrams: p.filamentGrams || 0 }],
      })) : [],
    },
  });

  const { fields: filamentFields, append: appendFilament, remove: removeFilament } = useFieldArray({
    control: form.control,
    name: "filamentsUsed",
  });

  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control: form.control,
    name: "extras",
  });

  const { fields: partFields } = useFieldArray({
    control: form.control,
    name: "projectParts",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      const finalDate = new Date(values.timestamp);
      finalDate.setHours(values.recordHour);
      finalDate.setMinutes(values.recordMinute);

      let totalMaterialCost = 0;
      let totalElectricityCost = 0;
      let totalPrintTimeHours = 0;
      let totalFilamentGrams = 0;
      let totalExtrasCost = 0;

      // Calcular Extras (comum a ambos)
      const updatedExtras = values.extras?.map(ex => {
        const material = extraMaterials.find(m => m.id === ex.materialId);
        const cost = material ? material.costPerUnit * Number(ex.quantity || 0) : 0;
        totalExtrasCost += cost;
        return { ...ex, cost: parseFloat(cost.toFixed(2)) };
      }) || [];

      if (values.isProject) {
        const updatedParts = (values.projectParts || []).map((part, idx) => {
          const originalPart = calculation.projectParts?.[idx];
          const electricityRate = originalPart && originalPart.printTimeHours > 0 
            ? originalPart.electricityCost / originalPart.printTimeHours 
            : 0.15;

          const partHours = Number(part.printTimeHours || 0) + (Number(part.printTimeMinutes || 0) / 60);
          let partMatCost = 0;
          let partGrams = 0;

          const updatedFilaments = part.filamentsUsed.map(f => {
            const filament = filaments.find(fil => fil.id === f.filamentId);
            const grams = Number(f.filamentGrams || 0);
            const cost = filament ? (filament.pricePerKg / 1000) * grams : 0;
            partMatCost += cost;
            partGrams += grams;
            return { filamentId: f.filamentId, grams: grams };
          });

          const partElectricityCost = partHours * electricityRate;

          totalMaterialCost += partMatCost;
          totalElectricityCost += partElectricityCost;
          totalPrintTimeHours += partHours;
          totalFilamentGrams += partGrams;

          const partBaseCost = partMatCost + partElectricityCost;
          
          return {
            ...originalPart,
            partName: part.partName,
            printerId: part.printerId,
            printTimeHours: partHours,
            materialCost: parseFloat(partMatCost.toFixed(2)),
            electricityCost: parseFloat(partElectricityCost.toFixed(2)),
            filamentGrams: partGrams,
            filaments: updatedFilaments,
            totalPrice: parseFloat(partBaseCost.toFixed(2)),
          };
        });

        const baseCost = totalMaterialCost + totalElectricityCost + Number(values.laborCostTotal || 0) + totalExtrasCost;
        const finalPrice = baseCost + (baseCost * (Number(values.profitMargin || 0) / 100));

        updateCalculation(calculation.id, {
          projectName: values.displayName,
          timestamp: finalDate.getTime(),
          profitMargin: Number(values.profitMargin || 0),
          laborCost: parseFloat(Number(values.laborCostTotal || 0).toFixed(2)),
          extraCost: parseFloat(totalExtrasCost.toFixed(2)),
          materialCost: parseFloat(totalMaterialCost.toFixed(2)),
          electricityCost: parseFloat(totalElectricityCost.toFixed(2)),
          printTimeHours: parseFloat(totalPrintTimeHours.toFixed(2)),
          filamentGrams: totalFilamentGrams,
          totalPrice: parseFloat(finalPrice.toFixed(2)),
          projectParts: updatedParts as any,
          extras: updatedExtras,
        });
      } else {
        const totalHours = Number(values.printTimeHours || 0) + (Number(values.printTimeMinutes || 0) / 60);
        let matCost = 0;
        let grams = 0;

        const updatedFilaments = values.filamentsUsed?.map(f => {
          const filament = filaments.find(fil => fil.id === f.filamentId);
          const fGrams = Number(f.filamentGrams || 0);
          if (filament) matCost += (filament.pricePerKg / 1000) * fGrams;
          grams += fGrams;
          return { filamentId: f.filamentId, grams: fGrams };
        }) || [];

        const elecCost = totalHours * Number(values.electricityCostPerHour || 0);
        const baseCost = matCost + elecCost + Number(values.laborCostTotal || 0) + totalExtrasCost;
        const finalPrice = baseCost + (baseCost * (Number(values.profitMargin || 0) / 100));
        
        updateCalculation(calculation.id, {
          printName: values.displayName,
          timestamp: finalDate.getTime(),
          printerId: values.printerId,
          filaments: updatedFilaments,
          filamentId: updatedFilaments?.[0]?.filamentId || "",
          filamentGrams: grams,
          printTimeHours: parseFloat(totalHours.toFixed(2)),
          materialCost: parseFloat(matCost.toFixed(2)),
          electricityCost: parseFloat(elecCost.toFixed(2)),
          laborCost: parseFloat(Number(values.laborCostTotal || 0).toFixed(2)),
          extraCost: parseFloat(totalExtrasCost.toFixed(2)),
          profitMargin: Number(values.profitMargin || 0),
          totalPrice: parseFloat(finalPrice.toFixed(2)),
          extras: updatedExtras,
        });
      }
      
      showSuccess("Cálculo atualizado com sucesso!");
      setOpen(false);
    } catch (error) {
      showError("Erro ao atualizar cálculo.");
      console.error("Update calculation error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {calculation.isProject ? "Projeto" : "Cálculo"}</DialogTitle>
          <DialogDescription>Altere os detalhes do registo. O preço final será recalculado.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); setIsCalendarOpen(false); }} disabled={(date) => date > new Date()} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Hora</FormLabel>
                <div className="flex gap-2 items-center">
                  <FormField control={form.control} name="recordHour" render={({ field }) => (
                    <FormItem className="flex-grow"><FormControl><Input type="number" min="0" max="23" {...field} /></FormControl></FormItem>
                  )} />
                  <span>:</span>
                  <FormField control={form.control} name="recordMinute" render={({ field }) => (
                    <FormItem className="flex-grow"><FormControl><Input type="number" min="0" max="59" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </div>
            </div>

            <Separator />

            {!calculation.isProject ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="printerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impressora</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>{printers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="electricityCostPerHour" render={({ field }) => (
                    <FormItem><FormLabel>Custo Energia (€/h)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Filamentos Usados</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendFilament({ filamentId: "", filamentGrams: 0 })}><PlusCircle className="h-4 w-4 mr-1" /> Adicionar</Button>
                  </div>
                  {filamentFields.map((field, idx) => (
                    <FilamentUsageField key={field.id} index={idx} totalFields={filamentFields.length} onRemove={removeFilament} namePrefix="filamentsUsed" />
                  ))}
                </div>

                <div className="space-y-2">
                  <FormLabel>Tempo de Impressão</FormLabel>
                  <div className="flex gap-2">
                    <FormField control={form.control} name="printTimeHours" render={({ field }) => (
                      <FormItem className="flex-grow"><FormControl><Input type="number" placeholder="Horas" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="printTimeMinutes" render={({ field }) => (
                      <FormItem className="flex-grow"><FormControl><Input type="number" placeholder="Min" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Partes do Projeto</h4>
                <div className="border rounded-md divide-y overflow-hidden max-h-[300px] overflow-y-auto">
                  {partFields.map((field, index) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => setEditingPartIndex(index)}
                      className="w-full text-left p-3 hover:bg-muted transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <Package className="h-3 w-3" /> {field.partName}
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Printer className="h-3 w-3" /> {printers.find(p => p.id === field.printerId)?.name || "N/A"}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {field.printTimeHours}h {field.printTimeMinutes}m</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>

                <Dialog open={editingPartIndex !== null} onOpenChange={(open) => !open && setEditingPartIndex(null)}>
                  <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle>Editar Parte</DialogTitle></DialogHeader>
                    {editingPartIndex !== null && (
                      <div className="space-y-4 py-4">
                        <Input 
                          placeholder="Nome da Parte"
                          value={form.getValues(`projectParts.${editingPartIndex}.partName`)}
                          onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.partName`, e.target.value)}
                        />
                        <Select 
                          value={form.getValues(`projectParts.${editingPartIndex}.printerId`)}
                          onValueChange={(val) => form.setValue(`projectParts.${editingPartIndex}.printerId`, val)}
                        >
                          <SelectTrigger><SelectValue placeholder="Impressora" /></SelectTrigger>
                          <SelectContent>{printers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" placeholder="Horas" value={form.getValues(`projectParts.${editingPartIndex}.printTimeHours`)} onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.printTimeHours`, parseInt(e.target.value) || 0)} />
                          <Input type="number" placeholder="Minutos" value={form.getValues(`projectParts.${editingPartIndex}.printTimeMinutes`)} onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.printTimeMinutes`, parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    )}
                    <DialogFooter><Button onClick={() => setEditingPartIndex(null)}>OK</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Extras (Parafusos, etc.)</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => appendExtra({ materialId: "", quantity: 0 })}><PlusCircle className="h-4 w-4 mr-1" /> Adicionar</Button>
              </div>
              {extraFields.map((field, idx) => (
                <ExtraMaterialField key={field.id} index={idx} namePrefix="extras" onRemove={removeExtra} />
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="laborCostTotal" render={({ field }) => (
                <FormItem><FormLabel>Mão de Obra Total (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="profitMargin" render={({ field }) => (
                <FormItem><FormLabel>Margem Lucro (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
              )} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">Guardar Alterações e Recalcular</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};