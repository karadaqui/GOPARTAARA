UPDATE public.blog_posts
SET
  title = regexp_replace(title, '(?<![A-Za-z])PARTARA(?![A-Za-z])', 'GOPARTARA', 'g'),
  preview = regexp_replace(preview, '(?<![A-Za-z])PARTARA(?![A-Za-z])', 'GOPARTARA', 'g'),
  meta_description = regexp_replace(meta_description, '(?<![A-Za-z])PARTARA(?![A-Za-z])', 'GOPARTARA', 'g'),
  content = regexp_replace(content, '(?<![A-Za-z])PARTARA(?![A-Za-z])', 'GOPARTARA', 'g')
WHERE
  title ~ '(?<![A-Za-z])PARTARA(?![A-Za-z])'
  OR preview ~ '(?<![A-Za-z])PARTARA(?![A-Za-z])'
  OR meta_description ~ '(?<![A-Za-z])PARTARA(?![A-Za-z])'
  OR content ~ '(?<![A-Za-z])PARTARA(?![A-Za-z])';