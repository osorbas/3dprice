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
import { Trash2, Download, Upload, Printer as PrinterIcon, Check, Zap, Package, Plus, X } from "lucide-react";
import { usePrintCalculations } from "@/hooks/use-print-calculations";
import { usePrinters } from "@/hooks/use-printers";
import { useFilaments } from "@/hooks/use-filaments";
import { useExtraMaterials } from "@/hooks/use-extras";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { useCustomBrands } from "@/hooks/use-custom-brands";
import { showError, showSuccess } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DEFAULT_PROFIT_MARGIN = 20;

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { calculations, clearCalculations, importCalculations } = usePrintCalculations();
  const { printers, clearPrinters, importPrinters } = usePrinters();
  const { filaments, clearFilaments, importFilaments } = useFilaments();
  const { extraMaterials, clearExtraMaterials, importExtraMaterials } = useExtraMaterials();
  const { electricityProfiles, clearElectricityProfiles, importElectricityProfiles } = useElectricityProfiles();
  const { customBrands, addBrand, removeBrand } = useCustomBrands();

  const [newBrandName, setNewBrandName] = React.useState("");

  const [defaultProfitMargin, setDefaultProfitMargin] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedMargin = localStorage.getItem("default_profit_margin");
      return storedMargin ? parseFloat(storedMargin) : DEFAULT_PROFIT_MARGIN;
    }
    return DEFAULT_PROFIT_MARGIN;
  });
  const [tempProfitMargin, setTempProfitMargin] = React.useState<number>(defaultProfitMargin);

  const [manageStock, setManageStock] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("manage_filament_stock") === "true";
    }
    return false;
  });

  const [defaultPrinterId, setDefaultPrinterId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("default_printer_id");
    return null;
  });

  const [defaultFilamentId, setDefaultFilamentId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("default_filament_id");
    return null;
  });

  const [defaultElectricityProfileId, setDefaultElectricityProfileId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("default_electricity_profile_id");
    return null;
  });

  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [selectedImportTypes, setSelectedImportTypes] = React.useState({
    calculations: true,
    printers: true,
    filaments: true,
    extraMaterials: true,
    electricityProfiles: true,
    appSettings: true,
  });

  const handleAddCustomBrand = () => {
    if (!newBrandName.trim()) return;
    addBrand(newBrandName);
    setNewBrandName("");
    showSuccess(`Marca "${newBrandName}" adicionada!`);
  };

  const handleToggleStock = (checked: boolean) => {
    setManageStock(checked);
    localStorage.setItem("manage_filament_stock", checked.toString());
    showSuccess(`Gestão de stock ${checked ? 'ativada' : 'desativada'}.`);
  };

  const handleClearHistory = () => {
    clearCalculations();
    showSuccess("Histórico de cálculos limpo!");
  };

  const handleExportAll = () => {
    const backupData = {
      calculations, printers, filaments, extraMaterials, electricityProfiles,
      appSettings: {
        default_profit_margin: localStorage.getItem("default_profit_margin"),
        default_printer_id: localStorage.getItem("default_printer_id"),
        default_filament_id: localStorage.getItem("default_filament_id"),
        default_electricity_profile_id: localStorage.getItem("default_electricity_profile_id"),
        manage_filament_stock: localStorage.getItem("manage_filament_stock"),
      },
      timestamp: new Date().toISOString(),
    };
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `backup-completo-3d-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showSuccess("Backup exportado!");
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImportFile(e.target.files[0]);
      setImportDialogOpen(true);
    }
    e.target.value = "";
  };

  const handleImportConfirm = () => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      let data: any;
      try {
        data = JSON.parse(e.target?.result as string);
      } catch (err) {
        console.error("JSON Parsing Error during import:", err);
        showError("Erro ao processar o ficheiro. Certifique-se de que é um ficheiro de backup JSON válido.");
        return;
      }
      
      try {
        const isValidArray = (arr: any) => Array.isArray(arr);

        if (selectedImportTypes.calculations) {
          const calcs = data.calculations;
          if (calcs && isValidArray(calcs)) importCalculations(calcs);
        }
        
        if (selectedImportTypes.printers) {
          const prts = data.printers;
          if (prts && isValidArray(prts)) importPrinters(prts);
        }
        
        if (selectedImportTypes.filaments) {
          const fils = data.filaments;
          if (fils && isValidArray(fils)) importFilaments(fils);
        }
        
        if (selectedImportTypes.extraMaterials) {
          const extras = data.extraMaterials;
          if (extras && isValidArray(extras)) importExtraMaterials(extras);
        }
        
        if (selectedImportTypes.electricityProfiles) {
          const elec = data.electricityProfiles;
          if (elec && isValidArray(elec)) importElectricityProfiles(elec);
        }
        
        if (selectedImportTypes.appSettings && data.appSettings) {
          Object.entries(data.appSettings).forEach(([k, v]) => {
            if (v !== null) localStorage.setItem(k, v as string);
          });
          if (data.appSettings.manage_filament_stock) setManageStock(data.appSettings.manage_filament_stock === "true");
        }
        
        showSuccess("Importação concluída!");
        setImportDialogOpen(false);
      } catch (err) { 
        console.error("Import logic error:", err);
        showError("Erro ao aplicar os dados importados."); 
      }
    };
    reader.readAsText(importFile);
  };

  const handleConfirmProfitMargin = () => {
    localStorage.setItem("default_profit_margin", tempProfitMargin.toString());
    setDefaultProfitMargin(tempProfitMargin);
    showSuccess("Margem de lucro atualizada!");
  };

  const updateDefaultPrinter = (id: string) => {
    setDefaultPrinterId(id);
    localStorage.setItem("default_printer_id", id);
    showSuccess("Impressora predefinida atualizada!");
  };

  const updateDefaultFilament = (id: string) => {
    setDefaultFilamentId(id);
    localStorage.setItem("default_filament_id", id);
    showSuccess("Filamento predefinido atualizado!");
  };

  const updateDefaultElectricityProfile = (id: string) => {
    setDefaultElectricityProfileId(id);
    localStorage.setItem("default_electricity_profile_id", id);
    showSuccess("Perfil de energia predefinido atualizado!");
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Definições</h1>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-fit grid-cols-5 gap-2">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="printers">Impressoras</TabsTrigger>
          <TabsTrigger value="filaments">Filamentos</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
          <TabsTrigger value="electricity">Eletricidade</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle>Geral</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Gerir Stock de Filamento</Label>
                  <p className="text-sm text-muted-foreground">Descontar automaticamente a quantidade usada no stock ao guardar cálculos.</p>
                </div>
                <Switch checked={manageStock} onCheckedChange={handleToggleStock} />
              </div>

              <div className="grid gap-2">
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Margem de Lucro Predefinida (%)</Label>
                <div className="flex gap-2">
                  <Input type="number" value={tempProfitMargin} onChange={(e) => setTempProfitMargin(parseFloat(e.target.value))} className="w-[180px]" />
                  <Button variant="outline" onClick={handleConfirmProfitMargin}><Check className="h-4 w-4 mr-2" /> Confirmar</Button>
                </div>
              </div>

              <div className="border-t pt-6 space-y-6">
                <h3 className="text-lg font-medium">Predefinições de Cálculo</h3>
                <p className="text-sm text-muted-foreground -mt-4">Escolha os valores que aparecerão preenchidos ao abrir a calculadora.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><PrinterIcon className="h-4 w-4" /> Impressora</Label>
                    <Select value={defaultPrinterId || "none"} onValueChange={updateDefaultPrinter}>
                      <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {printers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Filamento</Label>
                    <Select value={defaultFilamentId || "none"} onValueChange={updateDefaultFilament}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {filaments.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Zap className="h-4 w-4" /> Perfil Energia</Label>
                    <Select value={defaultElectricityProfileId || "none"} onValueChange={updateDefaultElectricityProfile}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {electricityProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-medium">Dados</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleExportAll}><Download className="h-4 w-4 mr-2" /> Exportar Backup</Button>
                  <Label htmlFor="import-all" className="cursor-pointer">
                    <Button variant="secondary" asChild><span className="flex items-center"><Upload className="h-4 w-4 mr-2" /> Importar Backup</span></Button>
                  </Label>
                  <Input id="import-all" type="file" accept=".json" className="hidden" onChange={handleImportFileSelect} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Limpar Histórico</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle><AlertDialogDescription>Isto removerá todo o histórico de cálculos.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearHistory}>Limpar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printers" className="pt-4"><PrintersPage /></TabsContent>
        <TabsContent value="filaments" className="pt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Gestão de Marcas de Filamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome da marca (ex: Filament 3D)" 
                    value={newBrandName} 
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBrand()}
                  />
                  <Button onClick={handleAddCustomBrand}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {customBrands.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhuma marca personalizada adicionada.</p>
                  ) : (
                    customBrands.map(brand => (
                      <div key={brand} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        {brand}
                        <button 
                          onClick={() => removeBrand(brand)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <FilamentsPage />
          </div>
        </TabsContent>
        <TabsContent value="extras" className="pt-4"><ExtrasPage /></TabsContent>
        <TabsContent value="electricity" className="pt-4"><ElectricityProfilesPage /></TabsContent>
      </Tabs>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar Dados</DialogTitle><DialogDescription>Escolha o que deseja importar.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-4">
            {Object.entries(selectedImportTypes).map(([k, v]) => (
              <div key={k} className="flex items-center space-x-2">
                <Checkbox id={k} checked={v} onCheckedChange={(checked) => setSelectedImportTypes(prev => ({ ...prev, [k]: !!checked }))} />
                <Label htmlFor={k}>{k}</Label>
              </div>
            ))}
          </div>
          <DialogFooter><Button onClick={handleImportConfirm}>Importar Selecionados</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;