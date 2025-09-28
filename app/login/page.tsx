
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number with country code.'),
  otp: z.string().length(6, 'OTP must be 6 digits.').optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: 'worker@gmail.com',
      password: '@Asha555',
    },
  });

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
      otp: '',
    },
  });

  const onEmailSubmit: SubmitHandler<EmailFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Welcome back!' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
    });
  };

  const onPhoneSubmit: SubmitHandler<PhoneFormValues> = async (data) => {
    setIsLoading(true);
    if (!otpSent) {
      try {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, data.phone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast({ title: 'OTP Sent', description: 'Please check your phone for the OTP.' });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'OTP Failed',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (confirmationResult && data.otp) {
        try {
          await confirmationResult.confirm(data.otp);
          toast({ title: 'Welcome!' });
          router.push('/');
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'The OTP is incorrect. Please try again.',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-4 mb-8">
        <Icons.Logo className="size-12 text-primary" />
        <h1 className="text-4xl font-headline font-bold">JalSuraksha</h1>
      </div>
      <Tabs defaultValue="email" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email & Password</TabsTrigger>
          <TabsTrigger value="phone">Phone OTP</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Login
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="phone">
          <Card>
            <CardHeader>
              <CardTitle>Phone Login</CardTitle>
              <CardDescription>
                {otpSent ? 'Enter the OTP sent to your phone.' : 'Enter your phone number to receive an OTP.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...phoneForm}>
                <form
                  onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                  className="space-y-6"
                >
                  {!otpSent && (
                     <FormField
                        control={phoneForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 98765 43210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  )}
                  {otpSent && (
                    <FormField
                      control={phoneForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div id="recaptcha-container"></div>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {otpSent ? 'Verify OTP' : 'Send OTP'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
