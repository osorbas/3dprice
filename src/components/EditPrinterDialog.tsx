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

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A marca é obrigatória."),
  model: z.string().min(1, "O modelo é obrigatório."),
  workingHours: z.coerce.number().min(0, "As horas de trabalho não podem ser negativas.").default(0), // Adicionado
});

interface EditPrinterDialogProps {
  printer: Printer;
  // Removida prop onSuccess
}

// Predefined list of popular 3D printers (used for select options)
const predefinedPrinters: Omit<Printer, "id" | "timestamp" | "workingHours">[] = [ // Atualizado para omitir workingHours
  { name: "Creality Ender 3 V2", brand: "Creality", model: "Ender 3 V2" },
  { name: "Creality Ender 3 V3 SE", brand: "Creality", model: "Ender 3 V3 SE" },
  { name: "Creality Ender 3 V3 KE", brand: "Creality", model: "Ender 3 V3 KE" },
  { name: "Creality K1", brand: "Creality", model: "K1" },
  { name: "Creality K1 Max", brand: "Creality", model: "K1 Max" },
  { name: "Creality CR-10 Smart Pro", brand: "Creality", model: "CR-10 Smart Pro" },
  { name: "Prusa i3 MK3S+", brand: "Prusa Research", model: "i3 MK3S+" },
  { name: "Prusa Mini+", brand: "Prusa Research", model: "Mini+" },
  { name: "Prusa XL (1 Toolhead)", brand: "Prusa Research", model: "XL (1 Toolhead)" },
  { name: "Prusa XL (5 Toolheads)", brand: "Prusa Research", model: "XL (5 Toolheads)" },
  { name: "Bambu Lab P1P", brand: "Bambu Lab", model: "P1P" },
  { name: "Bambu Lab P1S", brand: "Bambu Lab", model: "P1S" },
  { name: "Bambu Lab P1S Combo", brand: "Bambu Lab", model: "P1S Combo" },
  { name: "Bambu Lab A1", brand: "Bambu Lab", model: "A1" },
  { name: "Bambu Lab A1 Mini", brand: "Bambu Lab", model: "A1 Mini" },
  { name: "Bambu Lab A1 Mini Combo", brand: "Bambu Lab", model: "A1 Mini Combo" },
  { name: "Bambu Lab X1 Carbon", brand: "Bambu Lab", model: "X1 Carbon" },
  { name: "Bambu Lab X1 Carbon Combo", brand: "Bambu Lab", model: "X1 Carbon Combo" },
  { name: "Anycubic Kobra 2 Neo", brand: "Anycubic", model: "Kobra 2 Neo" },
  { name: "Anycubic Kobra 2 Pro", brand: "Anycubic", model: "Kobra 2 Pro" },
  { name: "Anycubic Kobra 2 Plus", brand: "Anycubic", model: "Kobra 2 Plus" },
  { name: "Anycubic Kobra 2 Max", brand: "Anycubic", model: "Kobra 2 Max" },
  { name: "Anycubic Vyper", brand: "Anycubic", model: "Vyper" },
  { name: "Elegoo Neptune 4", brand: "Elegoo", model: "Neptune 4" },
  { name: "Elegoo Neptune 4 Pro", brand: "Elegoo", model: "Neptune 4 Pro" },
  { name: "Elegoo Neptune 4 Plus", brand: "Elegoo", model: "Neptune 4 Plus" },
  { name: "Elegoo Neptune 4 Max", brand: "Elegoo", model: "Neptune 4 Max" },
  { name: "Outra Impressora", brand: "Outra", model: "Modelo Personalizado" },
];

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
      workingHours: printer.workingHours, // Inicializa o novo campo
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
      updatePrinter(printer.id, values);
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
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horas de Trabalho (h)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : value);
                      }}
                    />
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