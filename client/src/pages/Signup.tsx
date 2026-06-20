import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/Card';
import { apiService } from '../services/api';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupSchemaInput = z.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignupSchemaInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupSchemaInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiService.auth.signup(data.fullName, data.email, data.username);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
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
          <CardTitle className="text-2xl font-extrabold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground mt-1.5">
            Register a new staff or employee account.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Registration Successful</h3>
                <p className="text-sm text-muted-foreground">
                  The employee account has been created successfully. You can now log in.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full font-bold">Go to Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-3 top-9 text-muted-foreground z-10" />
                <Input
                  label="Full Name"
                  id="fullName"
                  placeholder="e.g. John Doe"
                  className="pl-9"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              </div>

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-9 text-muted-foreground z-10" />
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="e.g. john@pos.com"
                  className="pl-9"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="relative">
                <User size={16} className="absolute left-3 top-9 text-muted-foreground z-10" />
                <Input
                  label="Username"
                  id="username"
                  placeholder="e.g. johndoe"
                  className="pl-9"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-9 text-muted-foreground z-10" />
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  className="pl-9"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full mt-2 cursor-pointer font-bold">
                Create Account
              </Button>

              <div className="text-center mt-6 text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Log In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
