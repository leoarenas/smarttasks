import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Mail, Key, Info } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        resend_api_key: '',
        sender_email: '',
        app_name: 'SmartTasks'
    });
    const [newApiKey, setNewApiKey] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${API}/config`);
            setConfig(response.data);
        } catch (error) {
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updateData = {
                sender_email: config.sender_email,
                app_name: config.app_name
            };
            
            // Only send API key if a new one was entered
            if (newApiKey) {
                updateData.resend_api_key = newApiKey;
            }

            await axios.put(`${API}/config`, updateData);
            toast.success('Configuración guardada');
            setNewApiKey('');
            fetchConfig();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary">
            {/* Header */}
            <header className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link to="/dashboard">
                        <h1 className="font-heading text-2xl font-bold text-foreground">SmartTasks</h1>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-6 py-8">
                <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al dashboard
                </Link>

                <div className="mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground">Configuración</h2>
                    <p className="text-muted-foreground mt-1">
                        Configura los parámetros del sistema
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading text-lg">General</CardTitle>
                            <CardDescription>Configuración básica de la aplicación</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="app_name">Nombre de la aplicación</Label>
                                <Input
                                    id="app_name"
                                    value={config.app_name}
                                    onChange={(e) => setConfig({...config, app_name: e.target.value})}
                                    placeholder="SmartTasks"
                                    data-testid="app-name-input"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Configuración de Email
                            </CardTitle>
                            <CardDescription>Configura Resend para enviar emails de verificación</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800 text-sm">
                                    <p className="font-medium mb-1">¿Cómo obtener una API key de Resend?</p>
                                    <ol className="list-decimal list-inside space-y-1 text-xs">
                                        <li>Crea una cuenta en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a></li>
                                        <li>Ve a Dashboard → API Keys → Create API Key</li>
                                        <li>Copia la key (comienza con <code className="bg-blue-100 px-1 rounded">re_</code>)</li>
                                        <li>Para producción, verifica un dominio y usa ese email como remitente</li>
                                    </ol>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label htmlFor="resend_api_key" className="flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    API Key de Resend
                                </Label>
                                {config.resend_api_key && (
                                    <p className="text-xs text-muted-foreground">
                                        Actual: {config.resend_api_key}
                                    </p>
                                )}
                                <Input
                                    id="resend_api_key"
                                    type="password"
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    placeholder={config.resend_api_key ? "Ingresa nueva key para cambiar" : "re_xxxxx..."}
                                    data-testid="resend-api-key-input"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sender_email">Email remitente</Label>
                                <Input
                                    id="sender_email"
                                    type="email"
                                    value={config.sender_email || ''}
                                    onChange={(e) => setConfig({...config, sender_email: e.target.value})}
                                    placeholder="noreply@tudominio.com o onboarding@resend.dev"
                                    data-testid="sender-email-input"
                                />
                                <p className="text-xs text-muted-foreground">
                                    En modo testing puedes usar <code className="bg-muted px-1 rounded">onboarding@resend.dev</code>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={saving} className="w-full" data-testid="save-config-btn">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar configuración
                            </>
                        )}
                    </Button>
                </form>
            </main>
        </div>
    );
};

export default Settings;
