"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePrintCalculations, PrintCalculation } from "@/hooks/use-print-calculations";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil, CalendarIcon, Clock } from "lucide-react";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  printName: z.string().min(1, "O nome da impressão é obrigatório."),
  timestamp: z.date(),
  recordHour: z.coerce.number().min(0).max(23),
  recordMinute: z.coerce.number().min(0).max(59),
  printerId: z.string().min(1, "Selecione uma impressora."),
  filamentId: z.string().min(1, "Selecione um filamento."),
  filamentGrams: z.coerce.number().min(0.01, "A quantidade de filamento deve ser positiva."),
  printTimeHours: z.coerce.number().min(0, "Horas não podem ser negativas."),
  printTimeMinutes: z.coerce.number().min(0, "Minutos não podem ser negativas.").max(59, "Minutos não podem exceder 59."),
  electricityCostPerHour: z.coerce.number().min(0, "O custo da eletricidade não pode ser negativo."),
  laborCostTotal: z.coerce.number().min(0, "O custo da mão de obra não pode ser negativo."),
  profitMargin: z.coerce.number().min(0, "A margem de lucro não pode ser negativa."),
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
      printName: calculation.printName || "",
      timestamp: initialDate,
      recordHour: initialDate.getHours(),
      recordMinute: initialDate.getMinutes(),
      printerId: calculation.printerId || "",
      filamentId: calculation.filamentId || "",
      filamentGrams: calculation.filamentGrams,
      printTimeHours: Math.floor(calculation.printTimeHours),
      printTimeMinutes: Math.round((calculation.printTimeHours - Math.floor(calculation.printTimeHours)) * 60),
      // Como o histórico guarda o total, mas o campo pede taxa, carregamos o total e o user ajusta.
      // Idealmente o histórico guardaria a taxa, mas aqui recalcula-se o total no submit.
      electricityCostPerHour: calculation.electricityCost, 
      laborCostTotal: calculation.laborCost,
      profitMargin: calculation.profitMargin,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      const totalPrintTimeHours = values.printTimeHours + (values.printTimeMinutes / 60);
      
      // Encontrar filamento para recalcular custo do material
      const selectedFilament = filaments.find(f => f.id === values.filamentId);
      const materialCost = selectedFilament ? (selectedFilament.pricePerKg / 1000) * values.filamentGrams : 0;
      
      // Recalcular custo total de eletricidade e lucro
      const electricityCostTotal = totalPrintTimeHours * values.electricityCostPerHour;
      const extraCost = calculation.extraCost || 0;
      
      const baseCost = materialCost + electricityCostTotal + values.laborCostTotal + extraCost;
      const profit = baseCost * (values.profitMargin / 100);
      const totalPrice = baseCost + profit;

      // Combinar data e hora
      const finalDate = new Date(values.timestamp);
      finalDate.setHours(values.recordHour);
      finalDate.setMinutes(values.recordMinute);
      
      updateCalculation(calculation.id, {
        printName: values.printName,
        timestamp: finalDate.getTime(),
        printerId: values.printerId,
        filamentId: values.filamentId,
        filamentGrams: values.filamentGrams,
        printTimeHours: totalPrintTimeHours,
        materialCost: parseFloat(materialCost.toFixed(2)),
        electricityCost: parseFloat(electricityCostTotal.toFixed(2)),
        laborCost: parseFloat(values.laborCostTotal.toFixed(2)),
        profitMargin: values.profitMargin,
        totalPrice: parseFloat(totalPrice.toFixed(2)),
      });
      
      showSuccess("Cálculo atualizado com sucesso!");
      setOpen(false);
    } catch (error) {
      showError("Erro ao atualizar cálculo.");
      console.error("Edit calculation error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cálculo</DialogTitle>
          <DialogDescription>Altere os detalhes do registo. O preço total será recalculado.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="printName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Impressão</FormLabel>
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
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsCalendarOpen(false);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Hora do Registo</FormLabel>
                <div className="flex gap-2 items-center">
                  <FormField
                    control={form.control}
                    name="recordHour"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl><Input type="number" min="0" max="23" placeholder="HH" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <span>:</span>
                  <FormField
                    control={form.control}
                    name="recordMinute"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl><Input type="number" min="0" max="59" placeholder="mm" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <Clock className="h-4 w-4 text-muted-foreground ml-1" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="printerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impressora</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {printers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filamentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filaments.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name} {f.color ? `(${f.color})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="filamentGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (g)</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profitMargin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem Lucro (%)</FormLabel>
                    <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Tempo de Impressão</FormLabel>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="printTimeHours"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl><Input type="number" min="0" placeholder="Horas" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="printTimeMinutes"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl><Input type="number" min="0" max="59" placeholder="Min" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="electricityCostPerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energia (€/h)</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="laborCostTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mão de Obra Total (€)</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  </FormItem>
                )}
              />
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