CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- En production, stocker des mots de passe hashés
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
);

CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    cin VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    birthDate DATE NOT NULL,
    facebookName VARCHAR(100),
    profession VARCHAR(100),
    height DECIMAL(5,2) -- Stocke la taille en mètres (ex: 1.75)
);

CREATE TABLE contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    memberId INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    paidAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paiement BOOLEAN default FALSE,

    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
);



-- Insertion des utilisateurs
INSERT INTO users (username, password, role) VALUES
('admin', 'admin', 'admin'),
('user1', 'user1', 'user'),
('user2', 'user2', 'user');

-- Insertion des membres
INSERT INTO members (firstName, lastName, cin, phone, email, birthDate, facebookName, profession, height) VALUES
('Jean', 'Dupont', '1234567890123', '+261341234567', 'jean.dupont@example.com', '1990-05-15', 'JeanD', 'Ingénieur', 1.75),
('Marie', 'Randria', '9876543210987', '+261324567890', 'marie.randria@example.com', '1985-08-20', 'MarieR', 'Médecin', 1.68),
('Ali', 'Hassan', '5678901234567', '+261330987654', 'ali.hassan@example.com', '1992-12-10', 'AliH', 'Comptable', 1.80);

-- Insertion des cotisations
INSERT INTO contributions (memberId, month, year, paidAt, paiement) VALUES
(1, 1, 2024, '2024-01-10 14:30:00', false),
(1, 2, 2024, '2024-02-15 11:20:00', true),
(2, 1, 2024, '2024-01-05 09:45:00', false),
(2, 3, 2024, '2024-03-18 16:10:00', false),
(3, 2, 2024, '2024-02-25 13:00:00', false);
