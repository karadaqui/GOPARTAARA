ALTER TABLE public.profiles 
ADD COLUMN refund_granted boolean NOT NULL DEFAULT false,
ADD COLUMN refund_date timestamp with time zone DEFAULT NULL,
ADD COLUMN first_payment_date timestamp with time zone DEFAULT NULL;