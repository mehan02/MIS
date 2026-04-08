import { z } from 'zod';

const MAX_FILE_SIZE = 300 * 1024 * 1024;
const contactPattern = /^[+()\d\s-]{7,20}$/;

export const requestReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title cannot exceed 200 characters.'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(2000, 'Description cannot exceed 2000 characters.'),
  department: z.string().trim().min(1, 'Department is required.'),
  priority: z.string().trim().min(1, 'Priority is required.'),
  contactNumber: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || contactPattern.test(value), {
      message:
        'Contact Number must be 7-20 characters and contain only digits, spaces, +, -, or parentheses.',
    }),
  files: z
    .array(z.instanceof(File))
    .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE), {
      message: 'Each attachment must be 300 MB or less.',
    }),
});

export type RequestReportForm = z.infer<typeof requestReportSchema>;

export function validateRequestReportForm(data: RequestReportForm): string | null {
  const result = requestReportSchema.safeParse(data);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Invalid request form data.';
}
