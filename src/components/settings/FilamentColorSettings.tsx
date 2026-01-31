"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Palette } from "lucide-react";
import { useFilamentColors } from "@/hooks/use-filament-colors";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

export const FilamentColorSettings = () => {
  const { colors, addColor, removeColor } = useFilamentColors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  const handleAddColor = () => {
    if (!newColorName.trim() || !/^#[0-9A-F]{6}$/i.test(newColorHex)) {
      showError("Nome e código HEX (#RRGGBB) válidos são obrigatórios.");
      return;
    }
    try {
      addColor(newColorName, newColorHex);
      showSuccess(`Cor "${newColorName}" adicionada!`);
      setNewColorName("");
      setNewColorHex("#000000");
      setIsDialogOpen(false);
    } catch (e) {
      showError("Erro ao adicionar cor.");
    }
  };

  const handleRemoveColor = (name: string, hex: string) => {
    try {
      removeColor(hex);
      showSuccess(`Cor "${name}" removida.`);
    } catch (e) {
      showError("Erro ao remover cor.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Gestão de Cores de Filamento
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Cor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Cor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="color-name">Nome da Cor</Label>
                <Input 
                  id="color-name"
                  placeholder="Ex: Azul Pastel" 
                  value={newColorName} 
                  onChange={(e) => setNewColorName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color-hex">Código HEX</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    id="color-hex"
                    placeholder="#RRGGBB" 
                    value={newColorHex} 
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="flex-grow"
                  />
                  <div 
                    className="h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700" 
                    style={{ backgroundColor: newColorHex }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddColor}>Adicionar Cor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {colors.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma cor configurada.</p>
          ) : (
            colors.map(color => (
              <div 
                key={color.hex} 
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-all",
                  color.hex === "#FFFFFF" ? "bg-gray-100 text-gray-800 border-gray-300" : "bg-secondary text-secondary-foreground"
                )}
              >
                <div 
                  className="h-4 w-4 rounded-full border border-black/20 shadow-sm flex-shrink-0" 
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name} ({color.hex})</span>
                <button 
                  onClick={() => handleRemoveColor(color.name, color.hex)}
                  className="p-0.5 hover:text-destructive transition-colors"
                  title={`Remover ${color.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};