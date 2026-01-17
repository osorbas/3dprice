"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useElectricityProfiles } from "@/hooks/use-electricity-profiles";
import { AddElectricityProfileDialog } from "@/components/AddElectricityProfileDialog";
import { EditElectricityProfileDialog } from "@/components/EditElectricityProfileDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Zap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showError, showSuccess } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ElectricityProfilesPage = () => {
  const { electricityProfiles, clearElectricityProfiles, deleteElectricityProfile } = useElectricityProfiles();

  const handleClearProfiles = () => {
    try {
      clearElectricityProfiles();
      showSuccess("Histórico de perfis de eletricidade limpo com sucesso!");
    } catch (error) {
      showError("Erro ao limpar o histórico de perfis de eletricidade.");
      console.error("Clear electricity profiles error:", error);
    }
  };

  const handleDeleteProfile = (id: string) => {
    try {
      deleteElectricityProfile(id);
      showSuccess("Perfil de eletricidade excluído com sucesso!");
    } catch (error) {
      showError("Erro ao excluir perfil de eletricidade.");
      console.error("Delete electricity profile error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Perfis de Eletricidade Registados</h2>
        <div className="flex gap-2">
          <AddElectricityProfileDialog />
          {electricityProfiles.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Limpar Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso removerá permanentemente todos os seus perfis de eletricidade registados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProfiles}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {electricityProfiles.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nenhum Perfil de Eletricidade Registado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Adicione o seu primeiro perfil de eletricidade para começar a gerir!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {electricityProfiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{profile.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <EditElectricityProfileDialog profile={profile} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Excluir Perfil</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso removerá permanentemente o perfil "{profile.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteProfile(profile.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{profile.description || 'Sem descrição'}</p>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <p>Custo por Hora:</p>
                  <p className="text-right font-medium">€{profile.costPerHour.toFixed(2)}/h</p>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground mt-2">
                  Adicionado em: {format(new Date(profile.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ElectricityProfilesPage;