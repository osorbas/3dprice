"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFilaments, NewFilamentData } from "@/hooks/use-filaments";
import { useFilamentBrands } from "@/hooks/use-filament-brands";
import { useFilamentColors } from "@/hooks/use-filament-colors"; // Importado
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle, TrendingUp, Plus, Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(), // Agora pode ser o nome da cor ou o código HEX
  pricePerKg: z.coerce.number().min(0.01, "O preço de venda deve ser positivo."),
  purchasePrice: z.coerce.number().min(0, "O preço de compra não pode ser negativo.").optional(),
  weight: z.coerce.number().min(0.01, "O peso deve ser positivo."),
  currentWeightGrams: z.coerce.number().min(0, "O stock não pode ser negativo."),
});

type AddFilamentFormValues = z.infer<typeof formSchema>;

export const AddFilamentDialog = () => {
  const { addFilament } = useFilaments();
  const { brands, addBrand, updateBrand } = useFilamentBrands();
  const { colors: predefinedColors } = useFilamentColors(); // Usar cores predefinidas
  const [open, setOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<string | undefined>(undefined);
  
  // Estados para criação de novos itens
  const [isAddingNewBrand, setIsAddingNewBrand] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState("");
  
  const [isAddingNewType, setIsAddingNewType] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");

  const form = useForm<AddFilamentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", brand: "", type: "", color: "", pricePerKg: 20, purchasePrice: 15, weight: 1, currentWeightGrams: 1000,
    },
  });

  const watchedSellingPrice = form.watch("pricePerKg");
  const watchedPurchasePrice = form.watch("purchasePrice") || 0;
  const watchedWeight = form.watch("weight");
  const watchedColor = form.watch("color");

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

  const onSubmit = (values: AddFilamentFormValues) => {
    try {
      addFilament(values as NewFilamentData);
      showSuccess(`Filamento adicionado!`);
      form.reset();
      setSelectedBrand(undefined);
      setOpen(false);
    } catch (err) { showError("Erro ao adicionar."); }
  };

  const handleCreateBrand = () => {
    if (!newBrandName.trim()) return;
    const trimmedName = newBrandName.trim();
    addBrand(trimmedName);
    form.setValue("brand", trimmedName);
    setSelectedBrand(trimmedName);
    form.setValue("type", ""); // Reset tipo ao mudar marca
    setIsAddingNewBrand(false);
    setNewBrandName("");
    showSuccess(`Marca "${trimmedName}" criada!`);
  };

  const handleCreateType = () => {
    if (!newTypeName.trim() || !selectedBrand) return;
    const currentBrandConfig = brands.find(b => b.name === selectedBrand);
    if (currentBrandConfig) {
      const updatedTypes = [...currentBrandConfig.types, newTypeName.trim()];
      updateBrand(selectedBrand, selectedBrand, updatedTypes);
      form.setValue("type", newTypeName.trim());
      setIsAddingNewType(false);
      setNewTypeName("");
      showSuccess(`Tipo "${newTypeName}" adicionado à marca ${selectedBrand}!`);
    }
  };

  const typesForSelectedBrand = React.useMemo(() => {
    if (!selectedBrand) return [];
    return brands.find(b => b.name === selectedBrand)?.types || [];
  }, [selectedBrand, brands]);

  const selectedColorHex = React.useMemo(() => {
    const color = predefinedColors.find(c => c.name === watchedColor || c.hex === watchedColor);
    return color ? color.hex : (watchedColor && /^#[0-9A-F]{6}$/i.test(watchedColor) ? watchedColor : undefined);
  }, [watchedColor, predefinedColors]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2"><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Filamento</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar Novo Filamento</DialogTitle></DialogHeader>
        
        {isAddingNewBrand ? (
          <div className="space-y-4 py-4 border rounded-lg p-4 bg-primary/5">
            <h4 className="font-semibold text-sm">Nova Marca Personalizada</h4>
            <div className="flex gap-2">
              <Input 
                placeholder="Nome da Marca" 
                value={newBrandName} 
                onChange={(e) => setNewBrandName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBrand()}
              />
              <Button onClick={handleCreateBrand} size="sm">Criar</Button>
              <Button onClick={() => setIsAddingNewBrand(false)} variant="ghost" size="sm">Cancelar</Button>
            </div>
          </div>
        ) : isAddingNewType ? (
          <div className="space-y-4 py-4 border rounded-lg p-4 bg-primary/5">
            <h4 className="font-semibold text-sm">Novo Tipo para {selectedBrand}</h4>
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: PLA-CF, PETG-HS" 
                value={newTypeName} 
                onChange={(e) => setNewTypeName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateType()}
              />
              <Button onClick={handleCreateType} size="sm">Adicionar</Button>
              <Button onClick={() => setIsAddingNewType(false)} variant="ghost" size="sm">Cancelar</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome Amigável (Opcional)</FormLabel><FormControl><Input placeholder="Ex: PLA Silk Azul" {...field} /></FormControl></FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <Select 
                      onValueChange={(v) => { 
                        if (v === "NEW_BRAND") {
                          setIsAddingNewBrand(true);
                        } else {
                          field.onChange(v); 
                          setSelectedBrand(v); 
                          form.setValue("type", ""); // Reset tipo ao mudar marca
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {brands.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                        <Separator className="my-1" />
                        <SelectItem value="NEW_BRAND" className="text-blue-500 font-medium hover:text-blue-600">
                          <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Adicionar nova...</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={(v) => {
                        if (v === "NEW_TYPE") {
                          setIsAddingNewType(true);
                        } else {
                          field.onChange(v);
                        }
                      }} 
                      value={field.value} 
                      disabled={!selectedBrand}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {typesForSelectedBrand.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        {selectedBrand && (
                          <>
                            <Separator className="my-1" />
                            <SelectItem value="NEW_TYPE" className="text-blue-500 font-medium hover:text-blue-600">
                              <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Adicionar novo...</span>
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          {selectedColorHex && (
                            <div 
                              className="h-4 w-4 rounded-full border border-black/20 shadow-sm flex-shrink-0" 
                              style={{ backgroundColor: selectedColorHex }}
                            />
                          )}
                          <SelectValue placeholder="Selecionar cor..." />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma / Personalizada</SelectItem>
                      <Separator className="my-1" />
                      {predefinedColors.map(c => (
                        <SelectItem key={c.hex} value={c.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full border border-black/20 shadow-sm flex-shrink-0" 
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <Separator className="my-2" />
              <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">Valores e Margem</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="pricePerKg" render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Preço Venda/Kg (€) *</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Preço Compra/Kg (€)</FormLabel>
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

              <DialogFooter><Button type="submit" className="w-full">Adicionar Filamento</Button></DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};