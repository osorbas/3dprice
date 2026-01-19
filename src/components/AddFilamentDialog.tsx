"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFilaments } from "@/hooks/use-filaments";
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().optional(),
  brand: z.string().min(1, "A marca é obrigatória."),
  type: z.string().min(1, "O tipo é obrigatório."),
  color: z.string().optional(),
  pricePerKg: z.coerce.number().min(0.01, "O preço por kg deve ser positivo."),
  purchasePrice: z.coerce.number().min(0, "O preço de compra não pode ser negativo.").optional(), // Novo campo
  weight: z.coerce.number().min(0.01, "O peso deve ser positivo."),
});

interface AddFilamentDialogProps {
  // Removida prop onSuccess
}

// Predefined list of popular filament brands and types
export const predefinedFilamentOptions = [ // Exportado
  { brand: "Genérico", type: "PLA" },
  { brand: "Genérico", type: "PETG" },
  { brand: "Genérico", type: "ABS" },
  { brand: "Prusament", type: "PLA" },
  { brand: "Prusament", type: "PETG" },
  { brand: "ESUN", type: "PLA+" },
  { brand: "ESUN", type: "PETG" },
  { brand: "Polymaker", type: "PLA Pro" },
  { brand: "Polymaker", type: "PETG" },
  { brand: "Hatchbox", type: "PLA" },
  { brand: "Hatchbox", type: "PETG" },
  { brand: "Overture", type: "PLA" },
  { brand: "Overture", type: "PETG" },
  { brand: "Bambu Lab", type: "PLA Basic" },
  { brand: "Bambu Lab", type: "PETG Basic" },
  { brand: "Bambu Lab", type: "ABS" },
  { brand: "Anycubic", type: "PLA" },
  { brand: "Anycubic", type: "PETG" },
  { brand: "Sunlu", type: "PLA" },
  { brand: "Sunlu", type: "PETG" },
  { brand: "Geeetech", type: "PLA" },
  { brand: "Geeetech", type: "PETG" },
  { brand: "Amazon Basics", type: "PLA" },
  { brand: "Amazon Basics", type: "PETG" },
];

export const AddFilamentDialog = ({ /* onSuccess */ }: AddFilamentDialogProps) => {
  const { addFilament } = useFilaments();
  const [open, setOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<string | undefined>(undefined);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      type: "",
      color: "",
      pricePerKg: 0,
      purchasePrice: 0, // Valor padrão
      weight: 1, // Default to 1kg spool
    },
  });

  // Effect to reset type when brand changes
  React.useEffect(() => {
    if (selectedBrand !== form.getValues("brand")) {
      form.setValue("type", "");
    }
  }, [selectedBrand, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      addFilament({
        ...values,
        name: values.name || "", // Garante que seja string vazia se não preenchido
      });
      const displayName = values.name || `${values.brand} (${values.color || 'N/A'})`;
      showSuccess(`Filamento "${displayName}" adicionado com sucesso!`);
      form.reset();
      setSelectedBrand(undefined); // Reset selected brand state
      setOpen(false);
    } catch (error) {
      showError("Erro ao adicionar filamento. Por favor, tente novamente.");
      console.error("Add filament error:", error);
    }
  };

  const uniqueBrands = Array.from(new Set(predefinedFilamentOptions.map((f) => f.brand))).sort();
  const typesForSelectedBrand = selectedBrand
    ? Array.from(new Set(predefinedFilamentOptions.filter((f) => f.brand === selectedBrand).map((f) => f.type))).sort()
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Adicionar Filamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Filamento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do seu filamento. O nome é opcional.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: PLA Favorito" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedBrand(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma marca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedBrand || typesForSelectedBrand.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typesForSelectedBrand.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Preto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço por Kg (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchasePrice" // Novo campo
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Compra por Kg (€) (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value === 0 ? "" : field.value} // Exibe vazio se for 0
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso da Bobina (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Adicionar Filamento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};