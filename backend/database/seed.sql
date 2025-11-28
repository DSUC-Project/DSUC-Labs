-- seed.sql — minimal seed for DSUC Lab (2 members)
-- Run this AFTER schema.sql has been applied.

TRUNCATE TABLE finance_requests, resources, repos, bounties, events, projects, members RESTART IDENTITY CASCADE;

INSERT INTO members (
  id, full_name, email, phone, wallet_address, avatar_url, bio, bank_info, user_id, created_at, updated_at
) VALUES
  (
    '2001001',
    'Nguyễn Văn A',
    'nva@example.com',
    '+84900000001',
    '0xAbC1234567890abcdef',
    'https://example.com/avatars/nva.png',
    'Thành viên thử nghiệm 1',
    '{"bank":"Vietcombank","account":"0123456789","name":"Nguyễn Văn A"}'::jsonb,
    gen_random_uuid(),
    now(),
    now()
  ),
  (
    '2001002',
    'Trần Thị B',
    'ttb@example.com',
    '+84900000002',
    '0xDef0987654321fedcba',
    NULL,
    'Thành viên thử nghiệm 2',
    '{"bank":"BIDV","account":"9876543210","name":"Trần Thị B"}'::jsonb,
    NULL,
    now(),
    now()
  );

