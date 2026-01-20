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
import { Pencil, CalendarIcon, Clock, Package, Printer } from "lucide-react";
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

  const { fields: partFields } = useFieldArray({
    control: form.control,
    name: "projectParts",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      const finalDate = new Date(values.timestamp);
      finalDate.setHours(values.recordHour);
      finalDate.setMinutes(values.recordMinute);

      if (values.isProject) {
        // Para projetos, mantemos a estrutura mas atualizamos o nome e lucro
        // Nota: A lógica de recálculo total de partes é complexa para este diálogo simples,
        // então focamos em atualizar os metadados principais e permitir a edição do nome.
        updateCalculation(calculation.id, {
          projectName: values.displayName,
          timestamp: finalDate.getTime(),
          profitMargin: values.profitMargin,
          laborCost: values.laborCostTotal,
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
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Partes do Projeto (Visualização)</h4>
                <div className="border rounded-md divide-y">
                  {partFields.map((field, index) => (
                    <div key={field.id} className="p-3 text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold flex items-center gap-2"><Package className="h-3 w-3" /> {field.partName}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                          <Printer className="h-3 w-3" /> {printers.find(p => p.id === field.printerId)?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex gap-4 text-muted-foreground">
                        <span><Clock className="h-3 w-3 inline mr-1" /> {field.printTimeHours}h {field.printTimeMinutes}m</span>
                        <span>{field.filamentGrams}g</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">Nota: Para alterar detalhes técnicos das partes, utilize a Calculadora de Projeto.</p>
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
              <Button type="submit" className="w-full">Guardar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};