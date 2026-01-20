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
import { Pencil, CalendarIcon, Clock, Package, Printer, ChevronRight } from "lucide-react";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const partSchema = z.object({
  partName: z.string().min(1, "O nome da parte é obrigatório."),
  printerId: z.string().min(1, "Selecione uma impressora."),
  printTimeHours: z.coerce.number().min(0),
  printTimeMinutes: z.coerce.number().min(0).max(59),
  filamentGrams: z.coerce.number().min(0.01),
});

const formSchema = z.object({
  isProject: z.boolean(),
  displayName: z.string().min(1, "O nome é obrigatório."),
  timestamp: z.date(),
  recordHour: z.coerce.number().min(0).max(23),
  recordMinute: z.coerce.number().min(0).max(59),
  profitMargin: z.coerce.number().min(0, "A margem de lucro não pode ser negativa."),
  laborCostTotal: z.coerce.number().min(0),
  
  // Single Print Fields
  printerId: z.string().optional(),
  filamentId: z.string().optional(),
  filamentGrams: z.coerce.number().optional(),
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
  const [open, setOpen] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [editingPartIndex, setEditingPartIndex] = React.useState<number | null>(null);

  const initialDate = new Date(calculation.timestamp);

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
      
      // Single
      printerId: calculation.printerId || "",
      filamentId: calculation.filamentId || "",
      filamentGrams: calculation.filamentGrams,
      printTimeHours: !calculation.isProject ? Math.floor(calculation.printTimeHours) : 0,
      printTimeMinutes: !calculation.isProject ? Math.round((calculation.printTimeHours - Math.floor(calculation.printTimeHours)) * 60) : 0,
      electricityCostPerHour: !calculation.isProject ? (calculation.printTimeHours > 0 ? calculation.electricityCost / calculation.printTimeHours : 0.15) : 0.15,
      
      // Project
      projectParts: calculation.isProject ? calculation.projectParts?.map(p => ({
        partName: p.partName,
        printerId: p.printerId,
        printTimeHours: Math.floor(p.printTimeHours),
        printTimeMinutes: Math.round((p.printTimeHours - Math.floor(p.printTimeHours)) * 60),
        filamentGrams: p.filamentGrams,
      })) : [],
    },
  });

  const { fields: partFields, update: updatePart } = useFieldArray({
    control: form.control,
    name: "projectParts",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      const finalDate = new Date(values.timestamp);
      finalDate.setHours(values.recordHour);
      finalDate.setMinutes(values.recordMinute);

      if (values.isProject) {
        // Recalcular custos do projeto com base nas partes possivelmente editadas
        let totalMaterialCost = 0;
        let totalElectricityCost = 0;
        let totalPrintTimeHours = 0;
        let totalFilamentGrams = 0;

        const updatedParts = (values.projectParts || []).map((part, idx) => {
          const printer = printers.find(p => p.id === part.printerId);
          // Usamos o custo de energia original do cálculo para cada parte se não for editável individualmente aqui
          // Simplificação: usamos 0.15 ou tentamos inferir da parte original
          const originalPart = calculation.projectParts?.[idx];
          const electricityRate = originalPart && originalPart.printTimeHours > 0 
            ? originalPart.electricityCost / originalPart.printTimeHours 
            : 0.15;

          const partHours = part.printTimeHours + (part.printTimeMinutes / 60);
          const partMaterialCost = (filaments.find(f => f.id === (originalPart?.filamentId))?.pricePerKg || 20) / 1000 * part.filamentGrams;
          const partElectricityCost = partHours * electricityRate;

          totalMaterialCost += partMaterialCost;
          totalElectricityCost += partElectricityCost;
          totalPrintTimeHours += partHours;
          totalFilamentGrams += part.filamentGrams;

          return {
            ...originalPart,
            partName: part.partName,
            printerId: part.printerId,
            printTimeHours: partHours,
            materialCost: parseFloat(partMaterialCost.toFixed(2)),
            electricityCost: parseFloat(partElectricityCost.toFixed(2)),
            filamentGrams: part.filamentGrams,
            totalPrice: parseFloat((partMaterialCost + partElectricityCost).toFixed(2)),
          };
        });

        const totalBaseCost = totalMaterialCost + totalElectricityCost + values.laborCostTotal + (calculation.extraCost || 0);
        const profit = totalBaseCost * (values.profitMargin / 100);
        const finalPrice = totalBaseCost + profit;

        updateCalculation(calculation.id, {
          projectName: values.displayName,
          timestamp: finalDate.getTime(),
          profitMargin: values.profitMargin,
          laborCost: values.laborCostTotal,
          materialCost: parseFloat(totalMaterialCost.toFixed(2)),
          electricityCost: parseFloat(totalElectricityCost.toFixed(2)),
          printTimeHours: parseFloat(totalPrintTimeHours.toFixed(1)),
          filamentGrams: totalFilamentGrams,
          totalPrice: parseFloat(finalPrice.toFixed(2)),
          projectParts: updatedParts as any,
        });
      } else {
        const totalHours = (values.printTimeHours || 0) + ((values.printTimeMinutes || 0) / 60);
        const selectedFilament = filaments.find(f => f.id === values.filamentId);
        const matCost = selectedFilament ? (selectedFilament.pricePerKg / 1000) * (values.filamentGrams || 0) : 0;
        const elecCost = totalHours * (values.electricityCostPerHour || 0);
        const extraCost = calculation.extraCost || 0;
        
        const baseCost = matCost + elecCost + values.laborCostTotal + extraCost;
        const profit = baseCost * (values.profitMargin / 100);
        
        updateCalculation(calculation.id, {
          printName: values.displayName,
          timestamp: finalDate.getTime(),
          printerId: values.printerId,
          filamentId: values.filamentId,
          filamentGrams: values.filamentGrams || 0,
          printTimeHours: totalHours,
          materialCost: parseFloat(matCost.toFixed(2)),
          electricityCost: parseFloat(elecCost.toFixed(2)),
          laborCost: parseFloat(values.laborCostTotal.toFixed(2)),
          profitMargin: values.profitMargin,
          totalPrice: parseFloat((baseCost + profit).toFixed(2)),
        });
      }
      
      showSuccess("Cálculo atualizado com sucesso!");
      setOpen(false);
    } catch (error) {
      showError("Erro ao atualizar cálculo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {calculation.isProject ? "Projeto" : "Cálculo"}</DialogTitle>
          <DialogDescription>Altere os detalhes do registo guardado.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do {calculation.isProject ? "Projeto" : "Impressão"}</FormLabel>
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
              <div className="space-y-4">
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
                  <FormField control={form.control} name="filamentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>{filaments.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="filamentGrams" render={({ field }) => (
                    <FormItem><FormLabel>Peso (g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="electricityCostPerHour" render={({ field }) => (
                    <FormItem><FormLabel>Energia (€/h)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                  )} />
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
                <div className="border rounded-md divide-y overflow-hidden">
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
                          <span>{field.filamentGrams}g</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>

                {/* Diálogo de Edição de Parte */}
                <Dialog open={editingPartIndex !== null} onOpenChange={(open) => !open && setEditingPartIndex(null)}>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Editar Detalhes da Parte</DialogTitle>
                      <DialogDescription>Altere as especificações desta parte do projeto.</DialogDescription>
                    </DialogHeader>
                    {editingPartIndex !== null && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <FormLabel>Nome da Parte</FormLabel>
                          <Input 
                            value={form.getValues(`projectParts.${editingPartIndex}.partName`)}
                            onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.partName`, e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Impressora</FormLabel>
                          <Select 
                            value={form.getValues(`projectParts.${editingPartIndex}.printerId`)}
                            onValueChange={(val) => form.setValue(`projectParts.${editingPartIndex}.printerId`, val)}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{printers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormLabel>Horas</FormLabel>
                            <Input 
                              type="number"
                              value={form.getValues(`projectParts.${editingPartIndex}.printTimeHours`)}
                              onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.printTimeHours`, parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Minutos</FormLabel>
                            <Input 
                              type="number"
                              max="59"
                              value={form.getValues(`projectParts.${editingPartIndex}.printTimeMinutes`)}
                              onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.printTimeMinutes`, parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Peso (g)</FormLabel>
                          <Input 
                            type="number"
                            step="0.01"
                            value={form.getValues(`projectParts.${editingPartIndex}.filamentGrams`)}
                            onChange={(e) => form.setValue(`projectParts.${editingPartIndex}.filamentGrams`, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button onClick={() => setEditingPartIndex(null)}>Confirmar Parte</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

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
              <Button type="submit" className="w-full">Guardar Alterações do Projeto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};