"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useExtraMaterials, NewExtraMaterialData } from "@/hooks/use-extras"; // Import NewExtraMaterialData
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  costPerUnit: z.coerce.number().min(0.01, "O custo por unidade deve ser positivo."),
  purchasePrice: z.coerce.number().min(0, "O preço de compra não pode ser negativo.").optional(),
  unit: z.string().min(1, "A unidade é obrigatória."),
});

// Explicitly define the type for the form values
type AddExtraMaterialFormValues = z.infer<typeof formSchema>;

interface AddExtraDialogProps {
  // Removida prop onSuccess
}

export const AddExtraDialog = ({ /* onSuccess */ }: AddExtraDialogProps) => {
  const { addExtraMaterial } = useExtraMaterials();
  const [open, setOpen] = React.useState(false);
  const form = useForm<AddExtraMaterialFormValues>({ // Use the explicit type here
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      costPerUnit: 0,
      purchasePrice: 0, // Valor padrão
      unit: "unidade",
    },
  });

  const onSubmit = (values: AddExtraMaterialFormValues) => { // Use the explicit type here
    try {
      // The 'values' type is now AddExtraMaterialFormValues, which is compatible with NewExtraMaterialData
      addExtraMaterial(values as NewExtraMaterialData); // Cast to NewExtraMaterialData for the hook
      showSuccess(`Material extra "${values.name || 'Sem Nome'}" adicionado com sucesso!`);
      form.reset();
      setOpen(false);
      // onSuccess?.(); // Não é mais necessário chamar o callback
    } catch (error) {
      showError("Erro ao adicionar material extra. Por favor, tente novamente.");
      console.error("Add extra material error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Adicionar Extra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Material Extra</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do material extra que pode ser usado nas suas impressões.
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
                    <Input placeholder="ex: Parafuso M3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ex: Parafuso de aço inoxidável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo por Unidade (€)</FormLabel>
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
                  <FormLabel>Preço de Compra por Unidade (€) (Opcional)</FormLabel>
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="grama">Grama</SelectItem>
                      <SelectItem value="ml">Mililitro</SelectItem>
                      <SelectItem value="cm">Centímetro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Adicionar Material Extra</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};