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
import { useElectricityProfiles, ElectricityProfile } from "@/hooks/use-electricity-profiles";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  costPerHour: z.coerce.number().min(0, "O custo por hora não pode ser negativo."),
  description: z.string().optional(),
});

interface EditElectricityProfileDialogProps {
  profile: ElectricityProfile;
}

export const EditElectricityProfileDialog = ({ profile }: EditElectricityProfileDialogProps) => {
  const { updateElectricityProfile } = useElectricityProfiles();
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile.name,
      costPerHour: profile.costPerHour,
      description: profile.description || "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      updateElectricityProfile(profile.id, values);
      showSuccess(`Perfil de eletricidade "${values.name}" atualizado com sucesso!`);
      setOpen(false);
    } catch (error) {
      showError("Erro ao atualizar perfil de eletricidade. Por favor, tente novamente.");
      console.error("Edit electricity profile error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Perfil de Eletricidade</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Eletricidade</DialogTitle>
          <DialogDescription>
            Altere os detalhes do seu perfil de custo de eletricidade.
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
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};