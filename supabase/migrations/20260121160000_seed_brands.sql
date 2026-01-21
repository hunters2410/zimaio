-- Insert some common Zimbabwean and International Brand names
INSERT INTO brands (name, slug, is_active)
VALUES 
    ('Econet', 'econet', true),
    ('NetOne', 'netone', true),
    ('Telecel', 'telecel', true),
    ('Innscor', 'innscor', true),
    ('Simbisa', 'simbisa', true),
    ('OK Zimbabwe', 'ok-zimbabwe', true),
    ('Pick n Pay', 'pick-n-pay', true),
    ('Delta Corporation', 'delta', true),
    ('Seed Co', 'seed-co', true),
    ('ZOL Zimbabwe', 'zol', true),
    ('Apple', 'apple', true),
    ('Samsung', 'samsung', true),
    ('Sony', 'sony', true),
    ('Nike', 'nike', true),
    ('Adidas', 'adidas', true),
    ('HP', 'hp', true),
    ('Dell', 'dell', true),
    ('Microsoft', 'microsoft', true),
    ('Lenovo', 'lenovo', true),
    ('Google', 'google', true)
ON CONFLICT (slug) DO NOTHING;
