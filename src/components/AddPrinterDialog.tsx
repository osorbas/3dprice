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
import { PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A marca é obrigatória."),
  model: z.string().min(1, "O modelo é obrigatório."),
  powerConsumptionWatts: z.coerce.number().min(0, "O consumo de energia não pode ser negativo.").default(50),
  workingHours: z.coerce.number().min(0, "As horas de trabalho não podem ser negativas.").default(0),
});

// Explicitly define the type for the form values
type AddPrinterFormValues = z.infer<typeof formSchema>;

interface AddPrinterDialogProps {
  // Removida prop onSuccess
}

// Predefined list of popular 3D printers (used for select options)
// Omitimos 'id', 'timestamp', 'workingHours' e 'status' (que é definido no hook)
export const predefinedPrinters: Omit<Printer, "id" | "timestamp" | "workingHours" | "status">[] = [ // Exportado
  { name: "Creality Ender 3 V2", brand: "Creality", model: "Ender 3 V2", powerConsumptionWatts: 150 },
  { name: "Creality Ender 3 V3 SE", brand: "Creality", model: "Ender 3 V3 SE", powerConsumptionWatts: 200 },
  { name: "Creality Ender 3 V3 KE", brand: "Creality", model: "Ender 3 V3 KE", powerConsumptionWatts: 250 },
  { name: "Creality K1", brand: "Creality", model: "K1", powerConsumptionWatts: 350 },
  { name: "Creality K1 Max", brand: "Creality", model: "K1 Max", powerConsumptionWatts: 400 },
  { name: "Creality CR-10 Smart Pro", brand: "Creality", model: "CR-10 Smart Pro", powerConsumptionWatts: 300 },
  { name: "Prusa i3 MK3S+", brand: "Prusa Research", model: "i3 MK3S+", powerConsumptionWatts: 180 },
  { name: "Prusa Mini+", brand: "Prusa Research", model: "Mini+", powerConsumptionWatts: 100 },
  { name: "Prusa XL (1 Toolhead)", brand: "Prusa Research", model: "XL (1 Toolhead)", powerConsumptionWatts: 300 },
  { name: "Prusa XL (5 Toolheads)", brand: "Prusa Research", model: "XL (5 Toolheads)", powerConsumptionWatts: 450 },
  { name: "Bambu Lab P1P", brand: "Bambu Lab", model: "P1P", powerConsumptionWatts: 300 },
  { name: "Bambu Lab P1S", brand: "Bambu Lab", model: "P1S", powerConsumptionWatts: 300 },
  { name: "Bambu Lab A1", brand: "Bambu Lab", model: "A1", powerConsumptionWatts: 250 },
  { name: "Bambu Lab A1 Mini", brand: "Bambu Lab", model: "A1 Mini", powerConsumptionWatts: 150 },
  { name: "Bambu Lab X1 Carbon", brand: "Bambu Lab", model: "X1 Carbon", powerConsumptionWatts: 350 },
  { name: "Bambu Lab X1E", brand: "Bambu Lab", model: "X1E", powerConsumptionWatts: 400 },
  { name: "Bambu Lab P1S Pro", brand: "Bambu Lab", model: "P1S Pro", powerConsumptionWatts: 320 },
  { name: "Bambu Lab H2D", brand: "Bambu Lab", model: "H2D", powerConsumptionWatts: 280 },
  { name: "Bambu Lab H2S", brand: "Bambu Lab", model: "H2S", powerConsumptionWatts: 280 },
  { name: "Bambu Lab H2C", brand: "Bambu Lab", model: "H2C", powerConsumptionWatts: 280 },
  { name: "Anycubic Kobra 2 Neo", brand: "Anycubic", model: "Kobra 2 Neo", powerConsumptionWatts: 200 },
  { name: "Anycubic Kobra 2 Pro", brand: "Anycubic", model: "Kobra 2 Pro", powerConsumptionWatts: 250 },
  { name: "Anycubic Kobra 2 Plus", brand: "Anycubic", model: "Kobra 2 Plus", powerConsumptionWatts: 300 },
  { name: "Anycubic Kobra 2 Max", brand: "Anycubic", model: "Kobra 2 Max", powerConsumptionWatts: 350 },
  { name: "Anycubic Vyper", brand: "Anycubic", model: "Vyper", powerConsumptionWatts: 220 },
  { name: "Elegoo Neptune 4", brand: "Elegoo", model: "Neptune 4", powerConsumptionWatts: 200 },
  { name: "Elegoo Neptune 4 Pro", brand: "Elegoo", model: "Neptune 4 Pro", powerConsumptionWatts: 250 },
  { name: "Elegoo Neptune 4 Plus", brand: "Elegoo", model: "Neptune 4 Plus", powerConsumptionWatts: 300 },
  { name: "Elegoo Neptune 4 Max", brand: "Elegoo", model: "Neptune 4 Max", powerConsumptionWatts: 350 },
  { name: "Blocks Zero", brand: "Blocks", model: "Zero", powerConsumptionWatts: 180 },
  { name: "Blocks One", brand: "Blocks", model: "One", powerConsumptionWatts: 250 },
  { name: "Outra Impressora", brand: "Outra", model: "Modelo Personalizado", powerConsumptionWatts: 100 },
];

export const AddPrinterDialog = ({ /* onSuccess */ }: AddPrinterDialogProps) => {
  const { addPrinter } = usePrinters();
  const [open, setOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<string | undefined>(undefined);
  const form = useForm<AddPrinterFormValues>({ // Use the explicit type here
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      powerConsumptionWatts: 50, // Default value
      workingHours: 0,
    },
  });

  // Effect to reset model when brand changes
  React.useEffect(() => {
    if (selectedBrand !== form.getValues("brand")) {
      form.setValue("model", "");
    }
  }, [selectedBrand, form]);

  const onSubmit = (values: AddPrinterFormValues) => { // Use the explicit type here
    try {
      // O tipo de 'values' corresponde a Omit<Printer, "id" | "status" | "timestamp">
      addPrinter(values);
      showSuccess(`Impressora "${values.name}" adicionada com sucesso!`);
      form.reset();
      setSelectedBrand(undefined); // Reset selected brand state
      setOpen(false);
      // onSuccess?.(); // Não é mais necessário chamar o callback
    } catch (error) {
      showError("Erro ao adicionar impressora. Por favor, tente novamente.");
      console.error("Add printer error:", error);
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
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Adicionar Impressora
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Impressora</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua impressora 3D.
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
                      // Set default power consumption when brand/model changes
                      const selectedPrinter = predefinedPrinters.find(p => p.brand === value && p.model === form.getValues("model"));
                      if (selectedPrinter) {
                        form.setValue("powerConsumptionWatts", selectedPrinter.powerConsumptionWatts);
                      } else {
                        form.setValue("powerConsumptionWatts", 50); // Fallback default
                      }
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Set default power consumption when model changes
                      const selectedPrinter = predefinedPrinters.find(p => p.brand === form.getValues("brand") && p.model === value);
                      if (selectedPrinter) {
                        form.setValue("powerConsumptionWatts", selectedPrinter.powerConsumptionWatts);
                      } else {
                        form.setValue("powerConsumptionWatts", 50); // Fallback default
                      }
                    }}
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
              name="powerConsumptionWatts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumo de Energia (Watts)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="50"
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
              <Button type="submit">Adicionar Impressora</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};