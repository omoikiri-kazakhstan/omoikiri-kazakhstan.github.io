<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

$directory = dirname(__DIR__) . '/backups';
if (!is_dir($directory) && !mkdir($directory, 0700, true)) {
    throw new RuntimeException('Could not create backup directory');
}
chmod($directory, 0700);
$path = $directory . '/staging-db-' . gmdate('Ymd-His') . '.sql';
$temporary = $path . '.tmp';
$output = fopen($temporary, 'xb');
if ($output === false) throw new RuntimeException('Could not create backup');
chmod($temporary, 0600);

try {
    $db = database();
    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
        throw new RuntimeException('Backup requires MariaDB');
    }
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    fwrite($output, "-- OMOIKIRI staging database backup\nSET FOREIGN_KEY_CHECKS=0;\n");
    $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    $db->beginTransaction();
    $rows = 0;
    foreach ($tables as $table) {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
            throw new RuntimeException('Unexpected table name');
        }
        $quotedTable = '`' . $table . '`';
        $definition = $db->query('SHOW CREATE TABLE ' . $quotedTable)->fetch(PDO::FETCH_NUM);
        if (!$definition || !isset($definition[1])) throw new RuntimeException('Missing table definition');
        fwrite($output, "\nDROP TABLE IF EXISTS {$quotedTable};\n{$definition[1]};\n");
        $query = $db->query('SELECT * FROM ' . $quotedTable);
        while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
            $columns = array_map(static fn(string $name): string => '`' . $name . '`', array_keys($row));
            $values = array_map(static fn(mixed $value): string => $value === null ? 'NULL' : $db->quote((string) $value), array_values($row));
            fwrite($output, 'INSERT INTO ' . $quotedTable . ' (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $values) . ");\n");
            $rows++;
        }
    }
    $db->commit();
    fwrite($output, "SET FOREIGN_KEY_CHECKS=1;\n");
    fclose($output);
    if (!rename($temporary, $path)) throw new RuntimeException('Could not finalize backup');
    $source = fopen($path, 'rb');
    if ($source === false) throw new RuntimeException('Could not reopen backup');
    $parts = 0;
    try {
        while (!feof($source)) {
            $chunk = fread($source, 60000);
            if ($chunk === false) throw new RuntimeException('Could not read backup');
            if ($chunk === '') break;
            $partPath = $path . '.part' . sprintf('%03d', ++$parts) . '.txt';
            if (file_put_contents($partPath, base64_encode($chunk), LOCK_EX) === false) {
                throw new RuntimeException('Could not write backup part');
            }
            chmod($partPath, 0600);
        }
    } finally {
        fclose($source);
    }
    echo json_encode(['file' => basename($path), 'tables' => count($tables), 'rows' => $rows,
        'bytes' => filesize($path), 'sha256' => hash_file('sha256', $path),
        'parts' => $parts], JSON_THROW_ON_ERROR) . "\n";
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    if (is_resource($output)) fclose($output);
    @unlink($temporary);
    fwrite(STDERR, 'Database backup failed: ' . $error->getMessage() . "\n");
    exit(1);
}
