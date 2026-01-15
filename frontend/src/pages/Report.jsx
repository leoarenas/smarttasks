import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
    ArrowLeft, 
    Download, 
    Loader2, 
    CheckCircle, 
    Users, 
    Zap, 
    Trash2,
    FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Report = () => {
    const { user } = useAuth();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const response = await axios.get(`${API}/report`);
            setReport(response.data);
        } catch (error) {
            toast.error('Error al cargar el informe');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!report) return;

        const data = report.tasks.map(task => ({
            'Tarea': task.name,
            'Descripción': task.description,
            'Frecuencia': task.frequency,
            'Duración': task.duration,
            'Impacto': task.impact || '-',
            'Riesgo': task.risk || '-',
            'Esfuerzo': task.effort || '-',
            'Confidencialidad': task.confidentiality || '-',
            'Decisión': task.decision === 'C' ? 'Conservar' :
                        task.decision === 'D' ? 'Delegar' :
                        task.decision === 'A' ? 'Automatizar' :
                        task.decision === 'E' ? 'Eliminar' : 'Sin analizar',
            'Justificación': task.decision_justification || '-',
            'Perfil sugerido': task.suggested_profile || '-',
            'Horas sugeridas': task.suggested_hours || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tareas');

        // Add summary sheet
        const summaryData = [
            { 'Métrica': 'Total de tareas', 'Valor': report.stats.total },
            { 'Métrica': 'Tareas analizadas', 'Valor': report.stats.analyzed },
            { 'Métrica': 'Conservar', 'Valor': report.stats.conservar },
            { 'Métrica': 'Delegar', 'Valor': report.stats.delegar },
            { 'Métrica': 'Automatizar', 'Valor': report.stats.automatizar },
            { 'Métrica': 'Eliminar', 'Valor': report.stats.eliminar }
        ];
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `SmartTasks_Informe_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        toast.success('Informe exportado exitosamente');
    };

    const getFilteredTasks = () => {
        if (!report) return [];
        if (filter === 'all') return report.tasks;
        const decisionMap = { conservar: 'C', delegar: 'D', automatizar: 'A', eliminar: 'E' };
        return report.tasks.filter(task => task.decision === decisionMap[filter]);
    };

    const getDecisionBadge = (decision) => {
        const badges = {
            C: { label: 'Conservar', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            D: { label: 'Delegar', class: 'bg-green-100 text-green-800 border-green-200' },
            A: { label: 'Automatizar', class: 'bg-blue-100 text-blue-800 border-blue-200' },
            E: { label: 'Eliminar', class: 'bg-red-100 text-red-800 border-red-200' }
        };
        return badges[decision] || { label: 'Sin analizar', class: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const getPercentage = (value, total) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredTasks = getFilteredTasks();

    return (
        <div className="min-h-screen bg-secondary">
            {/* Header */}
            <header className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/dashboard">
                        <h1 className="font-heading text-2xl font-bold text-foreground">SmartTasks</h1>
                    </Link>
                    <Button onClick={exportToExcel} data-testid="export-excel-btn">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Exportar Excel
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al dashboard
                </Link>

                <div className="mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground">Informe de Diagnóstico</h2>
                    <p className="text-muted-foreground mt-1">
                        Resumen ejecutivo de tus tareas analizadas
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <Card className="col-span-2 md:col-span-1 bg-background">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-heading font-bold text-foreground">{report?.stats.total || 0}</p>
                                <p className="text-sm text-muted-foreground mt-1">Total tareas</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-heading font-bold text-yellow-800">{report?.stats.conservar || 0}</p>
                                <p className="text-sm text-yellow-700 mt-1">Conservar</p>
                                <p className="text-xs text-yellow-600">{getPercentage(report?.stats.conservar, report?.stats.analyzed)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-heading font-bold text-green-800">{report?.stats.delegar || 0}</p>
                                <p className="text-sm text-green-700 mt-1">Delegar</p>
                                <p className="text-xs text-green-600">{getPercentage(report?.stats.delegar, report?.stats.analyzed)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-heading font-bold text-blue-800">{report?.stats.automatizar || 0}</p>
                                <p className="text-sm text-blue-700 mt-1">Automatizar</p>
                                <p className="text-xs text-blue-600">{getPercentage(report?.stats.automatizar, report?.stats.analyzed)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-heading font-bold text-red-800">{report?.stats.eliminar || 0}</p>
                                <p className="text-sm text-red-700 mt-1">Eliminar</p>
                                <p className="text-xs text-red-600">{getPercentage(report?.stats.eliminar, report?.stats.analyzed)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtered Tasks */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="font-heading">Detalle de Tareas</CardTitle>
                            <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
                                <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                                    <TabsTrigger value="all" data-testid="filter-all">Todas</TabsTrigger>
                                    <TabsTrigger value="conservar" data-testid="filter-conservar" className="text-yellow-700">C</TabsTrigger>
                                    <TabsTrigger value="delegar" data-testid="filter-delegar" className="text-green-700">D</TabsTrigger>
                                    <TabsTrigger value="automatizar" data-testid="filter-automatizar" className="text-blue-700">A</TabsTrigger>
                                    <TabsTrigger value="eliminar" data-testid="filter-eliminar" className="text-red-700">E</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No hay tareas en esta categoría
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full" data-testid="report-table">
                                    <thead className="border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tarea</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Frecuencia</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duración</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">I/R/E</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Decisión</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Perfil Sugerido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTasks.map((task) => {
                                            const badge = getDecisionBadge(task.decision);
                                            return (
                                                <tr key={task.id} className="hover:bg-secondary/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <p className="font-medium text-foreground">{task.name}</p>
                                                        {task.decision_justification && (
                                                            <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                                                {task.decision_justification}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-muted-foreground">{task.frequency}</td>
                                                    <td className="px-4 py-4 text-sm text-muted-foreground">{task.duration}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs text-muted-foreground">
                                                            {task.impact || '-'}/{task.risk || '-'}/{task.effort || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-sm border ${badge.class}`}>
                                                            <span className="font-bold mr-1">{task.decision || '?'}</span>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {task.suggested_profile ? (
                                                            <div>
                                                                <p className="text-sm text-foreground">{task.suggested_profile}</p>
                                                                <p className="text-xs text-primary">{task.suggested_hours}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default Report;
