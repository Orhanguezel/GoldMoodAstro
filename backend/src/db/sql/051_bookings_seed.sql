INSERT INTO bookings (
  id, user_id, name, email, phone, locale, consultant_id, resource_id, slot_id,
  appointment_date, appointment_time, session_duration, session_price, media_type, status,
  customer_note, customer_message
) VALUES (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'Test Kullanici',
  'user@example.test',
  '+905559999999',
  'tr',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '2026-04-27',
  '10:00',
  30,
  '850.00',
  'audio',
  'confirmed',
  'Dogum haritasi uzerinden genel yorum istiyorum.',
  'Dogum haritasi uzerinden genel yorum istiyorum.'
)
ON DUPLICATE KEY UPDATE status = VALUES(status), session_price = VALUES(session_price);

INSERT INTO slot_reservations (id, slot_id, reserved_count)
VALUES ('33000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001',1)
ON DUPLICATE KEY UPDATE reserved_count = VALUES(reserved_count);
