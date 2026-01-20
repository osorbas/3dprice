import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFExportData {
  printName: string;
  materialCost: number;
  electricityCost: number;
  laborCost: number;
  extrasCost: number;
  baseCost: number;
  profitMargin: number;
  profitAmount: number;
  totalPrice: number;
}

export const exportCalculationToPDF = (data: PDFExportData) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleString("pt-PT");

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Orçamento de Impressão 3D", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${date}`, 14, 30);
  doc.text(`Referência: ${data.printName}`, 14, 35);

  // Costs Table
  const tableData = [
    ["Descrição", "Valor (€)"],
    ["Custo de Filamento", data.materialCost.toFixed(2)],
    ["Custo de Energia", data.electricityCost.toFixed(2)],
    ["Mão de Obra", data.laborCost.toFixed(2)],
  ];

  if (data.extrasCost > 0) {
    tableData.push(["Custos Extras", data.extrasCost.toFixed(2)]);
  }

  autoTable(doc, {
    startY: 45,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: "striped",
    headStyles: { fillColor: [249, 115, 22] }, // Orange primary
  });

  // Summary Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Custo Base: €${data.baseCost.toFixed(2)}`, 14, finalY);
  doc.text(`Margem de Lucro (${data.profitMargin}%): €${data.profitAmount.toFixed(2)}`, 14, finalY + 7);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text(`Preço Final: €${data.totalPrice.toFixed(2)}`, 14, finalY + 18);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("3D Print Price Calculator - Gerado automaticamente", 14, doc.internal.pageSize.height - 10);

  doc.save(`Orcamento_${data.printName.replace(/\s+/g, "_")}.pdf`);
};