import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';
import { changeEmail, changePassword } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks';
import {
  changeEmailFormSchema,
  changePasswordFormSchema,
  type ChangeEmailFormInput,
  type ChangePasswordFormInput,
} from '@fitnassist/schemas';

const nameFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const AccountTab = () => {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [nameSuccess, setNameSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateName = trpc.user.updateName.useMutation({
    onSuccess: () => {
      setNameSuccess(true);
      utils.invalidate();
    },
  });

  const nameForm = useForm<z.infer<typeof nameFormSchema>>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const emailForm = useForm<ChangeEmailFormInput>({
    resolver: zodResolver(changeEmailFormSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onEmailSubmit = async (data: ChangeEmailFormInput) => {
    setEmailError(null);
    setEmailSuccess(false);

    try {
      const result = await changeEmail({
        newEmail: data.newEmail,
      });
      if (result.error) {
        setEmailError(result.error.message || 'Failed to change email. Please try again.');
        return;
      }
      setEmailSuccess(true);
      emailForm.reset();
    } catch (error) {
      setEmailError(
        error instanceof Error ? error.message : 'Failed to change email. Please try again.'
      );
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormInput) => {
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Failed to change password. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Display Name
          </CardTitle>
          <CardDescription>
            Update the name displayed on your profile and throughout the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={nameForm.handleSubmit((data) => {
              setNameSuccess(false);
              updateName.mutate(data);
            })}
            className="space-y-4"
          >
            {nameSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm">
                Name updated successfully!
              </div>
            )}

            {updateName.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                {updateName.error.message}
              </div>
            )}

            <div>
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                {...nameForm.register('name')}
              />
              {nameForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {nameForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={updateName.isPending}>
              {updateName.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Name
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change Email
          </CardTitle>
          <CardDescription>
            Update your email address. You'll need to verify the new email before it takes effect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            {emailSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                Verification email sent! Please check your inbox to confirm your new email address.
              </div>
            )}

            {emailError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {emailError}
              </div>
            )}

            <div>
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="your.new@email.com"
                {...emailForm.register('newEmail')}
              />
              {emailForm.formState.errors.newEmail && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.newEmail.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="emailCurrentPassword">Current Password</Label>
              <Input
                id="emailCurrentPassword"
                type="password"
                placeholder="Enter your current password"
                {...emailForm.register('currentPassword')}
              />
              {emailForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password. Use a strong password with at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                Password updated successfully!
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {passwordError}
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter your current password"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
