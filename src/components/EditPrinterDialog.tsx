"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePrinters, Printer } from "@/hooks/use-printers";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predefinedPrinters } from "./AddPrinterDialog"; // Importado do AddPrinterDialog

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A marca é obrigatória."),
  model: z.string().min(1, "O modelo é obrigatório."),
  // workingHours: z.coerce.number().min(0, "As horas de trabalho não podem ser negativas.").default(0), // Removido
});

interface EditPrinterDialogProps {
  printer: Printer;
  // Removida prop onSuccess
}

export const EditPrinterDialog = ({ printer /* onSuccess */ }: EditPrinterDialogProps) => {
  const { updatePrinter } = usePrinters();
  const [open, setOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<string | undefined>(printer.brand);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: printer.name,
      brand: printer.brand,
      model: printer.model,
      // workingHours: printer.workingHours, // Removido
    },
  });

  // Effect to reset model when brand changes, if the new brand doesn't have the current model
  React.useEffect(() => {
    if (selectedBrand !== form.getValues("brand")) {
      const modelsForNewBrand = predefinedPrinters
        .filter((p) => p.brand === selectedBrand)
        .map((p) => p.model);
      if (!modelsForNewBrand.includes(form.getValues("model"))) {
        form.setValue("model", "");
      }
    }
  }, [selectedBrand, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      // Ao atualizar, apenas passamos os campos que estão no formulário (name, brand, model)
      // O campo workingHours não é editável aqui, então não é incluído no objeto de atualização
      updatePrinter(printer.id, {
        name: values.name,
        brand: values.brand,
        model: values.model,
        // workingHours permanece inalterado no objeto original da impressora
      });
      showSuccess(`Impressora "${values.name}" atualizada com sucesso!`);
      setOpen(false);
      // onSuccess?.(); // Não é mais necessário chamar o callback
    } catch (error) {
      showError("Erro ao atualizar impressora. Por favor, tente novamente.");
      console.error("Edit printer error:", error);
    }
  };

  const uniqueBrands = Array.from(new Set(predefinedPrinters.map((p) => p.brand))).sort();
  const modelsForSelectedBrand = selectedBrand
    ? predefinedPrinters
        .filter((p) => p.brand === selectedBrand)
        .map((p) => p.model)
        .sort()
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Impressora</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Impressora</DialogTitle>
          <DialogDescription>
            Altere os detalhes da sua impressora 3D.
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
                    <Input placeholder="Minha Ender 3" {...field} />
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
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedBrand || modelsForSelectedBrand.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelsForSelectedBrand.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Campo workingHours removido daqui */}
            <DialogFooter>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};