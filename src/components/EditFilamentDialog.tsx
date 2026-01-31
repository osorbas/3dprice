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
import { Pencil, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(),
  pricePerKg: z.coerce.number().min(0.01, "O preço de venda deve ser positivo."),
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
  const watchedSellingPrice = form.watch("pricePerKg");
  const watchedPurchasePrice = form.watch("purchasePrice") || 0;
  const watchedWeight = form.watch("weight");

  const profitMargin = React.useMemo(() => {
    if (watchedPurchasePrice <= 0 || watchedSellingPrice <= 0) return null;
    const margin = ((watchedSellingPrice - watchedPurchasePrice) / watchedPurchasePrice) * 100;
    return margin;
  }, [watchedSellingPrice, watchedPurchasePrice]);

  const calculatedPrices = React.useMemo(() => {
    const pricePerGram = watchedSellingPrice / 1000;
    const purchasePricePerGram = watchedPurchasePrice / 1000;
    const totalSellingPrice = watchedSellingPrice * watchedWeight;
    const totalPurchasePrice = watchedPurchasePrice * watchedWeight;
    return { pricePerGram, purchasePricePerGram, totalSellingPrice, totalPurchasePrice };
  }, [watchedSellingPrice, watchedPurchasePrice, watchedWeight]);

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
              <FormItem><FormLabel>Nome Amigável</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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
            
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem><FormLabel>Cor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />

            <Separator className="my-2" />
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">Valores e Margem</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Compra/Kg (€)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="pricePerKg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Venda/Kg (€)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <TrendingUp className={cn("h-4 w-4", (profitMargin ?? -1) >= 0 ? "text-green-500" : "text-red-500")} />
                  <span>Margem de Lucro: </span>
                  <span className={cn((profitMargin ?? -1) >= 0 ? "text-green-600" : "text-red-600", "font-bold")}>
                    {profitMargin !== null ? `${profitMargin.toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pt-2">
                  <p>Preço Venda/g:</p>
                  <p className="text-right font-medium">€{calculatedPrices.pricePerGram.toFixed(4)}</p>
                  <p>Preço Compra/g:</p>
                  <p className="text-right font-medium">€{calculatedPrices.purchasePricePerGram.toFixed(4)}</p>
                  <p>Preço Total Bobina (Venda):</p>
                  <p className="text-right font-medium">€{calculatedPrices.totalSellingPrice.toFixed(2)}</p>
                  <p>Preço Total Bobina (Compra):</p>
                  <p className="text-right font-medium">€{calculatedPrices.totalPurchasePrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>Peso Total (kg)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="currentWeightGrams" render={({ field }) => (
                <FormItem><FormLabel>Stock Atual (g)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <DialogFooter><Button type="submit" className="w-full">Salvar Alterações</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};