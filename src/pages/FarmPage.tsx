"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrinters } from "@/hooks/use-printers";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Printer, Activity, Clock, AlertCircle } from "lucide-react";

const FarmPage = () => {
  const { printers } = usePrinters();

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Print Farm</h1>
        <p className="text-muted-foreground">Monitorização e gestão da tua frota de impressoras.</p>
      </div>

      {printers.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nenhuma impressora registada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Regista impressoras nas Definições para as visualizares aqui na Farm.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer) => (
            <Card key={printer.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{printer.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{printer.brand} {printer.model}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                    Pronta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-xs">
                      <p className="text-muted-foreground">Uso Total</p>
                      <p className="font-semibold">{Math.floor(printer.workingHours)}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="text-xs">
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-semibold">Idle</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Manutenção Preventiva</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Revisão sugerida daqui a 50h
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmPage;