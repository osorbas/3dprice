"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrintersPage from "./PrintersPage";
import FilamentsPage from "./FilamentsPage";
import ExtrasPage from "./ExtrasPage";
import ElectricityProfilesPage from "./ElectricityProfilesPage";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Upload, Printer as PrinterIcon, Check, Zap, Package } from "lucide-react";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { showError, showSuccess } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const DEFAULT_PROFIT_MARGIN = 20; // Margem padrão se não houver nada guardado

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const {
    calculations,
    clearCalculations,
    importCalculations
  } = usePrintCalculations();
  const {
    printers,
    clearPrinters,
    importPrinters
  } = usePrinters();
  const {
    filaments,
    clearFilaments,
    importFilaments
  } = useFilaments();
  const {
    extraMaterials,
    clearExtraMaterials,
    importExtraMaterials
  } = useExtraMaterials();
  const {
    electricityProfiles,
    clearElectricityProfiles,
    importElectricityProfiles
  } = useElectricityProfiles();

  // Estado para margem de lucro predefinida
  const [defaultProfitMargin, setDefaultProfitMargin] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedMargin = localStorage.getItem("default_profit_margin");
      return storedMargin ? parseFloat(storedMargin) : DEFAULT_PROFIT_MARGIN;
    }
    return DEFAULT_PROFIT_MARGIN;
  });
  const [tempProfitMargin, setTempProfitMargin] = React.useState<number>(defaultProfitMargin);

  // Estado para impressora predefinida
  const [defaultPrinterId, setDefaultPrinterId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("default_printer_id");
    }
    return null;
  });

  // Estado temporário para a impressora selecionada antes de confirmar
  const [tempPrinterId, setTempPrinterId] = React.useState<string | null>(null);

  // Estado para filamento predefinido
  const [defaultFilamentId, setDefaultFilamentId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("default_filament_id");
    }
    return null;
  });

  // Estado temporário para o filamento selecionado antes de confirmar
  const [tempFilamentId, setTempFilamentId] = React.useState<string | null>(null);

  // Estado para perfil de eletricidade predefinido
  const [defaultElectricityProfileId, setDefaultElectricityProfileId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("default_electricity_profile_id");
    }
    return null;
  });

  // Estado temporário para o perfil de eletricidade selecionado antes de confirmar
  const [tempElectricityProfileId, setTempElectricityProfileId] = React.useState<string | null>(null);

  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [selectedImportTypes, setSelectedImportTypes] = React.useState({
    calculations: true,
    printers: true,
    filaments: true,
    extraMaterials: true,
    electricityProfiles: true,
    appSettings: true, // Adicionado para as predefinições
  });

  // Efeito para salvar a impressora predefinida no localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (defaultPrinterId) {
        localStorage.setItem("default_printer_id", defaultPrinterId);
      } else {
        localStorage.removeItem("default_printer_id");
      }
    }
  }, [defaultPrinterId]);

  // Efeito para sincronizar tempPrinterId com defaultPrinterId e validar se a impressora ainda existe
  React.useEffect(() => {
    if (defaultPrinterId && !printers.some(p => p.id === defaultPrinterId)) {
      // If the default printer no longer exists, clear it
      setDefaultPrinterId(null);
      setTempPrinterId(null);
    } else {
      setTempPrinterId(defaultPrinterId);
    }
  }, [defaultPrinterId, printers]);

  // Efeito para salvar o filamento predefinido no localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (defaultFilamentId) {
        localStorage.setItem("default_filament_id", defaultFilamentId);
      } else {
        localStorage.removeItem("default_filament_id");
      }
    }
  }, [defaultFilamentId]);

  // Efeito para sincronizar tempFilamentId com defaultFilamentId e validar se o filamento ainda existe
  React.useEffect(() => {
    if (defaultFilamentId && !filaments.some(f => f.id === defaultFilamentId)) {
      // If the default filament no longer exists, clear it
      setDefaultFilamentId(null);
      setTempFilamentId(null);
    } else {
      setTempFilamentId(defaultFilamentId);
    }
  }, [defaultFilamentId, filaments]);

  // Efeito para salvar o perfil de eletricidade predefinido no localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (defaultElectricityProfileId) {
        localStorage.setItem("default_electricity_profile_id", defaultElectricityProfileId);
      } else {
        localStorage.removeItem("default_electricity_profile_id");
      }
    }
  }, [defaultElectricityProfileId]);

  // Efeito para sincronizar tempElectricityProfileId com defaultElectricityProfileId e validar se o perfil ainda existe
  React.useEffect(() => {
    if (defaultElectricityProfileId && !electricityProfiles.some(p => p.id === defaultElectricityProfileId)) {
      // If the default profile no longer exists, clear it
      setDefaultElectricityProfileId(null);
      setTempElectricityProfileId(null);
    } else {
      setTempElectricityProfileId(defaultElectricityProfileId);
    }
  }, [defaultElectricityProfileId, electricityProfiles]);


  const handleClearHistory = () => {
    try {
      clearCalculations();
      showSuccess("Histórico de cálculos limpo com sucesso!");
    } catch (error) {
      showError("Erro ao limpar o histórico.");
      console.error("Clear history error:", error);
    }
  };

  const handleExportAll = () => {
    try {
      const backupData = {
        calculations,
        printers,
        filaments,
        extraMaterials,
        electricityProfiles,
        appSettings: { // Incluir as predefinições
          default_profit_margin: localStorage.getItem("default_profit_margin"),
          default_printer_id: localStorage.getItem("default_printer_id"),
          default_filament_id: localStorage.getItem("default_filament_id"),
          default_electricity_profile_id: localStorage.getItem("default_electricity_profile_id"),
        },
        timestamp: new Date().toISOString(),
        version: "1.0"
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

      const exportFileDefaultName = `backup-completo-3d-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      showSuccess("Backup completo exportado com sucesso!");
    } catch (error) {
      showError("Erro ao exportar backup completo.");
      console.error("Export error:", error);
    }
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportDialogOpen(true);
    event.target.value = "";
  };

  const handleImportConfirm = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (selectedImportTypes.calculations && data.calculations) {
          importCalculations(data.calculations);
        }

        if (selectedImportTypes.printers && data.printers) {
          importPrinters(data.printers);
        }

        if (selectedImportTypes.filaments && data.filaments) {
          importFilaments(data.filaments);
        }

        if (selectedImportTypes.extraMaterials && data.extraMaterials) {
          importExtraMaterials(data.extraMaterials);
        }

        if (selectedImportTypes.electricityProfiles && data.electricityProfiles) {
          importElectricityProfiles(data.electricityProfiles);
        }

        if (selectedImportTypes.appSettings && data.appSettings) {
          if (data.appSettings.default_profit_margin !== undefined) {
            localStorage.setItem("default_profit_margin", data.appSettings.default_profit_margin);
            setDefaultProfitMargin(parseFloat(data.appSettings.default_profit_margin));
            setTempProfitMargin(parseFloat(data.appSettings.default_profit_margin));
          }
          if (data.appSettings.default_printer_id !== undefined) {
            localStorage.setItem("default_printer_id", data.appSettings.default_printer_id);
            setDefaultPrinterId(data.appSettings.default_printer_id);
            setTempPrinterId(data.appSettings.default_printer_id);
          } else {
            localStorage.removeItem("default_printer_id");
            setDefaultPrinterId(null);
            setTempPrinterId(null);
          }
          if (data.appSettings.default_filament_id !== undefined) {
            localStorage.setItem("default_filament_id", data.appSettings.default_filament_id);
            setDefaultFilamentId(data.appSettings.default_filament_id);
            setTempFilamentId(data.appSettings.default_filament_id);
          } else {
            localStorage.removeItem("default_filament_id");
            setDefaultFilamentId(null);
            setTempFilamentId(null);
          }
          if (data.appSettings.default_electricity_profile_id !== undefined) {
            localStorage.setItem("default_electricity_profile_id", data.appSettings.default_electricity_profile_id);
            setDefaultElectricityProfileId(data.appSettings.default_electricity_profile_id);
            setTempElectricityProfileId(data.appSettings.default_electricity_profile_id);
          } else {
            localStorage.removeItem("default_electricity_profile_id");
            setDefaultElectricityProfileId(null);
            setTempElectricityProfileId(null);
          }
        }

        showSuccess("Backup importado com sucesso!");
        setImportDialogOpen(false);
        setImportFile(null);
      } catch (error) {
        showError("Erro ao importar backup. Arquivo inválido.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(importFile);
  };

  const handleImportTypeChange = (type: keyof typeof selectedImportTypes) => {
    setSelectedImportTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSelectAll = () => {
    setSelectedImportTypes({
      calculations: true,
      printers: true,
      filaments: true,
      extraMaterials: true,
      electricityProfiles: true,
      appSettings: true
    });
  };

  const handleDeselectAll = () => {
    setSelectedImportTypes({
      calculations: false,
      printers: false,
      filaments: false,
      extraMaterials: false,
      electricityProfiles: false,
      appSettings: false
    });
  };

  const handleConfirmPrinter = () => {
    if (tempPrinterId) {
      setDefaultPrinterId(tempPrinterId);
      showSuccess("Impressora predefinida atualizada com sucesso!");
    } else {
      setDefaultPrinterId(null);
      showSuccess("Impressora predefinida removida com sucesso!");
    }
  };

  const handleClearPrinter = () => {
    setDefaultPrinterId(null);
    setTempPrinterId(null);
    showSuccess("Impressora predefinida removida com sucesso!");
  };

  const handleConfirmFilament = () => {
    if (tempFilamentId) {
      setDefaultFilamentId(tempFilamentId);
      showSuccess("Filamento predefinido atualizado com sucesso!");
    } else {
      setDefaultFilamentId(null);
      showSuccess("Filamento predefinido removido com sucesso!");
    }
  };

  const handleClearFilament = () => {
    setDefaultFilamentId(null);
    setTempFilamentId(null);
    showSuccess("Filamento predefinido removido com sucesso!");
  };

  const handleConfirmElectricityProfile = () => {
    if (tempElectricityProfileId) {
      setDefaultElectricityProfileId(tempElectricityProfileId);
      showSuccess("Perfil de eletricidade predefinido atualizado com sucesso!");
    } else {
      setDefaultElectricityProfileId(null);
      showSuccess("Perfil de eletricidade predefinido removido com sucesso!");
    }
  };

  const handleClearElectricityProfile = () => {
    setDefaultElectricityProfileId(null);
    setTempElectricityProfileId(null);
    showSuccess("Perfil de eletricidade predefinido removido com sucesso!");
  };

  const handleProfitMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
      setTempProfitMargin(numValue);
    } else if (value === "") {
      setTempProfitMargin(0);
    }
  };

  const handleConfirmProfitMargin = () => {
    if (tempProfitMargin !== defaultProfitMargin) {
      if (typeof window !== "undefined") {
        localStorage.setItem("default_profit_margin", tempProfitMargin.toString());
      }
      setDefaultProfitMargin(tempProfitMargin);
      showSuccess(`Margem de lucro predefinida definida para ${tempProfitMargin}%`);
    }
  };

  // Determine if the printer confirm button should be disabled and its color
  const isPrinterConfirmDisabled = printers.length === 0 || !tempPrinterId || tempPrinterId === defaultPrinterId;
  const printerButtonClasses = cn(
    "flex items-center gap-2",
    isPrinterConfirmDisabled
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-not-allowed"
      : "bg-green-500 text-white hover:bg-green-600"
  );

  // Determine if the filament confirm button should be disabled and its color
  const isFilamentConfirmDisabled = filaments.length === 0 || !tempFilamentId || tempFilamentId === defaultFilamentId;
  const filamentButtonClasses = cn(
    "flex items-center gap-2",
    isFilamentConfirmDisabled
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-not-allowed"
      : "bg-green-500 text-white hover:bg-green-600"
  );

  // Determine if the electricity profile confirm button should be disabled and its color
  const isElectricityConfirmDisabled = electricityProfiles.length === 0 || !tempElectricityProfileId || tempElectricityProfileId === defaultElectricityProfileId;
  const electricityButtonClasses = cn(
    "flex items-center gap-2",
    isElectricityConfirmDisabled
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-not-allowed"
      : "bg-green-500 text-white hover:bg-green-600"
  );

  // Determine if the profit margin confirm button should be disabled
  const isProfitMarginConfirmDisabled = tempProfitMargin === defaultProfitMargin;
  const profitMarginButtonClasses = cn(
    "flex items-center gap-2",
    isProfitMarginConfirmDisabled
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-not-allowed"
      : "bg-green-500 text-white hover:bg-green-600"
  );

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Definições</h1>
      <Tabs defaultValue="general" className="w-full relative">
        <TabsList className="flex flex-wrap gap-2 w-full p-1 mb-4 md:grid md:w-fit md:grid-cols-5 md:mb-0">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="printers">Impressoras</TabsTrigger>
          <TabsTrigger value="filaments">Filamentos</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
          <TabsTrigger value="electricity">Eletricidade</TabsTrigger>
        </TabsList>
        <div className="relative min-h-[500px]">
          <TabsContent value="general" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
            <Card>
              <CardHeader>
                <CardTitle>Definições da Aplicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">Configure as definições gerais da sua aplicação.</p>
                  <div className="grid gap-2">
                    <Label htmlFor="theme-select">Tema</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme-select" className="w-[180px]">
                        <SelectValue placeholder="Selecionar Tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2 pt-4">
                    <Label htmlFor="default-profit-margin">Margem de Lucro Predefinida (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="default-profit-margin"
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        value={tempProfitMargin}
                        onChange={handleProfitMarginChange}
                        className="w-[180px]"
                      />
                      <Button
                        variant={isProfitMarginConfirmDisabled ? "outline" : "default"}
                        size="sm"
                        onClick={handleConfirmProfitMargin}
                        disabled={isProfitMarginConfirmDisabled}
                        className={profitMarginButtonClasses}
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Valor de margem de lucro que será pré-preenchido na calculadora.</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Gestão de Dados</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium">Limpar Histórico de Cálculos</h4>
                        <p className="text-sm text-muted-foreground">Esta ação removerá permanentemente todos os cálculos do histórico</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Limpar Histórico
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso removerá permanentemente todos os seus cálculos do histórico.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearHistory}>Limpar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium">Exportar Backup Completo</h4>
                        <p className="text-sm text-muted-foreground">Fazer backup de todos os dados da aplicação</p>
                      </div>
                      <Button variant="secondary" className="flex items-center gap-2" onClick={handleExportAll}>
                        <Download className="h-4 w-4" />
                        Exportar Backup
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium">Importar Backup Completo</h4>
                        <p className="text-sm text-muted-foreground">Importar todos os dados da aplicação de um arquivo de backup</p>
                      </div>
                      <Label htmlFor="import-all" className="cursor-pointer">
                        <Button variant="secondary" className="flex items-center gap-2" asChild>
                          <span>
                            <Upload className="h-4 w-4" />
                            Importar Backup
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="import-all"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportFileSelect}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="printers" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Impressoras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">Configure as definições relacionadas às suas impressoras 3D.</p>

                  <div className="grid gap-2">
                    <Label htmlFor="default-printer-select">Impressora Predefinida</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={tempPrinterId || "none"}
                        onValueChange={(value) => setTempPrinterId(value === "none" ? null : value)}
                        disabled={printers.length === 0}
                      >
                        <SelectTrigger id="default-printer-select" className="w-[300px]">
                          <SelectValue placeholder="Selecione uma impressora predefinida" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma impressora predefinida</SelectItem>
                          {printers.map((printer) => (
                            <SelectItem key={printer.id} value={printer.id}>
                              <div className="flex items-center gap-2">
                                <PrinterIcon className="h-4 w-4" />
                                {printer.name} ({printer.brand} {printer.model})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={isPrinterConfirmDisabled ? "outline" : "default"}
                        size="sm"
                        onClick={handleConfirmPrinter}
                        disabled={isPrinterConfirmDisabled}
                        className={printerButtonClasses}
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </Button>
                      {defaultPrinterId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleClearPrinter}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    {printers.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Adicione impressoras na lista abaixo para poder selecionar uma como predefinida.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <PrintersPage />
            </div>
          </TabsContent>
          <TabsContent value="filaments" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Filamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">Configure as definições relacionadas aos seus filamentos 3D.</p>

                  <div className="grid gap-2">
                    <Label htmlFor="default-filament-select">Filamento Predefinido</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={tempFilamentId || "none"}
                        onValueChange={(value) => setTempFilamentId(value === "none" ? null : value)}
                        disabled={filaments.length === 0}
                      >
                        <SelectTrigger id="default-filament-select" className="w-[300px]">
                          <SelectValue placeholder="Selecione um filamento predefinido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma filamento predefinido</SelectItem>
                          {filaments.map((filament) => (
                            <SelectItem key={filament.id} value={filament.id}>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {filament.name} ({filament.brand} - {filament.type})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={isFilamentConfirmDisabled ? "outline" : "default"}
                        size="sm"
                        onClick={handleConfirmFilament}
                        disabled={isFilamentConfirmDisabled}
                        className={filamentButtonClasses}
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </Button>
                      {defaultFilamentId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleClearFilament}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    {filaments.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Adicione filamentos na lista abaixo para poder selecionar um como predefinido.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6">
              <FilamentsPage />
            </div>
          </TabsContent>
          <TabsContent value="extras" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
            <ExtrasPage />
          </TabsContent>
          <TabsContent value="electricity" className="space-y-4 pt-4 p-4 rounded-lg border bg-muted/50">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Eletricidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">Configure os perfis de custo de eletricidade por hora.</p>

                  <div className="grid gap-2">
                    <Label htmlFor="default-electricity-profile-select">Perfil de Eletricidade Predefinido</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={tempElectricityProfileId || "none"}
                        onValueChange={(value) => setTempElectricityProfileId(value === "none" ? null : value)}
                        disabled={electricityProfiles.length === 0}
                      >
                        <SelectTrigger id="default-electricity-profile-select" className="w-[300px]">
                          <SelectValue placeholder="Selecione um perfil predefinido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum perfil predefinido</SelectItem>
                          {electricityProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                {profile.name} (€{profile.costPerHour.toFixed(2)}/h)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={isElectricityConfirmDisabled ? "outline" : "default"}
                        size="sm"
                        onClick={handleConfirmElectricityProfile}
                        disabled={isElectricityConfirmDisabled}
                        className={electricityButtonClasses}
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </Button>
                      {defaultElectricityProfileId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleClearElectricityProfile}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    {electricityProfiles.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Adicione perfis de eletricidade na lista abaixo para poder selecionar um como predefinido.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6">
              <ElectricityProfilesPage />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Selecionar Tipos de Dados para Importar</DialogTitle>
            <DialogDescription>
              Escolha quais tipos de dados deseja importar do arquivo de backup.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between mb-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Desmarcar Todos
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="calculations"
                  checked={selectedImportTypes.calculations}
                  onCheckedChange={() => handleImportTypeChange('calculations')}
                />
                <Label htmlFor="calculations" className="font-medium">
                  Histórico de Cálculos
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="printers"
                  checked={selectedImportTypes.printers}
                  onCheckedChange={() => handleImportTypeChange('printers')}
                />
                <Label htmlFor="printers" className="font-medium">
                  Impressoras Registadas
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="filaments"
                  checked={selectedImportTypes.filaments}
                  onCheckedChange={() => handleImportTypeChange('filaments')}
                />
                <Label htmlFor="filaments" className="font-medium">
                  Filamentos Registados
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="extraMaterials"
                  checked={selectedImportTypes.extraMaterials}
                  onCheckedChange={() => handleImportTypeChange('extraMaterials')}
                />
                <Label htmlFor="extraMaterials" className="font-medium">
                  Materiais Extras
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="electricityProfiles"
                  checked={selectedImportTypes.electricityProfiles}
                  onCheckedChange={() => handleImportTypeChange('electricityProfiles')}
                />
                <Label htmlFor="electricityProfiles" className="font-medium">
                  Perfis de Eletricidade
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="appSettings"
                  checked={selectedImportTypes.appSettings}
                  onCheckedChange={() => handleImportTypeChange('appSettings')}
                />
                <Label htmlFor="appSettings" className="font-medium">
                  Definições da Aplicação (Predefinições)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportConfirm}>
              Importar Dados Selecionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;