
-- Delete 5 older duplicates
DELETE FROM public.blog_posts WHERE id IN (
  'bd9933f0-a24b-4c6f-be7e-eeea6801467f', -- Top 10 Car Parts (Apr 8, older)
  '549b6e62-c5da-4dd8-a1af-9451675feac5', -- Most Searched (Apr 8 02:24, older)
  '8fbc8a6a-3f9b-423a-b325-0ff14909a0b2', -- DIY Car Repairs (Apr 8 02:24, older)
  'fbea376f-af69-4114-9a85-784edc87c6f8', -- Counterfeit (Apr 8, older)
  '3b05c412-d8e1-4149-80dd-a95c1e70d1ce'  -- Electric Vehicle (Apr 8, older)
);

-- Fix missing previews
UPDATE public.blog_posts
SET preview = 'Find out which car parts fit your make and model, why compatibility matters, and how to avoid costly mistakes when buying online.'
WHERE id = '76a18289-92df-4251-840f-07fe7a0726af';

UPDATE public.blog_posts
SET preview = 'A practical look at the most replaced parts on the UK''s most popular cars and how to save money when it''s time to repair.'
WHERE id = '46b43671-23ea-4f3c-b780-0883622cc1a0';

UPDATE public.blog_posts
SET preview = 'See which car parts are trending this week, why demand is surging, and how to grab the best deals before stock runs out.'
WHERE id = '13e091a4-89c5-4ef2-b1f3-3cc7ad32d6e7';
