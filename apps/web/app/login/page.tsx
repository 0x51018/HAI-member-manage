'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { login } from '../../lib/auth';
import { useRouter } from 'next/navigation';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type FormData = z.infer<typeof Schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
      router.push('/members');
    } catch (e) {
      alert('로그인 실패');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
      <input placeholder="Email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" placeholder="Password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit" disabled={isSubmitting}>
        로그인
      </button>
    </form>
  );
}
