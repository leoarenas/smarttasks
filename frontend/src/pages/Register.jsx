import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail, CheckCircle, Copy } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [verificationLink, setVerificationLink] = useState(null);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await register(email);
            setRegistered(true);
            
            if (response.verification_link) {
                setVerificationLink(response.verification_link);
                toast.info('Email no configurado. Usa el link de verificación directamente.');
            } else {
                toast.success('¡Registro exitoso! Revisa tu email.');
            }
        } catch (error) {
            const message = error.response?.data?.detail || 'Error al registrarse';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(verificationLink);
        toast.success('Link copiado al portapapeles');
    };

    if (registered) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="space-y-1 text-center">
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <CardTitle className="font-heading text-2xl">¡Revisa tu email!</CardTitle>
                            <CardDescription>
                                Hemos enviado un enlace de verificación a <strong>{email}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {verificationLink && (
                                <Alert className="bg-yellow-50 border-yellow-200">
                                    <Mail className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                        <p className="font-medium mb-2">Modo de prueba activo</p>
                                        <p className="text-sm mb-3">El sistema de email no está configurado. Usa este enlace directamente:</p>
                                        <div className="flex gap-2">
                                            <Input 
                                                value={verificationLink} 
                                                readOnly 
                                                className="text-xs bg-white"
                                                data-testid="verification-link-input"
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={copyLink}
                                                data-testid="copy-link-btn"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <a 
                                            href={verificationLink} 
                                            className="inline-block mt-3 text-primary hover:underline font-medium"
                                            data-testid="verification-link"
                                        >
                                            Ir a verificar mi cuenta
                                        </a>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="text-center text-sm text-muted-foreground">
                                <p>¿No recibiste el email?</p>
                                <Button 
                                    variant="link" 
                                    className="text-primary p-0 h-auto"
                                    onClick={() => setRegistered(false)}
                                >
                                    Intentar de nuevo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al inicio
                </Link>
                
                <Card className="border-border shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="font-heading text-2xl">Crear cuenta</CardTitle>
                        <CardDescription>
                            Ingresa tu email para comenzar tu diagnóstico operativo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    data-testid="register-email-input"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={loading}
                                data-testid="register-submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    'Registrarme gratis'
                                )}
                            </Button>
                        </form>
                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Register;
