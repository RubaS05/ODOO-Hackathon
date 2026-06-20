import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, User } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/Card';
import { apiService } from '../services/api';

const loginSchema = z.object({
  emailOrUsername: z.string().min(3, { message: 'Username or Email must be at least 3 characters' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters' }),
  rememberMe: z.boolean().optional(),
});

type LoginSchemaInput = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginSchemaInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiService.auth.login(data.emailOrUsername, data.password);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Try admin / admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md glass border border-border/40 shadow-2xl relative z-10">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl mb-4 shadow-xl shadow-primary/20">
            G
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight">Welcome to GastroPOS</CardTitle>
          <CardDescription className="text-muted-foreground mt-1.5">
            Log in to manage orders, tables, and KDS tickets.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-xs text-destructive font-medium animate-shake">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <User size={16} className="absolute left-3 top-9 text-muted-foreground z-10" />
              <Input
                label="Username or Email"
                id="emailOrUsername"
                placeholder="Enter admin, alice, or chef"
                className="pl-9"
                error={errors.emailOrUsername?.message}
                {...register('emailOrUsername')}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-9 text-muted-foreground z-10" />
              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="Enter password (any character)"
                className="pl-9"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 bg-background"
                  {...register('rememberMe')}
                />
                Remember Me
              </label>
              
              <span className="text-xs font-bold text-primary hover:underline cursor-pointer">
                Forgot Password?
              </span>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2 cursor-pointer font-bold">
              Sign In
            </Button>

            <div className="text-center mt-6 text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Sign Up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
