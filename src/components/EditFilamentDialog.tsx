"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFilaments, Filament } from "@/hooks/use-filaments";
import { useFilamentBrands } from "@/hooks/use-filament-brands";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(),
  pricePerKg: z.coerce.number().min(0.01, "O preço por kg deve ser positivo."),
  purchasePrice: z.coerce.number().min(0, "O preço de compra não pode ser negativo.").optional(),
  weight: z.coerce.number().min(0.01, "O peso deve ser positivo."),
  currentWeightGrams: z.coerce.number().min(0, "O stock não pode ser negativo."),
});

export const EditFilamentDialog = ({ filament }: { filament: Filament }) => {
  const { updateFilament } = useFilaments();
  const { brands } = useFilamentBrands();
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: filament.name || "", 
      brand: filament.brand, 
      type: filament.type, 
      color: filament.color || "", 
      pricePerKg: filament.pricePerKg, 
      purchasePrice: filament.purchasePrice ?? 0, 
      weight: filament.weight, 
      currentWeightGrams: filament.currentWeightGrams,
    },
  });

  const selectedBrand = form.watch("brand");
  const typesForSelectedBrand = React.useMemo(() => {
    return brands.find(b => b.name === selectedBrand)?.types || [];
  }, [selectedBrand, brands]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      updateFilament(filament.id, values);
      showSuccess("Filamento atualizado!");
      setOpen(false);
    } catch (err) { showError("Erro ao atualizar."); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Filamento</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem><FormLabel>Marca</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {brands.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {typesForSelectedBrand.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="pricePerKg" render={({ field }) => (
                <FormItem><FormLabel>Preço/Kg (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="currentWeightGrams" render={({ field }) => (
                <FormItem><FormLabel>Stock Atual (gramas)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter><Button type="submit">Salvar Alterações</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};