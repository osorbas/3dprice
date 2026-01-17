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
import { useExtraMaterials, ExtraMaterial } from "@/hooks/use-extras";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  description: z.string().optional(),
  costPerUnit: z.coerce.number().min(0.01, "O custo por unidade deve ser positivo."),
  unit: z.string().min(1, "A unidade é obrigatória."),
});

interface EditExtraDialogProps {
  extraMaterial: ExtraMaterial;
  // Removida prop onSuccess
}

export const EditExtraDialog = ({ extraMaterial /* onSuccess */ }: EditExtraDialogProps) => {
  const { updateExtraMaterial } = useExtraMaterials();
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: extraMaterial.name,
      description: extraMaterial.description || "",
      costPerUnit: extraMaterial.costPerUnit,
      unit: extraMaterial.unit,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      updateExtraMaterial(extraMaterial.id, values);
      showSuccess(`Material extra "${values.name}" atualizado com sucesso!`);
      setOpen(false);
      // onSuccess?.(); // Não é mais necessário chamar o callback
    } catch (error) {
      showError("Erro ao atualizar material extra. Por favor, tente novamente.");
      console.error("Edit extra material error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Material Extra</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Material Extra</DialogTitle>
          <DialogDescription>
            Altere os detalhes do material extra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
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
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};