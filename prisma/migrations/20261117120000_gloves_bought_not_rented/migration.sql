-- Gloves are now bought and kept, 800,000 VND a pair (owner, 2026-11-17).
UPDATE "AddOn"
SET "price" = 800000,
    "description" = 'Yours to keep: no need to return them. Price per pair.'
WHERE "slug" = 'gloves';
