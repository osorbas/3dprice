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
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  costPerHour: z.coerce.number().min(0, "O custo por hora não pode ser negativo."),
  description: z.string().optional(),
});

export const AddElectricityProfileDialog = () => {
  const { addElectricityProfile } = useElectricityProfiles();
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      costPerHour: 0.15, // Default value for electricity cost
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      // O tipo de 'values' agora corresponde ao tipo NewElectricityProfileData definido em use-electricity-profiles.ts
      addElectricityProfile(values);
      showSuccess(`Perfil de eletricidade "${values.name}" adicionado com sucesso!`);
      form.reset();
      setOpen(false);
    } catch (error) {
      showError("Erro ao adicionar perfil de eletricidade. Por favor, tente novamente.");
      console.error("Add electricity profile error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Adicionar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Perfil de Eletricidade</DialogTitle>
          <DialogDescription>
            Defina um novo perfil de custo de eletricidade por hora.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Tarifa Normal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo por Hora (€/h)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.15"
                      {...field}
                    />
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
                    <Textarea placeholder="ex: Custo médio da eletricidade durante o dia." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Adicionar Perfil</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};