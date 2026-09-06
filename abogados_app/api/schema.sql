-- LegalPro App - Tabla para Alwaysdata MySQL
-- Ejecuta esto en phpMyAdmin de Alwaysdata (pestana SQL).

CREATE TABLE IF NOT EXISTS registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  valor TEXT,
  creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
