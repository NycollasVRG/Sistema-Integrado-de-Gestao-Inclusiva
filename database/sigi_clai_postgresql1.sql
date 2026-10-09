SELECT
    event_object_table AS tabela,
    trigger_name AS gatilho
FROM information_schema.triggers
WHERE trigger_schema = 'sigi'
ORDER BY event_object_table, trigger_name;