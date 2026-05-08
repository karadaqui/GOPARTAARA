DELETE FROM chat_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE buyer_id = '55cf7aae-baef-42c5-80b0-4cf294319f5e');
DELETE FROM conversations WHERE buyer_id = '55cf7aae-baef-42c5-80b0-4cf294319f5e';
DELETE FROM offers WHERE id = '14e7d2de-dd47-41fb-a79a-149e8b5129a6';