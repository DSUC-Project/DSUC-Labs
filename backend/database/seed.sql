-- Seed mock data for DSUC Lab (15 members with explicit student ID as id)

INSERT INTO members (id, name, role, avatar, skills, socials, wallet_address)
VALUES
('101240059', 'Zah', 'President', 'https://ibb.co/v4c7S9ry', ARRAY['Rust','Next.js','Node.js']::text[], '{"github":"https://github.com/lilzahs"}'::jsonb, '{"bankId":"970422","accountNo":"06271099999"}'::jsonb, 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm');
('101240060', 'Thodium', 'Vice-President', 'https://ibb.co/XxVBkK4b', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('102240396', 'Jerry', 'Vice-President', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('101240071', 'Huyz', 'Media-Lead', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('102240386', 'Neko Nora', 'Tech-Lead', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210006', 'Member 06', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210007', 'Member 07', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210008', 'Member 08', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210009', 'Member 09', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210010', 'Member 10', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr10xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210011', 'Member 11', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr11xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210012', 'Member 12', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr12xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210013', 'Member 13', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr13xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210014', 'Member 14', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr14xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('20210015', 'Member 15', 'Member', '', ARRAY[]::text[], '{}'::jsonb, 'WalletAddr15xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
-- minimal other seeds
INSERT INTO projects (name, description, category, builders, link, repo_link)
VALUES
('ZAH Wallet', 'On-chain wallet for students', 'Wallet', ARRAY['20210001','20210002'], '', '');

INSERT INTO events (title, date, time, location)
VALUES
('Hackathon Kickoff', '2025-12-01', '18:00', 'Auditorium');

INSERT INTO bounties (title, reward, difficulty, tags)
VALUES
('Implement auth', '200', 'Medium', ARRAY['backend','auth']);

INSERT INTO repos (name, description, language, stars)
VALUES
('dsuc-website', 'Club website', 'TypeScript', 10);

INSERT INTO resources (name, type, url, size, category)
VALUES
('Intro to Solana', 'pdf', 'https://drive.google.com/example', '2MB', 'Learning');
