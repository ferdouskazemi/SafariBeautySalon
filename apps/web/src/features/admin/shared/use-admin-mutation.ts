import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/shared/lib/http';

interface AdminMutationOptions<TVariables, TResult> {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** Queries to refetch after success. */
  invalidates: QueryKey[];
  successMessage?: string;
}

/** Mutation with the panel's standard behaviour: refetch affected data, toast the outcome. */
export function useAdminMutation<TVariables = void, TResult = unknown>({
  mutationFn,
  invalidates,
  successMessage,
}: AdminMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidates.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (successMessage) toast.success(successMessage);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
