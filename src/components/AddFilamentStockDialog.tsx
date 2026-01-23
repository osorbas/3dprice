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
import { PlusCircle, PackagePlus } from "lucide-react";

const formSchema = z.object({
  amountGrams: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1g."),
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
      amountGrams: 1000,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      addStock(filament.id, values.amountGrams);
      showSuccess(`Adicionadas ${values.amountGrams}g ao stock de ${filament.name || filament.brand}.`);
      form.reset();
      setOpen(false);
    } catch (err) {
      showError("Erro ao adicionar stock.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title="Dar entrada de filamento">
          <PackagePlus className="h-4 w-4" />
          <span className="sr-only">Dar entrada</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Entrada de Filamento</DialogTitle>
          <DialogDescription>
            Adiciona gramas ao stock atual de <strong>{filament.name || `${filament.brand} ${filament.type}`}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amountGrams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade a Adicionar (gramas)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" {...field} className="pr-12" />
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">g</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full">Confirmar Entrada</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};