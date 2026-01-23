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
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  gramsToAdd: z.coerce.number().min(1, "A quantidade deve ser positiva."),
});

interface AddFilamentStockDialogProps {
  filament: Filament;
}

export const AddFilamentStockDialog = ({ filament }: AddFilamentStockDialogProps) => {
  const { addStock } = useFilaments();
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gramsToAdd: 1000,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      addStock(filament.id, values.gramsToAdd);
      showSuccess(`Adicionadas ${values.gramsToAdd}g ao stock de ${filament.name || filament.type}!`);
      form.reset();
      setOpen(false);
    } catch (err) { 
      showError("Erro ao adicionar stock."); 
      console.error("Add stock error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" title="Dar entrada de filamento">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adicionar Stock</DialogTitle>
          <DialogDescription>
            Adicione mais filamento à bobina de <strong>{filament.name || filament.type}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={form.control} name="gramsToAdd" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade a Adicionar (gramas)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">Adicionar Stock</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};