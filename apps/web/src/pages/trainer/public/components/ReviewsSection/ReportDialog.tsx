import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportReviewSchema, type ReportReviewInput } from '@fitnassist/schemas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Textarea,
  Label,
  Select,
  type SelectOption,
} from '@/components/ui';
import { useReportReview } from '@/api/review';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const REASON_OPTIONS: SelectOption[] = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'FAKE', label: 'Fake review' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
];

interface ReportDialogProps {
  reviewId: string;
  open: boolean;
  onClose: () => void;
}

export const ReportDialog = ({ reviewId, open, onClose }: ReportDialogProps) => {
  const reportReview = useReportReview();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReportReviewInput>({
    resolver: zodResolver(reportReviewSchema),
    defaultValues: {
      reviewId,
      reason: undefined as unknown as ReportReviewInput['reason'],
      details: '',
    },
  });

  const reason = watch('reason');

  const onSubmit = async (data: ReportReviewInput) => {
    try {
      await reportReview.mutateAsync(data);
      toast.success('Report submitted. We will review it shortly.');
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Review</DialogTitle>
          <DialogDescription>Please select a reason for reporting this review.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-2 block" htmlFor="report-reason">
              Reason
            </Label>
            <Select
              inputId="report-reason"
              value={REASON_OPTIONS.find((o) => o.value === reason) || null}
              onChange={(opt) => {
                if (opt) {
                  setValue('reason', opt.value as ReportReviewInput['reason'], {
                    shouldValidate: true,
                  });
                }
              }}
              options={REASON_OPTIONS}
              placeholder="Select a reason..."
              isClearable={false}
            />
            {errors.reason && (
              <p className="text-sm text-destructive mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="report-details" className="mb-2 block">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-details"
              {...register('details')}
              placeholder="Provide any additional context..."
              rows={3}
              className="resize-none"
            />
            {errors.details && (
              <p className="text-sm text-destructive mt-1">{errors.details.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={reportReview.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={reportReview.isPending || !reason}
            >
              {reportReview.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
